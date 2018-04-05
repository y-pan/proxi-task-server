// data rules: no duplicated email among users, so you can 
// loc: [lat, lon]
const vars = require('../config/vars');
const mongoose = require('mongoose');
// const Event = require('./event');
const Lib = require('../lib/lib1'); //Primary location and distance calculation library
const UserSchema = mongoose.Schema({
    user_id:{type:String}                   /* firebase uid*/ 
    ,msgToken:{type:String, default:""} /* firebaseInstanceIdToken, so client can ask server to send notification message to other people based on user_id from idToken*/
    ,email:{type:String, default:""}  /** firebase email */
    // ,password:{type:String}          /** if from firebase, this will be null */
    ,name:{type:String, default:""}                 /** firebase name, user can reset it */
    ,phone:{type:String, default:""}                /** firebase number, user can reset it */
    ,taskApplied:{type:[String], default:[]}        /** my applied task-id */
    ,taskCompleted:{type:[String], default:[]}      /** my completed task-id */
    ,taskCreated:{type:[String], default:[]}        /** my created task-id */
    ,isAdmin:{type:Boolean, default:false} /** check to see if user is an admin */
},{collection:'user'});

const User = module.exports = mongoose.model('user',UserSchema); // creating variable for user schema

module.exports.login = (decodedToken) =>{ 
    let user_id = decodedToken.user_id;
    let email = decodedToken.email;
    
// ================================ Promise methods, currently in use (preferred over callbacks) =========

    return new Promise((resolve, reject)=>{
        User.findOne({user_id:user_id}, (err, data)=>{
            if(err){
                reject(err);
            }else{
                if(!data){ 
                    // create new user doc
                    let _user = {} 
                    _user.user_id = user_id;
                    _user.email = email;
                    let _User = new User(_user);
                    _User.save((_err, _data) =>{
                        if(err){
                            reject(_err)
                        }else{
                            resolve(_data)
                        }
                    });
                }else{
                    if(data.email != email){
                        data.email = email;
                        data.save((__err, __data)=>{
                            if(__err){reject(__err);}
                            else{ resolve(__data);}
                        })
                    }
                    else{resolve(data);}
                }
            }
        })
    });
    
    // when user login succeeded via Firebase on Android, user will do here
    // upsert user

    // get server profile for {"appliedTasks" : appliedTasks, "completedTasks" : completedTasks, "createdTasks" : createdTasks}

}

module.exports.getMsgtokenByUser_id_p = (user_id)=>{
    return new Promise((resolve, reject) => {
        User.findOne({user_id:user_id}, (err, data)=>{
            if(err){
                reject(err);
            }else{
                if(!data || !data.msgToken){reject("MsgToken Not Found.")}
                else{ resolve(data.msgToken);} /** only return msgToken, not whole user object */
            }
        }); 
    });
};

module.exports.addUser_p = (newUser) =>{   //New User Registration
    return new Promise((resolve, reject) =>{
        newUser.save((err,data) =>{
            if(err){
                reject(err);
            }else{
                resolve(data);
            }
        }); 
    })
};

module.exports.upSertUser_p = (newUser) => {  //UPDATE if exists, INSERT new if does not exist, thus 'upSert'
    return new Promise((resolve, reject)=>{
        if(!newUser.msgToken || !newUser.user_id){
            reject("missing critical info");
        }
        User.findOneAndUpdate({user_id:user_id},newUser,{ upsert: true }, (err, data)=>{
            if(err) {
                reject(err);
            }else{
                resolve(data);
            }
        });
    });
};

module.exports.updateUserMsgTokenByUser_id_p = (user_id, body) => {
    return new Promise((resolve, reject)=>{
        if(!body.msgToken || !user_id){
            reject("missing critical info");
        }
        User.findOne({user_id:user_id}, (err, data)=>{
            if(err) {reject(err); }
            if(body.msgToken == data.msgToken){
                resolve(data);// msgToken is same/up-to-date, no need to update    
            }else{ // different already, need to update
                data.msgToken = body.msgToken || data.msgToken
                data.save((err, data) =>{
                    if(err){
                        reject(err);
                    }else{
                        resolve(data);
                    }
                })
            }
        });
    });
};

// ================================ rest are callback, not in use, I like promise =========
module.exports.findAll = (callback) =>{ 
    User.find({},callback);
};

