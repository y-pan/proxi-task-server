module.exports = {
    isDbLocal:false,    
    port:3000,
    msgCode:{
        notConnected:0,
        notFound:1,
        dbOperationError:2,
        success:100
    },
    MSG:{
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