const vars = require('../config/vars');
const self = module.exports;
module.exports.calCulateDistance = (lat1, lon1, lat2, lon2, unit) => {
	var radlat1 = Math.PI * lat1/180
	var radlat2 = Math.PI * lat2/180
	var theta = lon1-lon2
	var radtheta = Math.PI * theta/180
	var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
	dist = Math.acos(dist)
	dist = dist * 180/ Math.PI
	dist = dist * 60 * 1.1515
	if (unit=="K") { dist = dist * 1.609344 }
	if (unit=="N") { dist = dist * 0.8684 }
	return dist
}


module.exports.getDistanceFromLatLonInMeter = (lat1,lon1,lat2,lon2) =>{
    var R = 6371; // Radius of the earth in km
    var dLat = (lat2-lat1) * (Math.PI/180);  // deg2rad below
    var dLon = (lon2-lon1) * (Math.PI/180); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1* (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2) ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c * 1000; // Distance in meter
    return d;
}
module.exports.getSecret = () =>{  // secret.js file 
	let sec = require('../config/secret/secret');
	return sec;
}
module.exports.getMDb = () =>{
	if(vars.isMDbLocal == true){
		return vars.db_local_conn;
	}else{
		if(vars.isRunningLodal == true){
			return self.getSecret().mlab_conn;
		}else{
			return process.env.mlab_conn;
		}
	}
}
module.exports.getMDbType = () =>{
	if(vars.isMDbLocal == true){
		return "LOCAL";
	}else{
		return "CLOUD";
	}
}

module.exports.getFbDatabaseURL = ()=>{
	if(vars.isRunningLodal){
		return self.getSecret().fb_databaseURL;
	}else{
		return process.env.fb_databaseURL;
	}
}
module.exports.getFbServiceAccount = () =>{
	if(vars.isRunningLodal){
		// local : local account json file
		return require("../config/secret/proxi-task-db-firebase-adminsdk-ml7rx-97d42c4d32.json");
	}else{
		// cloud : use env
		let acc = {
			"type": process.env.fb_type,
			"project_id": process.env.fb_project_id,
			"private_key_id": process.env.fb_private_key_id,
			"private_key": process.env.fb_private_key.replace(/\\n/g, '\n'),
			"client_email": process.env.fb_client_email,
			"client_id": process.env.fb_client_id,
			"auth_uri": process.env.fb_auth_uri,
			"token_uri": process.env.fb_token_uri,
			"auth_provider_x509_cert_url": process.env.fb_auth_provider_x509_cert_url,
			"client_x509_cert_url": process.env.fb_client_x509_cert_url
		  }
		  return acc;
	}
}
