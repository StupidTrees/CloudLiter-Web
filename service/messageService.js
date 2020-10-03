const repository = require('../repository/messageRepository');
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes
const textUtils = require('../utils/textUtils')


/**
 * 更新会话信息
 * @param message
 */
exports.saveMessage = async function(message){
    let value = null
    try {
        value = await repository.saveMessage(message)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error,e))
    }
    if(value===null){
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error))
    }
    //console.log("value",value.get())
    return Promise.resolve(jsonUtils.getResponseBody(codes.success,value.get()))
}

/**
 * 获取某对话的所有消息
 * @param conversationId
 */
exports.getMessages = async function(conversationId){
    let value = null
    try {
        value = await repository.getMessagesOfOneConversation(conversationId)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error,e))
    }
    if(value===null){
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error))
    }
    let res = []
    value.forEach(function (item) {
        //console.log('item',item.get())
        res.push(item)
    })
    return Promise.resolve(jsonUtils.getResponseBody(codes.success,res))
}

/**
 * 获得某用户所有未读消息
 * @param userId
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.getUnreadMessage = async function(userId){
    let value = null
    try {
        value = await repository.getUnreadMessagesOfOneUser(userId)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error,e))
    }
    if(value===null){
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error))
    }
    let res = []
    value.forEach(function (item) {
        //console.log('item',item.get())
        res.push(item)
    })
    return Promise.resolve(jsonUtils.getResponseBody(codes.success,res))
}

/**
 * 将某消息标记为已读
 * @param messageId
 */
exports.markRead = async function(messageId){
    try {
        await repository.markRead(messageId)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error,e))
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.success))
}

/**
 * 某对话全部标记为已读
 * @param toUserId
 * @param conversationId
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.markAllRead = async function(toUserId,conversationId){
    try {
        await repository.markAllRead(toUserId,conversationId)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error,e))
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.success))
}