module.exports.addUser = (newUser, callback) =>{
    newUser.save(callback); // newUser is a mongoose object
};

//{"age":33}   33
// module.exports.getByAge  = (obj, cb) =>{
//     // obj = {"age":age};
//     User.findOne(obj,cb);
// }

module.exports.getUserByQueryJson = (jsonObject, callback)=>{
    const query = jsonObject;
    User.findOne(query, callback); 
};

module.exports.getUserByEmailPassword = (email, password, callback)=>{
    const query = {email:email, password:password};
    User.findOne(query, callback); 
};
module.exports.getUserByEmail = (email, callback)=>{
    const query = {email:email};
    User.findOne(query, callback); 
};

module.exports.getUserByEmail_p = (email) =>{
    return new Promise((resolve, reject) =>{
        const query = {email:email};
        User.findOne(query,(err,data)=>{
            if(err){ reject(vars.MSG.ERROR_CONNECTION); }
            else if(!data){
                reject(vars.MSG.ERROR_NOTFOUND);
            }
            else{ resolve(data); }
        });
    });
}

module.exports.getUserById = (id,callback)=>{
    User.findById(id, callback); // id refers to _id. When mongodb saves an data object(document) into collection, it creats unique _id within the document, as an additional attribute
};

module.exports.updateUserById = (id, body, callback) => {
    User.findById(id, (err, userFound)=>{
        if(err){ 
            callback(vars.MSG.ERROR_CONNECTION, null);
        }
        else {
            userFound.name = body.name || userFound.name;
            userFound.number = body.number || userFound.number;
            userFound.email = body.email || userFound.email;
            userFound.eventCodes = body.eventCodes || userFound.eventCodes;
            userFound.loc = body.loc || userFound.loc;

            userFound.save((err, userFound) =>{
                if(err) {callback(vars.MSG.ERROR_CONNECTION, null); }
                else{ callback(null, userFound); }
            })
        }
    })    
};

module.exports.deleteUserById = (id, callback) => {
    User.findById(id, (err, userFound)=>{
        if(err){callback(vars.MSG.ERROR_CONNECTION, null)}
        else if(!userFound){ callback(vars.MSG.ERROR_NOTFOUND, null); }
        else{userFound.remove((err, userFound)=>{
            if(err){ callback(vars.MSG.ERROR_CONNECTION, null)}
            else{ callback(null,userFound)}
        })}
    });
};

// module.exports.updateGps = (email,lat,lon,code,callback) =>{
    
//     Promise.all([User.getUserByEmail_p(email), Event.getEventByCode_p(code)]).then(responses=>{
//         let _user = responses[0];
//         let _event = responses[1];
//         //console.log("\n+++++++++++++++++++\n" + _user);
//         //console.log("\n*******************\n" + _event);
//         // now to calculate distance of 
//         _user.save()

//         _user.loc = [lat,lon];
//         _user.save((err, user) =>{
//             if(err) {callback(err,null); }
//             else{ 
//                 //callback(null, user); 
//                 //get distance
//                 // Lib to do distance _user.loc and _event.loc  !!!!!!!!!!!!!!!
//             }
//         })
//     }).catch(errors => {
//         callback("Some error happened", null);
//     })
/*
    User.getUserByEmail_p(email).then((user)=>{
        //callback(null,user);
        let _user = user;
        // save to db
        console.log("user not yet saved to db");
        Event.getEventByCode_p(code).then((event)=>{
            console.log("+++++++++++++++++++" + _user);
            console.log("*******************" + event);
        }).catch((err) =>{ callback(err,null)})
    }).catch((err)=>{
        callback(err,null);
    })*/
// } 

//(callback(null,data)).catch(callback("error",null));
    /*
    User.getUserByEmail(email,(err,userFound)=>{
        if(err){ callback(vars.MSG.ERROR_CONNECTION, null); }
        else if(!userFound) { callback(vars.MSG.ERROR_NOTFOUND, null); }
        else{
            //callback(null, userFound);
            // so user fould, update user gps
            userFound.loc = [lat,lon];
            userFound.save((err, userFound) =>{
                if(err) {callback(err,null); }
                else{ 
                    callback(null, userFound); 
                
                }
            })
            
        }
       
    }) ;*/