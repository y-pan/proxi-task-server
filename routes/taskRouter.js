const vars = require('../config/vars');

const lib = require('../lib/lib1');
const express = require('express');
const taskRouter = express.Router();
const firebaseManager = require('../lib/firebaseManager');
const User = require('../models/user');    // user mongoose model
const Task = require('../models/task');  // user will join task 


// 1.7 get task by taskId in query
taskRouter.get('/', (req, res) => {
    id = req.query.taskId;
    if(!id){
        res.json({err:"Invalid task id"});
        return;
    }
    Task.getTaskById_p(id).then(data => {
        res.json({data:data})
    }).catch(err => {
        res.json({err: err})
    })
});

// 1.1 User create task using POST: [api-root]/api/newTask   
taskRouter.post('/add', (req, res) => {   
    let user_id = req.decodedToken.user_id;
    let user_email = req.decodedToken.email;
    
    let taskJson = req.body; /** so all attribute from req.body will be accepted for now for simple, and user_id and user_email are from idToken*/
    taskJson.user_id = user_id;
    taskJson.user_email = user_email;
    let newTask = new Task(taskJson);
    // some exception prevention here -----------
    if(!lib.validateTask(newTask)) {
        res.status(vars.CODE.RES_CODE_BAD_REQUEST);
        console.log("validateTask failed")
        res.json({"err":vars.MSG.ERROR_INVALID_DATA});
        return;
    }
    // now proceed to db
    Task.addTask_p(newTask)
        .then(data=>{
            if(data){
                res.status(200);
            }else{
                res.status(204);
            }
            res.json({"data":data});
        })
        .catch(err =>{
            res.status(vars.CODE.RES_CODE_ERROR);
            res.json({"err":err});
        })
});

// 1.2 GET: [api-root]/tasks       admin get all tasks
taskRouter.get('/all',(req,res)=>{
    if(!lib.validateAdmin(req.decodedToken)){/* checking admin is only looking at if email == proxitaskproject@gmail.com */
        res.json({"err":"invalid admin token"});
        return;
    }

    Task.findAll_p()
        .then((data)=>{ res.json({"data":data})})
        .catch((err) =>{ res.json({"err":err})})
});

taskRouter.get('/testall',(req,res)=>{ /** this is only for debugging purpose, act like admin can see all task list !!! */
    Task.findAll_p()
                .then((data)=>{ res.json({"data":data})})
                .catch((err) =>{ res.json({"err":err})})
});
// 1.3 GET: [api-root]/mycreated       my created task 
taskRouter.get('/mycreated', (req, res) => {
    // here  user_id is task-owner's user_id
    Task.getTasksByUserId_p(req.decodedToken.user_id)
                .catch((err) =>{ res.json({"err":err}); return;})
                .then((data)=>{ res.json({"data":data}); return;})
});
// 1.9 GET: myapplied   my applied task
taskRouter.get('/myapplied', (req, res) => {
    Task.getTasksByCandidateId_p(req.decodedToken.user_id)
                .catch((err) =>{ res.json({"err":err}); return;})
                .then((data)=>{ res.json({"data":data}); return;})
});
// 2.0 GET: my completed
taskRouter.get('/mycompleted', (req, res) => {
    Task.getTasksCompleted_p(req.decodedToken.user_id)
                .catch((err) =>{ res.json({"err":err}); return;})
                .then((data)=>{ res.json({"data":data}); return;})
});
// 1.4 GET:  [api-root]/searchTasks?lat=43.6753089&lon=-79.459126&distance=50
taskRouter.get('/search', (req, res) => {

    let lat = req.query.lat;
    let lon = req.query.lon;
    // console.log("@@@ searching by goe codes: " + lat + " | " + lon )

    if(!lat || !lon){
        res.json({"err":"invalid latitude/longitude"});
        return;
    }
    // console.log("@@@ goe codes are ok..." )

    Task.findAll_p()
        .catch((err) =>{ res.json({"err":err}); return;})
        .then((data)=>{
            let tasks = [];
            let user_id = req.decodedToken.user_id;
            if(!data){
                // console.log("@@@ Databasee is empty." )
                res.json({"data":tasks}); return;
            }
            // check distance
            for(let i=0; i<data.length; i++){
                let _t = data[i];
                // console.log("@@@ check1 task distance: " + _t)

                if(_t.state == 0 || _t.state == null || _t.state == undefined){
                    if(user_id == _t.user_id) { continue;} /* user won't see own tasks*/
                
                    let dis = lib.getDistanceFromLatLon(lat,lon,_t.lat,_t.lon);
                    // console.log("@@@ check2 task distance: " + dis + " | task.radius=" + _t.radius)

                    if( dis <= _t.radius){
                        tasks.push(_t);
                        // console.log("@@@ task found: " + _t.title + " radius=" + _t.radius)
                    }
                }
            }
            // console.log("@@@ Finally totak tasks found: " + tasks.length);
            res.json({"data":tasks}); return;
        })
});


// 1.5 POST user apply task created by other
taskRouter.post('/apply', (req, res) => {
    console.log('do apply......')
    // console.log(req.decodedToken)
    let taskId =req.query.taskId;
    let candidate_user_id = req.decodedToken.user_id
    Task.applyTask(taskId, candidate_user_id).then(data => {
        res.json({data:data});
    }).catch(err => {
        res.json({err:err});
    })
});

// 1.6 POST owner hire one of candidates
taskRouter.post('/offer', (req, res) => {
    console.log('do hire......');
    let taskId =req.body.taskId;
    let candidate_user_id = req.body.candidate_user_id;
    let owner_user_id = req.decodedToken.user_id
    Task.offerTask(taskId, owner_user_id, candidate_user_id).then(data => {
        res.json({data:data})
    }).catch(err => {
        res.json({err:err})
    })
})

// 1.8 POST: Owner update task using   
taskRouter.post('/update', (req, res) => {   
    // let taskJson = req.body;
    // let newTask = new Task(taskJson);
    Task.updateTask_p(req.body).then(data =>{
        res.json({"data":data});
    }).catch(err => {
        res.json({"err":err})
    })
});


module.exports = taskRouter; 