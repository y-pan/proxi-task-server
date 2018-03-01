const vars = require('../config/vars');

const lib = require('../lib/lib1');
const express = require('express');
const taskRouter = express.Router();
const User = require('../models/user');    // user mongoose model
const Task = require('../models/task');  // user will join task 

// -------------------------- end: firebase db connection ------------------
// -------------------------- user/task in mongo,  firebase???
taskRouter.get('/', (req, res) => {
    // res.status(200);
    res.json({"data":"taskRouter"}); }
);

taskRouter.get('/test/msg', (req,res,next)=>{
    let registrationToken  = "d4NdBaZFrz4:APA91bGZ5cgnZtHMwwC40rL4BsyW-iJ79AZ574_fLlpurufGkGcrq3GzWXnDk2uYHorCQJiT3JnMrM0VLnx5X5hOtV1NyxcAOV-YdKN_LxtsT83ZX6y-R9AE9k63nfm5BwFxnRdK9cAz";
    var message = {
        data: {
          title:"testing msg title"
         ,message:"test msg text"
        },
        token: registrationToken
      };
      fbAdmin.messaging().send(message)
            .then((response) => {
                // Response is a message ID string.
                console.log('Successfully sent message:', response);
                res.json({data:"Successfully sent message"})
            })
            .catch((error) => {
                console.log('Error sending message:', error);
                res.json({data:"Error"})

            });

});

// for idToken testing. 

taskRouter.post('/test/auth', (req,res,next)=>{
    // let idToken = req.body.idToken;
    fbAdmin.auth().verifyIdToken(req.get('idToken'))
        .then((decodedToken)=>{
            res.status(vars.CODE.RES_CODE_OK)
            res.json({data:decodedToken});
        }).catch((err) =>{
            res.status(vars.CODE.RES_CODE_ERROR);
            res.json({err:err});
        })
});

// here is the business
/*
res.status(200);
200 ; 204 No Content
401 (idToken invalid/expired)
404 other error
*/

// debug 1 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
taskRouter.post('/test/reg_fcmIdToken', (req, res) =>{
    let user_id = req.body.user_id;
    let token = req.body.token;
    res.json({"test":"test msg",user_id:user_id, token:token})
})


// 1.1 User create task using POST: [api-root]/api/newTask   
taskRouter.post('/newTask', (req, res) => {   
    let idToken = req.get('idToken');
    if(!idToken){
        res.json({"err":"invalid token"});
        return;
    }
    fbAdmin.auth().verifyIdToken(idToken)
        .then((decodedToken)=>{
            // console.log(decodedToken)
            // create object json
            let user_id = decodedToken.user_id;
            let user_email = decodedToken.email;
            
            let taskJson = req.body;
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
        }).catch((err) =>{ //3 invalid token, unauthorized
            // res.status(vars.CODE.RES_CODE_UNAUTH);
            console.log("------- invaild token --------")
            console.log(err)
            res.json({"err":err});
        })
});

// 1.2 GET: [api-root]/tasks       admin get all tasks
taskRouter.get('/tasks',(req,res)=>{
    let idToken = req.get('idToken');
    if(!idToken){
        res.json({"err":"invalid token"});
        return;
    }
    fbAdmin.auth().verifyIdToken(idToken)
        .then((decodedToken)=>{
            
            if(!lib.validateAdmin(decodedToken)){// checking admin is kind of hardcoded 
                res.json({"err":"invalid admin token"});
                return;
            }

            Task.findAll_p()
                .then((data)=>{ res.json({"data":data})})
                .catch((err) =>{ res.json({"err":err})})
        }).catch((err) =>{ //3 invalid token, unauthorized
            // res.status(vars.CODE.RES_CODE_UNAUTH);
            console.log("------- invaild token --------")
            console.log(err)
            res.json({"err":err});
        })
});

// 1.3 GET: [api-root]/createdTask       my created task 
taskRouter.get('/createdTask', (req, res) => {
    let idToken = req.get('idToken');
    if(!idToken){
        res.json({"err":"invalid token"});
        return;
    }
    fbAdmin.auth().verifyIdToken(idToken)
        .then((decodedToken)=>{
            
            Task.getTasksByUserId_p(decodedToken.user_id)
                .catch((err) =>{ res.json({"err":err}); return;})
                .then((data)=>{ res.json({"data":data}); return;})
        }).catch((err) =>{ //3 invalid token, unauthorized
            // res.status(vars.CODE.RES_CODE_UNAUTH);
            console.log("------- invaild token --------")
            console.log(err)
            res.json({"err":err});
            return;
        })
});

// 1.4 GET:  [api-root]/searchTasks?lat=43.6753089&lon=-79.459126&distance=50
taskRouter.get('/searchTasks', (req, res) => {

    let lat = req.query.lat;
    let lon = req.query.lon;
    if(!lat || !lon){
        res.json({"err":"invalid latitude/longitude"});
        return;
    }
    let idToken = req.get('idToken');
    if(!idToken){
        res.json({"err":"invalid token"});
        return;
    }
    fbAdmin.auth().verifyIdToken(idToken)
        .then((decodedToken)=>{
            Task.findAll_p()
                .catch((err) =>{ res.json({"err":err}); return;})
                .then((data)=>{ 
                    let tasks = [];
                    let user_id = decodedToken.user_id;
                    if(!data){
                        res.json({"data":tasks}); return;
                    }
                    
                    // check distance
                    for(let i=0; i<data.length; i++){
                        let _t = data[i];
                        if(user_id == _t.user_id) continue; // user won't see own tasks
                        let dis = lib.getDistanceFromLatLon(lat,lon,_t.lat,_t.lon);

                        if( dis <= _t.radius){
                            // console.log("dis=" + dis + "  |  " +_t.radius  + " YES ");
                            tasks.push(_t);
                        }
                    }
                    res.json({"data":tasks}); return;
                })
        }).catch((err) =>{ //3 invalid token, unauthorized
            // res.status(vars.CODE.RES_CODE_UNAUTH);
            console.log("------- invaild token --------")
            console.log(err)
            res.json({"err":err});
            return;
        })
});

module.exports = taskRouter; 