// import { Promise } from 'mongoose';

// user has multiple tasks, host task / guest task
// task has task gps, set by host task
// distance between user and task need to be close enough to mark user attended task, task will record user

// data rules: no duplicated code, members and membersIn is email
// loc: [lat, lon]
const vars = require('../config/vars');
const lib = require('../lib/lib1');
const mongoose = require('mongoose');
const User = require('./user');

const TaskSchema = mongoose.Schema({
    /** OWNER */
    user_id:{type:String, required:true} /* from idToken.uid, from header */
    ,user_email:{type:String, required: true} /* from idToken.email, from header */
    ,phone:{type:String, default:""}

    /** WHAT */
    ,title:{type:String, required:true} /* Title of the event */
    ,description:{type:String, default:""} /*Description of th event */
    ,subtitle:{type:String, default:""} /*Subtitle of the event */
    ,price:{type:Number, default:1} /* in task point to be transfered from owner to candidate once task is done
        in user doc, there is "money" attribute
    */

    /** WHERE */
    ,lat:{type:Number, default:""} /* Latitude of the event */
    ,lon:{type:Number, default:""} /* Longitude of the event */
    ,address:{type:String, default:""}  /* owner need to type address. Can android get gps[lat, lon] out of address? what if publisher is not at job location? */
    ,radius:{type:Number, default:10}  /* radius, within radius will be marked as attended, within valid duration */

    /** WHEN */
    ,date:{type:String, default:""} /* ddmmyyyy, start date of task, host/admin will postpond task by changing date, search task might need to filter if date expired or not */
    ,startTime:{type:String, default:""} /*The start time of the event */
    ,endTime:{type:String, default:""} /*The end time of the event */

    /** WHO */
    ,candidates:{type:[String]}  /* candidates' id from idToken.uid or idToken.user_id*/
    ,candidate_hired:{type:String, default:""} /* 1 candidate's id who is hired by owner */
 
    /* TASK STATE */
    ,state:{type:Number, default:0} 
    /* state -
        0: task just get created by owner,
            users(not owner) login & apply task, and user's uid will be added to "candidates" array, so owner can see(firebase need to notify owner about new candidate). 
        1: owner maked job offer a candidate(candate need to login & apply it first, then owner can provide offer to 1 candidate), 
        2: candidate accepted offer => "candidate_hired" get populated (firebase notify owner for offer accepted), task will get locked (stop receiving new candidates)
                                     owner's points (price of task)
           if a candidate rejects offer, state change back to 0 (firebase notify owner).   
           owner can cancel offer before it is accepted by candidate (firebase notify .
        3: candidate claims task completed  => candidate press "complete" button, firebase notifys owner task completion
            if candidate didn't complete task (abort), state change back to 0 (firebase notify owner)
        4: owner confirms task completed => points get transferred from owner to candidate. Task closed
            if owner claims task not completed, state change to -4 (admin person will get involved for dispute)
        -1: admin person terminates/suspends task (firebase notify owner)
        */

},{collection:'task'});
// taskStartTime:{type: Date, default: Date.now},

//coordinates:req.body.coordinates.split(',').map(Number)

//var distance = require('gps-distance');
// Measure between two points: 
//var result = distance(45.527517, -122.718766, 45.373373, -121.693604);

const Task = module.exports = mongoose.model('task',TaskSchema);

module.exports.getTaskById_p = (id) => { //Query for a single task based on _id
    return new Promise((resolve, reject) => { 
        Task.findById({"_id":id}, (err, data) => {
            if(err){ //If error, reject with error message
                reject(err)
            }else{ //Otherwise resolve data
                resolve(data)
            }
        }); // id refers to _id. When mongodb saves an data object(document) into collection, it creats unique _id within the document, as an additional attribute

    });
};


module.exports.getApplicableTasks = () =>{ //Query for all tasks in the database
    return new Promise((resolve,reject)=>{
        Task.find({"state":0},(err,data)=>{
            if(err) reject(err);
            resolve(data);
        });
    })
};

module.exports.findAll_p = () =>{ //Query for all tasks in the database
    return new Promise((resolve,reject)=>{
        Task.find({},(err,data)=>{
            if(err) reject(err);
            resolve(data);
        });
    })
};


module.exports.addTask_p = (newTask) =>{ //Add a single task to the database
    return new Promise((resolve, reject) => {
        newTask.save((err,data)=>{
            if(err){
                reject(err)
            }else{
                resolve(data)
            }
        })
    });
};

//Find all tasks by search criteria
module.exports.getTasksByUserId_p = (user_id)=>{ //Find all tasks hosted by a specific user_id
    return new Promise((resolve,reject) =>{
        Task.find({user_id:user_id}, (err,data)=>{
            if(err) reject(err);
            resolve(data);
        });
    });
};
module.exports.getTasksByCandidateId_p = (user_id)=>{ //Find all tasks in which a user_id is a candidate
    return new Promise((resolve,reject) =>{
        Task.find({candidates:user_id}, (err,data)=>{
            if(err) reject(err);
            resolve(data);
        });
    });
};

