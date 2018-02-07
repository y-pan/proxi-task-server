const vars = require('../config/vars');
// const secret = require('../config/secret/secret');          // secret info like db connection(has username and pass)
const lib = require('../lib/lib1');
const express = require('express');
const router = express.Router();
const fbAdmin = require('firebase-admin') // firebase

const User = require('../models/user');    // user mongoose model
//const Group = require('../models/group');  // user will join group 
const Event = require('../models/event');  // user will join event 

// -------------------------- start: firebase db connection ---------------
let serviceAccount = lib.getFbServiceAccount();
let firebaseAdmin = fbAdmin.initializeApp({
    credential:fbAdmin.credential.cert(serviceAccount),
    databaseURL:lib.getFbDatabaseURL()
});
let fbDb = firebaseAdmin.database();
// -------------------------- end: firebase db connection ------------------
// 
router.get('/', (req, res) => {
    // res.status(200);
    res.send("api version: 1.0"); }
);

router.post('/auth', (req,res,next)=>{
    // let idToken = req.body.idToken;
    let idToken = req.get('idToken')
    fbAdmin.auth().verifyIdToken(idToken)
        .then((decodedToken)=>{
            res.json({data:decodedToken});
        }).catch((err) =>{
            res.json({err:err});
        })
})

// here is the business
//router.get('/user', passport.authenticate('jwt',{session:false}), (req, res)=>{
//res.json({ "adminAuthenticated": true });
//});  


// 1.1 GET:  [api-root]/user 
// for admin to get all users
router.get('/users', (req, res) => {
    User.findAll((err, data) => {
        res.json(data);
    })
});

// 1.2  GET:  [api-root]/user?id=xxxxxxxxxxxxxxxx
// https://meetus01.herokuapp.com/api/user?id=5a3005f4a0b4fd00046e940d (except for password, which is erased, but still there is a field call "password" in json)

router.get("/user", (req, res) => {
    let obj = {};
    let _id = req.query.id;
    if (_id) {          // post via url
        obj = { "_id": _id };
    } else {
        res.json({ "err": vars.MSG.ERROR_NOTFOUND });
        return;
    }

    User.getUserByQueryJson(obj, (err, data) => {
        if (err) {
            res.json({ "err": vars.MSG.ERROR_CONNECTION });
        } else {
            if (!data) {
                res.json({ "err": vars.MSG.ERROR_NOTFOUND });
            } else {
                data.password = "";  // remove password for security purpose, UI don't want to show it
                res.json({ "data": data });
            }
        }
    });
});

// 1.3 POST:  [api-root]/user/register
// url 
router.post('/user/login_google', (req, res, next) =>{

    

});

// Register : req.body is better maintainable, just need to modify model and done
router.post('/user/register', (req, res, next) => {
    let newUser;
    newUser = new User(req.body);
    console.log(newUser.email);

    // check if email already used, don't proceed
    User.getUserByQueryJson({ "email": newUser.email }, (err, data) => {

        // connect to firebase oauth with
        // 
        if (err) {
            res.json({ "err": vars.MSG.ERROR_CONNECTION });
        } else {
            if (data) {
                res.json({ "err": vars.MSG.ERROR_EMAIL_DUPLICATED });
            } else {
                // ok to use this email, clientside should check password valid(not empty, ...)
                User.addUser(newUser, (err, data) => {
                    if (err) { res.json({ "err": vars.MSG.ERROR_OPERATIO }); }
                    else {
                        data.password = ""; // empty password for security purpose
                        res.json({ "data": data });
                    }
                });
            }
        }
    })
});

// 1.4a|b POST: [api-root]/user/login
// http://localhost:3000/api/user/login?email=panyunkui2@gmail.com&password=111
router.post("/user/login", (req, res) => {
    let obj = {};
    let email = req.query.email;
    let password = req.query.password;
    if (email && password) {          // post via url
        obj = { email, password };
    } else {                          // post via body 
        //obj = req.body;   // simply using req.body is not safe
        obj = { "email": req.body.email, "password": req.body.password }
    }

    User.getUserByQueryJson(obj, (err, data) => {
        if (err) {
            res.json({ "err": vars.MSG.ERROR_CONNECTION });
        } else {
            if (!data) {
                res.json({ "err": vars.MSG.ERROR_NOTFOUND });
            } else {
                data.password = ""; // empty password for security purpose
                res.json({ "data": data });
            }
        }
    })
})

// 2.1 POST: [api-root]/api/event   
// host create event: http://localhost:3000/api/event
router.post('/event', (req, res) => {
    let newEvent = new Event(req.body);
    console.log(newEvent);

    // check if host_id exists in db
    User.getUserByQueryJson({ "_id": newEvent.host_id }, (err, data) => {
        if (err) {
            res.json({ "err": vars.MSG.ERROR_CONNECTION });
        } else {
            if (!data || data.length == 0) {
                res.json({ "err": vars.MSG.ERROR_HOST_NOTFOUND });
            } else {
                // check if title already used, don't proceed
                Event.getEventByQueryJson({ "title": newEvent.title }, (err, data) => {
                    if (err) {
                        res.json({ "err": vars.MSG.ERROR_CONNECTION });
                    } else {
                        if (data) {
                            res.json({ "err": vars.MSG.ERROR_EVENT_TITLE_DUPLICATED });
                        } else {
                            // ok to use this event, clientside should check other fields if valid(not empty, ...)
                            Event.addEvent(newEvent, (err, data) => {
                                if (err) { res.json({ "err": vars.MSG.ERROR_OPERATIO }); }
                                else { res.json({ "data": data }); }
                            });
                        }
                    }
                });
            }
        }
    })
});

