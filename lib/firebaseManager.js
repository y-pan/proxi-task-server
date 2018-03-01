const lib = require('./lib1');
const self = module.exports;

module.exports.admin = null; // firebase
module.exports.serviceAccount = null;
module.exports.firebaseAdmin = null;
module.exports.database = null;

module.exports.init = (firebaseSdkNum) =>{
    self.admin = require('firebase-admin');  // firebase-admin is npm installed node module  
    self.serviceAccount = lib.getFirebaseServiceAccount(firebaseSdkNum);
    self.firebaseAdmin = self.admin.initializeApp({
        credential:self.admin.credential.cert( self.serviceAccount ),
        databaseURL:lib.getFirebaseDatabaseUrl(firebaseSdkNum) 
    });
    self.database = self.firebaseAdmin.database();
}