// user has multiple tasks, host task / guest task
// task has task gps, set by host task
// distance between user and task need to be close enough to mark user attended task, task will record user

// data rules: no duplicated code, members and membersIn is email
// loc: [lat, lon]
const vars = require('../config/vars');

const mongoose = require('mongoose');

const TaskSchema = mongoose.Schema({
    owner_id:{type:String, require:true} /* from idToken.uid */
    ,owner_email:{type:String, require: true} /* from idToken.email */
    ,title:{type:String, require:true}
    ,description:{type:String}
    ,subtitle:{type:String}
    ,latitude:{type:Number}
    ,longitude:{type:Number}
    ,date:{type:String} /* start date of task, host/admin will postpond task by changing date, search task might need to filter if date expired or not */
    ,address:{type:String}

    ,candidates:{type:[String]}  /* candidates' id from idToken.uid */
    ,pay:{type:Number} /* task point to be transfered from owner to candidate once task is done */
    ,candidate_hired:{type:String} /* 1 candidate's id who is hired by owner */
    
   
    ,distance:{type:Number}  /* radius, within radius will be marked as attended, within valid duration */
 
    /* state attribute for business */
    ,locked:{type:Boolean, default:false} /* when owner want to hire a candidate, it get locked (true), when */
    ,active:{type:Boolean, default:true}
    ,suspended:{type:Boolean, default:false}

},{collection:'task'});
// taskStartTime:{type: Date, default: Date.now},

//coordinates:req.body.coordinates.split(',').map(Number)

//var distance = require('gps-distance');
// Measure between two points: 
//var result = distance(45.527517, -122.718766, 45.373373, -121.693604);

const Task = module.exports = mongoose.model('task',TaskSchema);

module.exports.findAll = (callback) =>{
    Task.find({},callback);
};

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
module.exports.getTasksByHostId = (host_id, callback)=>{
    const query = {host_id:host_id};
    Task.find(query, callback);
};
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

module.exports.getTaskById = (id,callback)=>{
    Task.findById(id, callback); // id refers to _id. When mongodb saves an data object(document) into collection, it creats unique _id within the document, as an additional attribute
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