// 2.2 POST: [api-root]/host_event     
// Host get all self-hosting events 
// http://localhost:3000/api/host_event, http://localhost:3000/api/host_event?host_id=5a2b4f4d166e4d26b8e7cf45

router.post('/host_event', (req, res) => {
    //  {"host_id":"host_id"} */   // obj = req.body  simply using req.body as whole is bad for security concern, but it is lazy way for good code maintainance
    let obj = {};
    let host_id = req.query.host_id;
    if (host_id) {          // post via url
        obj = { "host_id": host_id };
    } else {                          // post via body 
        //obj = req.body;   // simply using req.body is not safe
        obj = { "host_id": req.body.host_id };
    }
    console.log("to post event: " + obj.host_id);
    Event.getEventsByQueryJson(obj, (err, data) => {
        if (err) {
            res.json({ "err": vars.MSG.ERROR_CONNECTION });
        } else {

            if (!data || data.length == 0) {
                res.json({ "err": vars.MSG.ERROR_NOTFOUND });
                console.log(vars.MSG.ERROR_NOTFOUND)
            } else {
                res.json({ "data": data });
                console.log(data)

            }
        }
    });
});

// 2.3 GET:  [api-root]/event/search?latitude=43.6753089&longitude=-79.459126&distance=50
router.get('/event/search', (req, res) => {

    let lat = req.query.latitude;
    let lon = req.query.longitude;
    let dis = req.query.distance;
    let events = [];
    // console.log(" search:" +lat + ", "+lon + ", "+dis);
    Event.getEventsByQueryJson({}, (err, data) => {
        if (err) {
            res.json({ "err": vars.MSG.ERROR_CONNECTION });
        } else {
            if (!data || data.length == 0) {
                res.json({ "err": vars.MSG.ERROR_NOTFOUND });
                // console.log(vars.MSG.ERROR_NOTFOUND)
            } else {
                //console.log(data)
                data.forEach(d => {
                    if (d.suspended == false && d.active == true) {
                        let ds = lib.getDistanceFromLatLonInMeter(lat, lon, d.latitude, d.longitude);
                        // console.log("["+lat+","+lon+"]+["+d.latitude+","+d.longitude+"] =>" + ds);
                        if (ds <= dis) {
                            events.push(d);
                        }
                    }

                })
                res.json({ "data": events });
                // console.log("total:" + events.length +"/"+data.length + " within" + dis);
            }
        }
    });
});

// 2.4 POST: [api-root]/event/subscribe    ?event_id=1234123&user_id=1231111
router.post('/event/subscribe', (req, res) => {

    let event_id = req.body.event_id;
    let user_id = req.body.user_id;
    if (!event_id || !user_id) {
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
                // then check event exist
                Event.getEventByQueryJson({ "_id": event_id }, (err, data) => {
                    if (err) {
                        res.json({ "err": vars.MSG.ERROR_CONNECTION });
                    } else {
                        if (!data || data.length == 0) {
                            res.json({ "err": vars.MSG.ERROR_NOTFOUND });
                            // console.log(vars.MSG.ERROR_NOTFOUND)
                        } else {
                            //so at this point event exist
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

// 2.5 GET: [api-root]/event?id=2312312
router.get('/event', (req, res) => {

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

// 2.6 GET /guest_event?id=1232abc     to get my attended event
router.get('/guest_event', (req, res) => {

    let guest_id = req.query.id;
    if (!guest_id) {
        res.json({ "err": vars.MSG.ERROR_INVALID_REQUEST });
        return;
    }

    // let eventArray = [];
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


// 2.7 POST: [api-root]/event/update

router.post('/event/update', (req, res) => {

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

                if (req.body.title == data.title && req.body._id != data._id) { // other event already has same title, not allowed to duplicate title
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

// 3.0 GET : [api-root]/events     get all events

router.get('/events', (req, res) => {
    Event.findAll((err, data) => {
        res.json(data);
    })
});

// 3.1a DELETE : [api-root]/event?id=xxx     admin/host delete event by event id
//https://meetus01.herokuapp.com/api/event?id=5a2754d25aa8e623dcfc2038
/**
 * return the original data
 * 
 */

router.delete('/event', (req, res) => {
    Event.deleteEventById(req.query.id, (err, data) => {
        if (err) {
            res.json({ "err": vars.MSG.ERROR_OPERATION }); // model class specified err message already
        } else {
            if (!data) {
                res.json({ "err": vars.MSG.ERROR_NOTFOUND });
            } else {
                console.log("event deleted : " + data)
                res.json({ "data": data });
            }
        }
    });
});
// 3.1b POST : [api-root]/event/delete?id=xxx    admin/host delete event by event id (backup api)
router.post('/event/delete', (req, res) => {
    Event.deleteEventById(req.query.id, (err, data) => {
        if (err) {
            res.json({ "err": vars.MSG.ERROR_OPERATION }); // model class specified err message already
        } else {
            if (!data) {
                res.json({ "err": vars.MSG.ERROR_NOTFOUND });
            } else {
                console.log("event deleted : " + data)
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