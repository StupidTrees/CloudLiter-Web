const ERROR_USER_NOT_EXIST = 3001
const ERROR_WRONG_PASSWORD = 3002


exports.getResponseBody = function (type,data=null){
    if(data==null){
        return {
            code:type.code,
            message: type.message
        }
    }else{
        return {
            code:type.code,
            message:type.message,
            data:data
        }
    }

}


