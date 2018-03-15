module.exports = {
    /** when you deploy onto heroku, 
     * both mongoDbConnectionNum and firebaseSdkNum will be override as 0, to use heroku env for both mongodb and firebase
     * */

    mongoDbConnectionNum:1 
    /** 0 - using heroku env, which is also for production; 
     *  1 - use mlab connection (same as production 0) but the connection value is from secret file; 
     *  2 - use local mongodb connection; 
     * */
    ,firebaseSdkNum:1
    /** 0 - using heroku env, which is also for productin; 
     *  1 - local projects firebase-adminsdk file in secret, so related using firebaseDatabaseURL1, same info as heroku; 
     *  2 - my demo fb, firebaseDatabaseURL2;
     *  3 - my old fb, firebaseDatabaseURL3, basically not in use 
     * */
    
    // ,isRunningLodal:true,  /** running local => firebase use secret json file   */
    // local_firebaseAdminSdkNum:0,  /** local_firebaseAdminSdkNum only in effect for "isRunningLodal" = true,  so 0-project's sdk, 1-demo sdk */
    // isMDbLocal:false,      /* use local mongodb instead of mlab, for local dev*/ 
    
    
    ,port:3000
    ,CODE:{
        RES_CODE_OK:200,
        RES_CODE_OK_BUT_EMPTY:204,
        RES_CODE_BAD_REQUEST:400,
        RES_CODE_UNAUTH:401,
        RES_CODE_ERROR:404,
    }
    ,MSG:{
        ERROR_INVALID_DATA:"Invalid data",
        ERROR_CONNECTION:"Failed to retrieve data",
        ERROR_NOTFOUND:"Data not found in database",
        ERROR_OPERATION:"Operation failed in database",
        ERROR_EMAIL_DUPLICATED:"Email is already used",
        ERROR_INVALID_REQUEST:"Invalid request",

        ERROR_EVENT_TITLE_DUPLICATED:"Event title duplicated",
        ERROR_EVENT_NOT_AVAILABLE:"Event not available, either expired or suspended",

        ERROR_HOST_NOTFOUND:"Host user not found in database",

        ERROR_USER_NO_NEED_SUBSCRIBE_OWN_EVENT:"User no need to subscribe own hosting event",
        ERROR_USER_NOTFOUND:"User not found",
        
        ERROR_UPDATE_FAILED:"Failed to update data, please try again",
        ERROR_REMOVE_FAILED:"Failed to remove data, please try again",
        

        SUCCESS:"Operation done sucessfully"
    }
}

// isDbLocal => use local mongodb, otherwise use cloud mongodb