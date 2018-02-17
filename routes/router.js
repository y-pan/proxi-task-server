const vars = require('../config/vars');
// const secret = require('../config/secret/secret');          // secret info like db connection(has username and pass)
const lib = require('../lib/lib1');
const express = require('express');
const router = express.Router();
const fbAdmin = require('firebase-admin') // firebase

// const User = require('../models/user');    // user mongoose model
//const Group = require('../models/group');  // user will join group 
const Task = require('../models/task');  // user will join task 
console.log("-----------now to do fb serviceAccount----------")
// -------------------------- start: firebase db connection ---------------
let serviceAccount = lib.getFbServiceAccount();
console.log(serviceAccount)
console.log("-----------now to do initializeApp----------")

let firebaseAdmin = fbAdmin.initializeApp({
    credential:fbAdmin.credential.cert(serviceAccount),
    databaseURL:lib.getFbDatabaseURL()
});
console.log("-----------after initializeApp----------")

let fbDb = firebaseAdmin.database();
console.log("-----------after fbDb----------")

// -------------------------- end: firebase db connection ------------------
// -------------------------- user/task in mongo,  firebase???
router.get('/', (req, res) => {
    // res.status(200);
    res.json({"data":"api version: 1.0"}); }
);

// for idToken testing. 
router.post('/auth', (req,res,next)=>{
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
// 1.1 User create task using POST: [api-root]/api/newTask   
router.post('/newTask', (req, res) => {   
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
router.get('/tasks',(req,res)=>{
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
router.get('/createdTask', (req, res) => {
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

// 1.4 GET:  [api-root]/tasks/search?lat=43.6753089&lon=-79.459126&distance=50
router.get('/searchTasks', (req, res) => {

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

// ============================================ following not completed   : =======================
// 2.4 POST: [api-root]/task/subscribe    ?task_id=1234123&user_id=1231111
router.post('/task/subscribe', (req, res) => {

    let task_id = req.body.task_id;
    let user_id = req.body.user_id;
    if (!task_id || !user_id) {
        res.json({ "err": vars.MSG.ERROR_INVALID_REQUEST });
        return;
    }
    // 1. check if user_id valid
    User.getUserByQueryJson({ "_id": user_id }, (err, data) => {
        if (err) {
            res.json({ "err": vars.MSG.ERROR_CONNECTION });
        } else {
            if (!data || data.length == 0) {
                res.json({ "err": vars.MSG.ERROR_USER_NOTFOUND });
            } else {
                // so at this point, user exists
                // then check task exist
                Event.getEventByQueryJson({ "_id": task_id }, (err, data) => {
                    if (err) {
                        res.json({ "err": vars.MSG.ERROR_CONNECTION });
                    } else {
                        if (!data || data.length == 0) {
                            res.json({ "err": vars.MSG.ERROR_NOTFOUND });
                            // console.log(vars.MSG.ERROR_NOTFOUND)
                        } else {
                            //so at this point task exist
                            if (data.active == false || data.suspended == true) {
                                res.json({ "err": vars.MSG.ERROR_EVENT_NOT_AVAILABLE });
                                return;
                            }
                            if (data.host_id == user_id) {
                                res.json({ "err": vars.MSG.ERROR_USER_NO_NEED_SUBSCRIBE_OWN_EVENT });
                                return;
                            }
                            console.log(data);
                            let members = data.members;

                            for (let i = 0; i < members.length; i++) {

                                if (members[i] == user_id) {
                                    console.log(members[i] + "=YES=" + user_id)
                                    res.json({ "data": data }); // user_id is already a member, no need to update db, just return data
                                    return;
                                }
                            }

                            data.members.push(user_id);
                            Event.updateEvent(data, (err, newData) => {
                                if (err) {
                                    res.json({ "err": vars.MSG.ERROR_CONNECTION });
                                } else {
                                    if (!newData || newData.length == 0) {
                                        res.json({ "err": vars.MSG.ERROR_NOTFOUND });
                                    } else {
                                        res.json({ "data": newData });
                                    }
                                }
                            });
                        }
                    }
                });

            }// end of User.getUserByQueryJson()
        }
    })
});

// 2.5 GET: [api-root]/task?id=2312312
router.get('/task', (req, res) => {

    let _id = req.query.id;
    if (!_id) {
        res.json({ "err": vars.MSG.ERROR_INVALID_REQUEST });
        return;
    }

    Event.getEventByQueryJson({ "_id": _id }, (err, data) => {
        if (err) {
            res.json({ "err": vars.MSG.ERROR_CONNECTION });
        } else {
            if (!data || data.length == 0) {
                res.json({ "err": vars.MSG.ERROR_NOTFOUND });
            } else {
                res.json({ "data": data });
            }
        }
    });
});

// 2.6 GET /guest_task?id=1232abc     to get my attended task
router.get('/guest_task', (req, res) => {

    let guest_id = req.query.id;
    if (!guest_id) {
        res.json({ "err": vars.MSG.ERROR_INVALID_REQUEST });
        return;
    }

    // let taskArray = [];
    // console.log(" search:" +lat + ", "+lon + ", "+dis);
    Event.getEventsByQueryJson({ "members": guest_id }, (err, data) => {
        if (err) {
            res.json({ "err": vars.MSG.ERROR_CONNECTION });
        } else {
            if (!data || data.length == 0) {
                res.json({ "err": vars.MSG.ERROR_NOTFOUND });
            } else {
                res.json({ "data": data });
                console.log(data);
            }
        }
    });
});


// 2.7 POST: [api-root]/task/update

router.post('/task/update', (req, res) => {

    if (!req.body.title) {
        res.json({ "err": vars.MSG.ERROR_INVALID_REQUEST });
        return;
    }
    // see if title confilict
    Event.getEventByQueryJson({ "title": req.body.title }, (err, data) => {

        if (err) {
            res.json({ "err": vars.MSG.ERROR_CONNECTION });
            return;
        } else {
            if (data) {

                if (req.body.title == data.title && req.body._id != data._id) { // other task already has same title, not allowed to duplicate title
                    res.json({ "err": vars.MSG.ERROR_EVENT_TITLE_DUPLICATED });
                    return;
                }
            }
            // OK TO UPDATE
            Event.getEventByQueryJson({ "_id": req.body._id }, (err, udata) => {
                if (err) {
                    res.json({ "err": vars.MSG.ERROR_CONNECTION });
                    return;
                } else {
                    if (!udata || udata.length == 0) {
                        res.json({ "err": vars.MSG.ERROR_NOTFOUND });
                    } else {
                        // FIND the record, update it
                        // udata.host_id = req.body.host_id || udata.host_id;
                        udata.title = req.body.title || udata.title;
                        udata.description = req.body.description || udata.description;
                        udata.subtitle = req.body.subtitle || udata.subtitle;
                        udata.latitude = req.body.latitude || udata.latitude;

                        udata.longitude = req.body.longitude || udata.longitude;
                        udata.date = req.body.date || udata.date;
                        udata.address = req.body.address || udata.address;

                        udata.members = req.body.members || udata.members;
                        udata.membersIn = req.body.membersIn || udata.membersIn;
                        udata.size = req.body.size || udata.size;
                        udata.radius = req.body.radius || udata.radius;
                        udata.duration = req.body.duration || udata.duration;

                        udata.active = req.body.active || udata.active;
                        udata.suspended = req.body.suspended || udata.suspended;

                        Event.updateEvent(udata, (err, newudata) => {
                            if (err) {
                                res.json({ "err": vars.MSG.ERROR_CONNECTION });
                            } else {
                                if (!newudata || newudata.length == 0) {
                                    res.json({ "err": vars.MSG.ERROR_NOTFOUND });
                                } else {
                                    console.log("======= d 2 ======= updated \n" + newudata);
                                    res.json({ "data": newudata });
                                }
                            }
                        });
                    }
                }
            });
        }
    });
});

// 3.0 GET : [api-root]/tasks     get all tasks

router.get('/tasks', (req, res) => {
    Event.findAll((err, data) => {
        res.json(data);
    })
});

// 3.1a DELETE : [api-root]/task?id=xxx     admin/host delete task by task id
//https://meetus01.herokuapp.com/api/task?id=5a2754d25aa8e623dcfc2038
/**
 * return the original data
 * 
 */

router.delete('/task', (req, res) => {
    Event.deleteEventById(req.query.id, (err, data) => {
        if (err) {
            res.json({ "err": vars.MSG.ERROR_OPERATION }); // model class specified err message already
        } else {
            if (!data) {
                res.json({ "err": vars.MSG.ERROR_NOTFOUND });
            } else {
                console.log("task deleted : " + data)
                res.json({ "data": data });
            }
        }
    });
});
// 3.1b POST : [api-root]/task/delete?id=xxx    admin/host delete task by task id (backup api)
router.post('/task/delete', (req, res) => {
    Event.deleteEventById(req.query.id, (err, data) => {
        if (err) {
            res.json({ "err": vars.MSG.ERROR_OPERATION }); // model class specified err message already
        } else {
            if (!data) {
                res.json({ "err": vars.MSG.ERROR_NOTFOUND });
            } else {
                console.log("task deleted : " + data)
                res.json({ "data": data });
            }
        }
    });
});

// ----------------------- below methods are not used -------------------



//http://localhost:5000/api/user_gps?email=panyunkui@gmail.com&lat=-123.111&lon=111.000&code=abc
// router.get('/user_gps/', (req, res, next) => {
//     console.log('user_gps');
//     let email = req.query.email;
//     let lat = req.query.lat;
//     let lon = req.query.lon;
//     let code = req.query.code;

//     User.updateGps(email, lat, lon, code, (err, data) => {
//         if (err) {
//             res.send(err);
//         }
//         else {
//             res.send(data);
//         }
//     })
// })

// ----------------------- ---------------------------- -------------------


module.exports = router; 