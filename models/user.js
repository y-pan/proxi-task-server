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
    ,address:{type:String, default:""}
    ,taskApplied:{type:[String], default:[]}        /** task-ids that I applied  */
    ,taskHired:{type:[String], default:[]}          /** task-ids that I was hired */
    ,taskCompleted:{type:[String], default:[]}      /** task-ids that I've completed  */
    ,taskCreated:{type:[String], default:[]}        /** task-ids that I created  */
    ,isAdmin:{type:Boolean, default:false} /** check to see if user is an admin */

    ,money:{type:Number, default:50}
    ,count:{type:Number, default:0}
},{collection:'user'});

const User = module.exports = mongoose.model('user',UserSchema); // creates variables for user schema

module.exports.login = (decodedToken) =>{ 
    let user_id = decodedToken.user_id;
    let email = decodedToken.email;
    let name = decodedToken.name;

    return new Promise((resolve, reject)=>{
        User.findOne({user_id:user_id}, (err, data)=>{
            if(err){
                reject(err);
            }else{
                if(!data){ 
                    /* create new user doc if not existing */
                    let userJson = {} 
                    userJson.user_id = user_id;
                    userJson.email = email;
                    userJson.name = name;

                    let _User = new User(userJson);
                    _User.save((_err, _data) =>{
                        if(err){
                            reject(_err)
                        }else{
                            if(!_data){
                                reject("Unknow error, try login again!");
                            }else{
                                resolve(_data) /** return  */
                            }
                        }
                    });
                }else{
                    resolve(data); /** just return the existing User data, not going to update user here */
                }
            }
        })
    });
}


module.exports.getUserByUserId_p = (user_id)=>{ /** user_id is the same one from firebase idToken */
    return new Promise((resolve, reject) => {
        User.findOne({user_id:user_id}, (err, data)=>{
            if(err){
                reject(err);
            }else{
                if(!data){
                    reject("User not found");
                }else{
                    resolve(data); /** data is user */
                }
            }
        });
    });
};

module.exports.setHired = (user_id, taskId) =>{
    return new Promise((resolve, reject)=>{
        User.findOne({user_id:user_id}, (err, data)=>{
            if(err){reject(err);}
            else if(!data){ reject("No such user"); }
            else{
                /** get user, update user.taskHired */
                if( data.taskHired.indexOf(taskId) > 0){
                    // already hired, don't re-hire again
                    console.log("## User.setHired done: User was already hired!");
                    resolve("User was already hired!");
                }else{
                    data.taskHired.push(taskId);
                    data.save((err, _data) =>{
                        if(!err || !_data){
                            console.log(err)
                            console.log("## User.setHired done: Unknow error, no data returned")
                            reject("## User.setHired done: Unknow error");
                        }else{
                            console.log("## User.setHired done: Updated user to be hired successfuly!");
                            resolve("Updated user to be hired successfuly!");
                        }
                    })
                }
            }
        })
    });
}

module.exports.updateUser = (infoJson) => {
    return new Promise((resolve,reject)=>{
        User.findOne({user_id : infoJson.user_id}, (err, userFound)=>{
            if(err){ 
                reject(err);
            }
            else {
                if(!userFound){
                    reject("User not found, try login again!");
                }else{
                    userFound.name = infoJson.name || userFound.name;
                    userFound.phone = infoJson.phone || userFound.phone;
                    userFound.address = infoJson.address || userFound.loc;
        
                    userFound.save((err, _data) =>{

                        if(err) {
                            reject(err)
                        }
                        else if(!_data){
                            reject("Unknow error, try again");
                        }else{
                            resolve(_data);
                        }
                    })
                }
            }
        })    
    });
};








/**========================== the following are not in use for now due to development time limited ================ */

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

module.exports.addUser_p = (newUser) =>{       //New User Registration
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

module.exports.upSertUser_p = (newUser) => {    //UPDATE if exists, INSERT new if does not exist, thus 'upSert'
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
module.exports.findAll_p = (callback) =>{ 
    return new Promise((resolve, reject) =>{
        User.find({},(err, data) =>{
            if(err){
                reject(err);
            }else{
                resolve(data);
            }
        });
    })
    
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