// get task that are completed
module.exports.getTasksCompleted_p = (user_id)=>{  //Find all tasks that are completed by a specific user_id
    console.log("user_id: " + user_id);
    return new Promise((resolve,reject) =>{
        Task.find({candidate_hired:user_id, state:4}, (err,data)=>{
            if(err) reject(err);
            resolve(data);
        });
    });
};


module.exports.updateTask_p = (newTask) =>{ //Find a specific task and update it with new data
    return new Promise((resolve, reject) => {
        console.log("-- in mongoose : "+newTask);
        let _id = newTask._id;
        delete newTask._id
        
        Task.findOneAndUpdate({"_id":_id}, newTask,{new: true}, (err, data) => {
            if(err){
                reject(err);
            }else{
                resolve(data);
            }
        })
    });
};

/** use promise.all */
module.exports.offerTask = (taskId, owner_user_id, candidate_user_id) =>{ // Offer task as an owner (cannot offer to self)
    return new Promise((resolve, reject) =>{
        Task.findById({"_id" : taskId}, (err, data) =>{
            if(err){reject(err);}
            else{
                if(data.user_id != owner_user_id){
                    reject("Error: You're not the owner of the task! You cannot offer this task to anyone!");
                    return;
                }else{
                    if(data.state == 2){
                        reject("Error: Task is already offered to some applicant!");
                        return;
                    }
                    /** now before changes, make a backup in case of rolling back */
                    const taskJsonBackup = JSON.parse(JSON.stringify(data))
                    console.log("## taskJsonBackup=>")
                    console.log(taskJsonBackup)
                    if(data.candidate_hired == undefined || data.candidate_hired == null || data.candidate_hired ==""){
                        if(lib.arrayContains(data.candidates, candidate_user_id)){
                            // task not offered, candidate is in data.candidats, then can hire
                            data.candidate_hired = candidate_user_id;
                            data.state = 2; //The task moves towards the next state, now considered 2 - candidate accepted offer
                            
                            data.save((err, updatedTask) =>{
                                if(err || !updatedTask){ 
                                    reject("Error: failed to update task");
                                    return;
                                } else { 
                                    console.log("## taskPromise OK, now update user doc...")
                                    User.setHired(candidate_user_id, taskId).then(ud=>{
                                        resolve(updatedTask);/** yes, the task */
                                        return;
                                    }).catch(ue =>{
                                        /**what if user didn't get updated? roll back using _old_data */
                                        data.candidate_hired = taskJsonBackup.candidate_hired;
                                        data.state = taskJsonBackup.state
                                        data.save((err, __data)=>{
                                            if(err || !__data){
                                                reject("Error and rolling back failed: task updated(yes) -> user updated(no) -> task rollback(no) ");
                                                return;
                                            }else{
                                                reject("Error but luckly rollback done: task updated(yes) -> user updated(no) -> task rollback(yes)");
                                                return;
                                            }
                                        })
                                    })
                                }
                            })
                        }else{
                            // candidate is not in data.candidates
                            reject("Error: Candidate have to apply first, then you can make the offer.")
                        }
                    }else{
                        // task is already offered
                        reject("Error: Task is already offered to some applicant!");
                    }
                }
            }
        })
    });

    
    
}


module.exports.offerTask_old = (taskId, owner_user_id, candidate_user_id) =>{ // Offer task as an owner (cannot offer to self)
    return new Promise((resolve, reject) =>{
        Task.findById({"_id" : taskId}, (err, data) =>{
            if(err){reject(err);}
            else{
                if(data.user_id != owner_user_id){
                    reject("Error: You're not the owner of the task! You cannot offer this task to anyone!");
                }else{
                    if(data.state == 2){
                        reject("Error: Task is already offered to some applicant!");
                        return;
                    }

                    if(data.candidate_hired == undefined || data.candidate_hired == null || data.candidate_hired ==""){
                        if(lib.arrayContains(data.candidates, candidate_user_id)){
                            // task not offered, candidate is in data.candidats, then can hire
                          
                            data.candidate_hired = candidate_user_id;
                            data.state = 2; //The task moves towards the next state, now considered 2 - candidate accepted offer
                            data.save((err, data) =>{
                                if(err){ reject(err); }
                                else { resolve(data); }
                            })
                        }else{
                            // candidate is not in data.candidates
                            reject("Error: Candidate have to apply first, then you can make the offer.")
                        }
                    }else{
                        // task is already offered
                        reject("Error: Task is already offered to some applicant!");
                    }
                }
            }
        })
    });
}

