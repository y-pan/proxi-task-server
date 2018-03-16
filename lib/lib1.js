
const vars = require('../config/vars');
const geolib = require('geolib'); // npm package
const self = module.exports;
module.exports.greeting = "hello this is lib1";
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


module.exports.getDistanceFromLatLon = (lat1,lon1,lat2,lon2) =>{
	let dis = geolib.getDistance(
		{latitude: lat1, longitude: lon1},
		{latitude: lat2, longitude: lon2}
	); // in meters

	console.log(lat1 + " " + lon1+ " , " + lat2+ " " + lon2+ " = " + dis / 1000);
	return dis/1000;  // make it km
    // var R = 6371; // Radius of the earth in km
    // var dLat = (lat2-lat1) * (Math.PI/180);  // deg2rad below
    // var dLon = (lon2-lon1) * (Math.PI/180); 
    // var a = 
    //   Math.sin(dLat/2) * Math.sin(dLat/2) +
    //   Math.cos(lat1* (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * 
    //   Math.sin(dLon/2) * Math.sin(dLon/2) ; 
    // var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    // return  R * c;// Distance in km
}
module.exports.getSecret = () =>{  // secret.js file 
	let sec = require('../config/secret/secret');
	return sec;
}
module.exports.getMongoDbConnection = (mongoDbConnectionNum) =>{
	switch(mongoDbConnectionNum){
		case 1: return self.getSecret().mlab_conn;
		case 2: return self.getSecret().mongoDbLocalConn; //vars.db_local_conn;

		case 0:
		default: return process.env.mlab_conn;	
	}
}
// module.exports.getMDbType = () =>{
// 	if(vars.isMDbLocal == true){
// 		return "LOCAL";
// 	}else{
// 		return "CLOUD";
// 	}
// }

module.exports.getFirebaseDatabaseUrl = (firebaseSdkNum)=>{
	switch(firebaseSdkNum){
		case 1: return self.getSecret().firebaseDatabaseURL1;
		case 2: return self.getSecret().firebaseDatabaseURL2;
		case 3: return self.getSecret().firebaseDatabaseURL3;
		case 0: 
		default: return process.env.fb_databaseURL
	}
}
module.exports.validateTask = (task) =>{
	if(!task || !task.user_id || !task.user_email || !task.title) return false;
	return true;
}
module.exports.validateAdmin = (decodedToken) =>{
	// kind of hardcoded admin user here
	if(!decodedToken || !decodedToken.user_id || !decodedToken.user_email || decodedToken.user_email != "proxitaskproject@gmail.com") return false;
	return true;
}

module.exports.getFirebaseServiceAccount = (firebaseSdkNum) =>{
	switch(firebaseSdkNum){
		case 1: return require("../config/secret/firebase-adminsdk1.json");  /** same as heroku */
		case 2: return require("../config/secret/firebase-adminsdk2.json"); /** my demo */
		case 3: return require("../config/secret/firebase-adminsdk3.json"); /** my old, not in use */

		case 0:  /** heroku env */
		default:
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
			//   console.log(acc)
			return acc;
	}

	// if(vars.isRunningLodal){
	// 	// local : local account json file
	// 	return require("../config/secret/firebase-adminsdk.json");
	// }else{
	// 	// cloud : use env
	// 	let acc = {
	// 		"type": process.env.fb_type,
	// 		"project_id": process.env.fb_project_id,
	// 		"private_key_id": process.env.fb_private_key_id,
	// 		"private_key": process.env.fb_private_key.replace(/\\n/g, '\n'),
	// 		"client_email": process.env.fb_client_email,
	// 		"client_id": process.env.fb_client_id,
	// 		"auth_uri": process.env.fb_auth_uri,
	// 		"token_uri": process.env.fb_token_uri,
	// 		"auth_provider_x509_cert_url": process.env.fb_auth_provider_x509_cert_url,
	// 		"client_x509_cert_url": process.env.fb_client_x509_cert_url
	// 	  }
	// 	//   console.log(acc)
	// 	  return acc;
	// }
}

module.exports.arrayContains = (array, element) => {
	for(var i=0; i<array.length; i++){
		console.log("matcheding: " + array[i] +  " | " + element )
		if(array[i] == element) {
			console.log("YES")
			return true;
		}
	}
	return false;
}