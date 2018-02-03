// data rules: no duplicated email among users, so you can 
// loc: [lat, lon]
const vars = require('../config/vars');
const mongoose = require('mongoose');
const Event = require('./event');
const Lib = require('../Lib/lib1');
const UserSchema = mongoose.Schema({
    email:{type:String, require:true},
    password:{type:String, require:true},
    
    name:{type:String},
    number:{type:String},
    eventCodes:{type:[String]},
    loc: { type: [Number]}

    ,isAdmin:{type:Boolean, default:false}

},{collection:'user'});

const User = module.exports = mongoose.model('user',UserSchema);

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