module.exports.applyTask = (taskId, candidate_user_id) =>{ // Apply to a task as a candidate (cannot offer to self)
    return new Promise((resolve, reject) =>{

        Task.findById({"_id":taskId}, (err, data) => {
            if(err){
                reject(err)
            }else{
                if(data.state != 0){
                    /** task is locked because owner hired someother, or suspended by admin */
                    reject("Task is not applicable now, either taken or suspended");
                    return;
                }
                if(data.user_id == candidate_user_id){
                    reject("Error: You cannot apply your own task!")
                }else{
                    if(lib.arrayContains(data.candidates, candidate_user_id)){
                        // already a candidate of task, no further action
                        resolve(data);
                        return;
                    }else{
                        
                        console.log("not yet a candidate, need to push candidate_user_id. .....")
                        data.candidates.push(candidate_user_id);
                        data.save((err, ndata) =>{
                            if(err) { reject(err); }
                            else { resolve(ndata); }
                        })
                        // let _id = data._id;
                        // delete data._id;
                        // Task.findOneAndUpdate({"_id":_id}, data,{new: true}, (err, ndata) => {
                        //     if(err){
                        //         reject(err);
                        //     }else{
                        //         resolve(ndata);
                        //     }
                        // })
                    }
                }
            }
        });
        // Task.findOneAndUpdate([{"_id":taskId},{"user_id":{$not:candidate_user_id}}], {$push:{candidates:candidate_user_id}},{new: true},(err, data)=>{
        //     if(err){
        //         reject(err);
        //     }else{
        //         resolve(data);
        //     }
        // } );
    });
}

//-----------------------------------------------------------



module.exports.findAll = (callback) =>{ 
    Task.find({},callback);
};

// deprecated
module.exports.addTask = (newTask, callback) =>{
    newTask.save(callback); // newTask is a mongoose object
};

module.exports.updateTask = (newTask, callback) =>{
    console.log("-- in mongoose : "+newTask);
    newTask.save(callback); // newTask is a mongoose object
    // newTask.findOneAndUpdate({"_id":newTask._id},newTask,callback);
};





module.exports.getTasksByQueryJson = (jsonObject, callback)=>{
    const query = jsonObject;
    Task.find(query, callback); 
};

module.exports.getTaskByQueryJson = (jsonObject, callback)=>{
    const query = jsonObject;
    Task.findOne(query, callback); 
};

// ===========================================

module.exports.getTaskByCode_p = (code) => {
    return new Promise((resolve, reject) => {
        const query = {code:code};
        Task.findOne(query, (err, data)=>{
            if(err){ reject(vars.MSG.ERROR_CONNECTION); }
            else if(!data){
                reject(vars.MSG.ERROR_NOTFOUND);
            }
            else{ resolve(data); }
        });
    }); 
};


module.exports.getTaskByName = (name, callback)=>{
    const query = {name:name};
    Task.findOne(query, callback);
};





module.exports.deleteTaskById = (id, callback) => {
    Task.findById(id, (err, taskFound)=>{
        if(err){ 
            callback(vars.ERROR_CONNECTION,null); 
            console.log(" => 0");
        } else {
            if(!taskFound){
                callback(vars.ERROR_NOTFOUND, null);
                console.log(" => 1");
            } else{
                taskFound.remove((err, taskFound)=>{
                    if(err){ 
                        console.log(" => 2");
                        callback(vars.ERROR_REMOVE_FAILED, null); 
                    } else {
                        console.log(" => 3");
            
                        callback(null, taskFound); 
                    }
                })
            }

    };
})};

// if(err){ callback(vars.ERROR_CONNECTION,null); }
// else if(!taskFound){ callback(vars.ERROR_NOTFOUND, null);}
// else{taskFound.remove((err, taskFound)=>{
//     if(err){ callback(vars.ERROR_REMOVE_FAILED, null); }
//     else{ callback(null, taskFound); }
// })}



module.exports.updateTaskById = (id, body, callback) => {
    Task.findById(id, (err, taskFound)=>{
        if(err){ 
            callback(vars.ERROR_NOTFOUND, null);
        } else {
            if(!taskFound){
                callback(vars.MSG.ERROR_NOTFOUND, null);
            }else{
                taskFound.host_id = body.host_id || taskFound.host_id;
                taskFound.title = body.title || taskFound.title;
                taskFound.discription = body.discription || taskFound.discription;
                taskFound.subtitle = body.subtitle || taskFound.subtitle;
                taskFound.latitude = body.latitude || taskFound.latitude;
    
                taskFound.longitude = body.longitude || taskFound.longitude;
                taskFound.date = body.date || taskFound.date;
                taskFound.address = body.address || taskFound.address;
    
                taskFound.members = body.members || taskFound.members;
                taskFound.membersIn = body.membersIn || taskFound.membersIn;
                taskFound.size = body.size || taskFound.size;
                taskFound.radius = body.radius || taskFound.radius;
                taskFound.duration = body.duration || taskFound.duration;
                
                taskFound.active = body.active || taskFound.active;
                taskFound.suspended = body.suspended || taskFound.suspended;
                
                
                taskFound.save((err, taskFound) =>{
                    if(err) {callback(vars.ERROR_UPDATE_FAILED,null); }
                    else{ callback(null, taskFound); }
                })
            }
            
        }
    })    
};
