module.exports = {
    isRunningLodal:false,  /** running local => firebase use secret json file   */
    isMDbLocal:false,      /* use local mongodb instead of mlab, for local dev*/ 
    db_local_conn:'mongodb://localhost:27017/proxi-task-mdb',   
    port:3000
    /*,msgCode:{
        notConnected:0,
        notFound:1,
        dbOperationError:2,
        success:100
    }*/
    /**response.status:
    200 OK
    201 Created
    202 Accepted
    204 No Content

    
    400 Bad Request
    401 Unauthorized
    402 Payment Required
    403 Forbidden
    404 Not Found
    405 Method Not Allowed
    406 Not Acceptable
    423 Locked */
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