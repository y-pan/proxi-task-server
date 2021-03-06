'use strict'
const vars = require('./config/vars');   // general variables, settings, non-secret info
const lib = require('./lib/lib1');  // general util functions

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose'); // mongoClient

const logger = require('morgan'); // logger
const firebaseManager = require('./lib/firebaseManager');

const taskRouter = require('./routes/taskRouter');
const userRouter = require('./routes/userRouter');

/** we have variable : process.env.proxiTaskOnHeroku on heroku, not in local
 *  So if on heroku, we override vars.mongoDbConnectionNum and vars.firebaseSdkNum and set them 0 and use heroku env, 
 *  So no need to change value before deploying heroku
 */

if(process.env.proxiTaskOnHeroku){ /** override settings in vars */
    vars.mongoDbConnectionNum = 0
    vars.firebaseSdkNum = 0
}


// ------------------------ start: mongo db connection --------------------
mongoose.Promise = global.Promise;
let connNum = vars.mongoDbConnectionNum;
let connDesc = "";

if(connNum - 0 == 0){
    connDesc = "mlab - specified from env";
}else if(connNum - 0 == 1){
    connDesc = "mlab - specified from secret file";
}else{
    connDesc = "local mongodb";
}
mongoose.connect(lib.getMongoDbConnection(connNum)).then(()=>{
   console.log('[OK] MongoDB connection:'+ connNum + "; description: " + connDesc);    
}).catch((err)=>{
   console.log('[ERROR] MongoDB connection:'+ connNum + "; description: " + connDesc);    
});
// -------------------------- end: mongo db connection --------------------
firebaseManager.init(vars.firebaseSdkNum);

const app = express();
app.set('port', (process.env.PORT || 3000));

// middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(logger('dev')); // morgan logger for all request to be logged to server console, like 

// firebase check id first

function checkIdTokenFirst(req, res, next){
    let idToken = req.get('idToken');
    if(!idToken){
        res.json({"err":"invalid token"});
        return;
    }
    firebaseManager.admin.auth().verifyIdToken(idToken)
        .then((decodedToken)=>{

            // let user_id = decodedToken.user_id;
            // let user_email = decodedToken.email;
            req.decodedToken = decodedToken; // so accessable for next function
            next();
        }).catch((err) =>{ //3 invalid token, unauthorized
            // res.status(vars.CODE.RES_CODE_UNAUTH);
            console.log("------- invaild token --------")
            console.log(err)
            res.json({"err":err});
        })
}

app.use(checkIdTokenFirst);

app.use('/api/task',taskRouter); //    {root}/api/task will go for taskRouter
app.use('/api/user',userRouter); //    {root}/api/user  for user, msgToken,...


// ~~~~~~~~~~~~~~~~~~~~~~~~ dev debug routes : start ~~~~~~~~~~~~~~~~~~~~~~~~~~
app.get('/', (req, res)=>{ 
    res.json({"data":'ProxiTask server root: mongoDbConnectionNum='+connNum +"; connDesc="+connDesc +", firebaseSdkNum="+vars.firebaseSdkNum+'. Please go to /api'}); 
});

app.post('/test/reg_fcmIdToken', (req, res) =>{
    let user_id = req.body.user_id;
    let token = req.body.token;
    res.json({"data":"test msg: user_id="+user_id +"token="+ token})
    // res.send("I got your: user_id="+user_id + " | token=" + token);
});


app.post('/test/msg', (req,res,next)=>{
    let title = req.body.title ||  "ProxiTask message";
    let message = req.body.message || "You're hired from ProxiTask!";
    let registrationToken = req.get('msgToken');
    let shortToken = registrationToken.substring(registrationToken.length/2)
 // title=My%20Title&message=You're hired from ProxiTask! 

    var messageObj = {
        data: {
          title:title
         ,message:message
        },
        token: registrationToken
      };
    //   console.log(messageObj)
    //   console.log("------------------------------------------------------------")
    //   console.log(firebaseManager.admin)
    //   console.log("-------------------------------------------------")

      console.log(firebaseManager.admin.messaging())
      firebaseManager.admin.messaging().send(messageObj)
            .then((response) => {
                // Response is a message ID string.
                console.log('Successfully sent message:', response);
                // res.json({data:"Successfully sent message: title=" + title + "; msg=" + message})
                res.json({data:"Successfully sent message: title=" + title + "; msg=" + message + "; msgToken(last half)="+shortToken});
            })
            .catch((error) => {
                console.log(error);
                // res.json({data:"Error"})
                res.json({err:error, "msgToken(last half)":shortToken});
            });

});

// for idToken testing. 
app.post('/test/auth', (req,res,next)=>{
    // let idToken = req.body.idToken;
    let idToken = req.get('idToken');
    console.log(firebaseManager.admin)
   
    firebaseManager.admin.auth().verifyIdToken(idToken)
        .then((decodedToken)=>{
            res.status(vars.CODE.RES_CODE_OK)
            res.json({data:decodedToken});
        }).catch((err) =>{
            res.status(vars.CODE.RES_CODE_ERROR);
            res.json({err:err});
        })

});


app.get('/*', (req, res)=>{ 
    // console.log('config ref...');
    res.json({"err":'no such api!'}); 
});


// ~~~~~~~~~~~~~~~~~~~~~~~~ dev debug routes : end ~~~~~~~~~~~~~~~~~~~~~~~~~~

app.listen(app.get('port'), '0.0.0.0', ()=>{
    console.log("[OK] App is running: port=" + app.get('port') + ", mongoDbConnectionNum=" + vars.mongoDbConnectionNum + ", firebaseSdkNum=" + vars.firebaseSdkNum);
});
