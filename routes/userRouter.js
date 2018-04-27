const vars = require('../config/vars');

const lib = require('../lib/lib1');
const express = require('express');
const userRouter = express.Router();
const firebaseManager = require('../lib/firebaseManager');
const User = require('../models/user');    // user mongoose model
const Task = require('../models/task');  // user will join task 

// u1: login server after login firebase

userRouter.get('/login',(req, res) => {
    // so we have decoded
    User.login(req.decodedToken).then((data) => {
        res.json({data:data}); 
    /* 
    {
        appliedTasks:[{id:id,name:name}],
        completedTasks: [{id:id,name:name}],
        createdTasks:[{id:id,name:name}]
    }
    */
    }).catch((err) => {
        res.json({err:err});
    })
});

/** get user's own info */
userRouter.get('/', (req, res) =>{
    let user_id = req.decodedToken.user_id;
    console.log("get current user: "+user_id)

    User.getUserByUserId_p(user_id).then((data)=>{
        res.json({data:data});
    }).catch(err =>{
        res.json({err:err});
    })
})

userRouter.get('/:user_id', (req, res) =>{
    let user_id = req.params.user_id;
    console.log("get other user: "+user_id)
    User.getUserByUserId_p(user_id).then((data)=>{
        res.json({data:data});
    }).catch(err =>{
        res.json({err:err});
    })
})

userRouter.post('/update', (req, res) =>{
    let infoJson = {}
    infoJson.user_id = req.decodedToken.user_id;
    infoJson.name = req.body.name;
    infoJson.address = req.body.address;
    infoJson.phone = req.body.phone;
    infoJson.lat = req.body.lat;
    infoJson.lon = req.body.lon;

    console.log("get other user: "+ infoJson.user_id)
    User.updateUser(infoJson).then((data)=>{
        res.json({data:data});
    }).catch(err =>{
        res.json({err:err});
    })
})

// -------------------------- user/task in mongo,  firebase???
// userRouter.get('/', (req, res) => {
//     // res.status(200);
//     res.json({"data":"userRouter"}); }
// );

/** this is made for debugging FCM */
userRouter.get('/all', (req, res) => {
    // res.status(200);
    User.findAll_p().then(data =>{
        res.json({"data":data}); }
    ).catch(err => {
        res.json({"err":err});
    })
});

// 2.1 POST create userId | msgtoken pair, in User collection,  
// [header]: idToken, 
// [body] : {msgToken: req.body.msgToken}
userRouter.post('/msgToken', (req,res)=>{
    console.log("@@@@@@@@@@@@ [1] /msgToken : start @@@@@@@@@@@")

    let userJson = {}
    userJson.user_id = req.decodedToken.user_id;
    userJson.phone = req.decodedToken.phone || "";
    userJson.email = req.decodedToken.email;

    userJson.msgToken = req.body.msgToken; // need token
    let user = new User(userJson);
    console.log("@@@@@@@@@@@@ [2] user @@@@@@@@@@@")
    console.log(user)
    User.upSertUser_p(user)
        .then(data => {
            console.log("@@@@@@@@@@@@ [3] updated msgToken for user: @@@@@@@@@@@")
            console.log(data)
            res.json({"data":data});
        })
        .catch(err=>{
            console.log("@@@@@@@@@@@@ [-3] failed upsertuser: @@@@@@@@@@@")
            console.log(err)
            res.json({"err":err});
        });
})
// 2.2  notify some other user
// [header]: idToken, 
// [body] : {user_id: to_be_notified_user_id, title:tile, message: message}

userRouter.post('/notify', (req,res,next)=>{
    console.log('@@@@@@@@@@@@@ [1] notify start : @@@@@@@@@@@@@@@');
    let title = req.body.title || "New Message";
    let message = req.body.message || "This is testing message";

    let notify_userid = req.body.user_id;
    if(!notify_userid) {
        console.log('@@@@@@@@@@@@@ [-2] no notify_userid in requrest: ' + notify_userid);
        res.json({"err":"Invalid user_id to be notified"});
        return;
    }
    console.log('@@@@@@@@@@@@@ [2] notify_userid = ' + notify_userid);

    User.getMsgtokenByUser_id_p(notify_userid)
        .then(msgToken =>{
            let messageObj = {
                data: {
                    title:title
                    ,message:message
                },
                token: msgToken
            };
            console.log('@@@@@@@@@@@@@ [3] Prepare message : @@@@@@@@@@@@@@@');
            console.log(messageObj);
            firebaseManager.admin.messaging().send(messageObj)
                    .then((response) => {
                        // Response is a message ID string.
                        console.log('@@@@@@@@@@@@@ [4] Successfully sent message : @@@@@@@@@@@@@@@');
                        console.log(response);
                        res.json({data:"Message sent successfully."})
                    })
                    .catch((err) => {
                        console.log('@@@@@@@@@@@@@ [-4] Error sending message : @@@@@@@@@@@@@');
                        console.log(err)
                        res.json({err:"Failed to send message."})
                    });
        }).catch(err => {
            console.log('@@@@@@@@@@@@@ [-3] Error: MsgToken not found @@@@@@@@@@@@@');
            res.json({"err":"MsgToken not found"});
            return;
        })
});



module.exports = userRouter; 