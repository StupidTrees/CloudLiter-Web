


/**
 * 构建一个json格式的responseBody，可以带数据
 * @param type
 * @param data
 * @returns {{code: *, data: null, message: *}|{code: *, message: *}}
 */
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


