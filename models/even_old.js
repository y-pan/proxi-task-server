// user has multiple events, host event / guest event
// event has event gps, set by host event
// distance between user and event need to be close enough to mark user attended event, event will record user

// data rules: no duplicated code, members and membersIn is email
// loc: [lat, lon]
const vars = require('../config/vars');

const mongoose = require('mongoose');

const EventSchema = mongoose.Schema({
    host_id:{type:String, require:true},
    title:{type:String, require:true},
    description:{type:String},
    subtitle:{type:String},
    latitude:{type:Number},
    longitude:{type:Number},
    date:{type:String}, /* start date of event, host/admin will postpond event by changing date, search event might need to filter if date expired or not */
    address:{type:String},

    members:{type:[String]},  /* members' _id who are enrolled to attend event */
    membersIn:{type:[String]},/* members' _id who actually marked attendance during valid time, within radius  */

    size:{type:Number},    /* max audience size */
    radius:{type:Number},   /* radius, within radius will be marked as attended, within valid duration */
    duration:{type:Number}  /* number of hours from the start date, so end-date = start-data + duration */
    
    ,active:{type:Boolean, default:true}
    ,suspended:{type:Boolean, default:false}

},{collection:'event'});
// eventStartTime:{type: Date, default: Date.now},

//coordinates:req.body.coordinates.split(',').map(Number)

//var distance = require('gps-distance');
// Measure between two points: 
//var result = distance(45.527517, -122.718766, 45.373373, -121.693604);

const Event = module.exports = mongoose.model('event',EventSchema);

module.exports.findAll = (callback) =>{
    Event.find({},callback);
};

module.exports.addEvent = (newEvent, callback) =>{
    newEvent.save(callback); // newEvent is a mongoose object
};
module.exports.updateEvent = (newEvent, callback) =>{
    console.log("-- in mongoose : "+newEvent);
    newEvent.save(callback); // newEvent is a mongoose object
    // newEvent.findOneAndUpdate({"_id":newEvent._id},newEvent,callback);
};
module.exports.getEventsByQueryJson = (jsonObject, callback)=>{
    const query = jsonObject;
    Event.find(query, callback); 
};

module.exports.getEventByQueryJson = (jsonObject, callback)=>{
    const query = jsonObject;
    Event.findOne(query, callback); 
};





// ===========================================
module.exports.getEventsByHostId = (host_id, callback)=>{
    const query = {host_id:host_id};
    

    Event.find(query, callback);
};
module.exports.getEventByCode_p = (code) => {
    return new Promise((resolve, reject) => {
        const query = {code:code};
        Event.findOne(query, (err, data)=>{
            if(err){ reject(vars.MSG.ERROR_CONNECTION); }
            else if(!data){
                reject(vars.MSG.ERROR_NOTFOUND);
            }
            else{ resolve(data); }
        });
    }); 
};


module.exports.getEventByName = (name, callback)=>{
    const query = {name:name};
    Event.findOne(query, callback);
};

module.exports.getEventById = (id,callback)=>{
    Event.findById(id, callback); // id refers to _id. When mongodb saves an data object(document) into collection, it creats unique _id within the document, as an additional attribute
};



module.exports.deleteEventById = (id, callback) => {
    Event.findById(id, (err, eventFound)=>{
        if(err){ 
            callback(vars.ERROR_CONNECTION,null); 
            console.log(" => 0");
        } else {
            if(!eventFound){
                callback(vars.ERROR_NOTFOUND, null);
                console.log(" => 1");
            } else{
                eventFound.remove((err, eventFound)=>{
                    if(err){ 
                        console.log(" => 2");
                        callback(vars.ERROR_REMOVE_FAILED, null); 
                    } else {
                        console.log(" => 3");
            
                        callback(null, eventFound); 
                    }
                })
            }

    };
})};

// if(err){ callback(vars.ERROR_CONNECTION,null); }
// else if(!eventFound){ callback(vars.ERROR_NOTFOUND, null);}
// else{eventFound.remove((err, eventFound)=>{
//     if(err){ callback(vars.ERROR_REMOVE_FAILED, null); }
//     else{ callback(null, eventFound); }
// })}



module.exports.updateEventById = (id, body, callback) => {
    Event.findById(id, (err, eventFound)=>{
        if(err){ 
            callback(vars.ERROR_NOTFOUND, null);
        } else {
            if(!eventFound){
                callback(vars.MSG.ERROR_NOTFOUND, null);
            }else{
                eventFound.host_id = body.host_id || eventFound.host_id;
                eventFound.title = body.title || eventFound.title;
                eventFound.discription = body.discription || eventFound.discription;
                eventFound.subtitle = body.subtitle || eventFound.subtitle;
                eventFound.latitude = body.latitude || eventFound.latitude;
    
                eventFound.longitude = body.longitude || eventFound.longitude;
                eventFound.date = body.date || eventFound.date;
                eventFound.address = body.address || eventFound.address;
    
                eventFound.members = body.members || eventFound.members;
                eventFound.membersIn = body.membersIn || eventFound.membersIn;
                eventFound.size = body.size || eventFound.size;
                eventFound.radius = body.radius || eventFound.radius;
                eventFound.duration = body.duration || eventFound.duration;
                
                eventFound.active = body.active || eventFound.active;
                eventFound.suspended = body.suspended || eventFound.suspended;
                
                
                eventFound.save((err, eventFound) =>{
                    if(err) {callback(vars.ERROR_UPDATE_FAILED,null); }
                    else{ callback(null, eventFound); }
                })
            }
            
        }
    })    
};