const vars = require('../config/vars');

const lib = require('../lib/lib1');
const express = require('express');
const userRouter = express.Router();
const fbAdmin = require('firebase-admin') // firebase

const User = require('../models/user');    // user mongoose model

const Task = require('../models/task');  // user will join task 
console.log("-----------now to do fb serviceAccount----------")
// -------------------------- start: firebase db connection ---------------
let serviceAccount = lib.getFbServiceAccount();
console.log(serviceAccount)
console.log("-----------now to do initializeApp----------")

let firebaseAdmin = fbAdmin.initializeApp({
    credential:fbAdmin.credential.cert(serviceAccount),
    // databaseURL:lib.getFbDatabaseURL()    // for project
    databaseURL: "https://fbdemo-2fd3c.firebaseio.com"
});
console.log("-----------after initializeApp----------")

let fbDb = firebaseAdmin.database();
console.log("-----------after fbDb----------")

// -------------------------- end: firebase db connection ------------------
// -------------------------- user/task in mongo,  firebase???
userRouter.get('/', (req, res) => {
    // res.status(200);
    res.json({"data":"userRouter"}); }
);


// 2.1 POST create userId | msgtoken pair, in User collection,   need {msgToken: req.body.msgToken}
userRouter.post('/storeToken', (req,res)=>{
    
    let idToken = req.get('idToken');
    if(!idToken){
        res.json({"err":"invalid token"});
        return;
    }
    fbAdmin.auth().verifyIdToken(idToken)
        .then((decodedToken)=>{
            let user_id = decodedToken.user_id;
            let userJson = req.body.msgToken; // need token:
            userJson.user_id = user_id;
            let user = new User(userJson);
            User.upSertUser_p(user)
                .then(data => {
                    res.json({"data":data});
                })
                .catch(err=>{
                    res.json({"err":err});

                });
        })
        .catch(err =>{
            console.log("------- invaild token --------")
            console.log(err)
            res.json({"err":err});
            return;
        })
})
// 2.2  notify some other user,    need {user_id: req.body.user_id}
userRouter.get('/notify', (req,res,next)=>{

    let title = req.body.title || "New Message";
    let message = req.body.message || "This is testing message";

    let idToken = req.get('idToken');
    if(!idToken){
        res.json({"err":"invalid token"});
        return;
    }
    let notify_userid = req.body.user_id;
    if(!notify_userid) {
        res.json({"err":"invalid notify_userid"});
        return;
    }
    fbAdmin.auth().verifyIdToken(idToken)
        .then((decodedToken)=>{
            User.getMsgtokenByUser_id_p(notify_userid)
                .then(msgToken =>{
                    let messageObj = {
                        data: {
                          title:title
                         ,message:message
                        },
                        token: msgToken
                      };
                      fbAdmin.messaging().send(messageObj)
                            .then((response) => {
                                // Response is a message ID string.
                                console.log('Successfully sent message', response);
                                res.json({data:"Message sent successfully."})
                            })
                            .catch((error) => {
                                console.log('Error sending message:', error);
                                res.json({data:"Failed to send message."})
                            });
                })
        }).catch(err => {
            res.json({"err":"error"});
            return;
        })
});

// here is the business
/*
res.status(200);
200 ; 204 No Content
401 (idToken invalid/expired)
404 other error
*/



module.exports = userRouter; 