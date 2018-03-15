// import { Promise } from 'mongoose';

// user has multiple tasks, host task / guest task
// task has task gps, set by host task
// distance between user and task need to be close enough to mark user attended task, task will record user

// data rules: no duplicated code, members and membersIn is email
// loc: [lat, lon]
const vars = require('../config/vars');

const mongoose = require('mongoose');

const TaskSchema = mongoose.Schema({
    /** OWNER */
    user_id:{type:String, required:true} /* from idToken.uid, from header */
    ,user_email:{type:String, required: true} /* from idToken.email, from header */

    /** WHAT */
    ,title:{type:String, required:true}
    ,description:{type:String}
    ,subtitle:{type:String}
    ,price:{type:Number} /* task point to be transfered from owner to candidate once task is done */

    /** WHERE */
    ,lat:{type:Number}
    ,lon:{type:Number}
    ,address:{type:String}  /* owner need to type address. Can android get gps[lat, lon] out of address? what if publisher is not at job location? */
    ,radius:{type:Number}  /* radius, within radius will be marked as attended, within valid duration */

    /** WHEN */
    ,date:{type:String} /* ddmmyyyy, start date of task, host/admin will postpond task by changing date, search task might need to filter if date expired or not */
    ,startTime:{type:String} /** */
    ,endTime:{type:String}

    /** WHO */
    ,candidates:{type:[String]}  /* candidates' id from idToken.uid */
    ,candidate_hired:{type:String} /* 1 candidate's id who is hired by owner */
 
    /* TASK STATE */
    ,state:{type:Number} 
    /* state -
        0: task just get created by owner,
            users(not owner) login & apply task, and user's uid will be added to "candidates" array, so owner can see(firebase need to notify owner about new candidate). 
        1: owner makes job offer a candidate(candate need to login & apply it first, then owner can provide offer to 1 candidate), 
        2: candidate accepts offer => "candidate_hired" get populated (firebase notify owner for offer accepted), task will get locked (stop receiving new candidates)
                                     owner's points (price of task)
           if candidate reject offer, state change back to 0 (firebase notify owner).   
           owner can cancel offer before it is accepted by candidate (firebase notify .
        3: candidate complete task => candidate press "complete" button, firebase notifys owner task completion
            if candidate didn't complete task (abort), state change back to 0 (firebase notify owner)
        4: owner confirms task completion => points get transferred from owner to candidate. Task closed
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

module.exports.getTaskById_p = (id)=>{
    return new Promise((resolve, reject) => {
        Task.findById({"_id":id}, (err, data) => {
            if(err){
                reject(err)
            }else{
                resolve(data)
            }
        }); // id refers to _id. When mongodb saves an data object(document) into collection, it creats unique _id within the document, as an additional attribute

    });
};


module.exports.findAll_p = () =>{
    return new Promise((resolve,reject)=>{
        Task.find({},(err,data)=>{
            if(err) reject(err);
            resolve(data);
        });
    })
};


module.exports.addTask_p = (newTask) =>{
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

module.exports.getTasksByUserId_p = (user_id)=>{
    return new Promise((resolve,reject) =>{
        Task.find({user_id:user_id}, (err,data)=>{
            if(err) reject(err);
            resolve(data);
        });
    });
};

module.exports.updateTask_p = (newTask) =>{
    return new Promise((resolve, reject) => {
        console.log("-- in mongoose : "+newTask);
        newTask.save((err, data) =>{
            if(err){
                reject(err)
            }else{
                resolve(data)
            }
        }); // newTask is a mongoose object
        // newTask.findOneAndUpdate({"_id":newTask._id},newTask,callback);
    });
    
};


//-------------------------



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