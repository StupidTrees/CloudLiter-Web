const repository = require('../repository/messageRepository');
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes
const textUtils = require('../utils/textUtils')
const relationRepository = require('../repository/userRelationRepository')

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
    let data = value.get()
    //console.log("value",value.get())
    //获取备注信息
    try {
        let res = await relationRepository.queryRemarkWithId(message.toId, message.fromId)
        data.friendRemark = res[0].get().remark
        let userData = res[0].get().user
        if(textUtils.isEmpty(res[0].get().remark)){
            data.friendRemark = userData.get().nickname
        }
        data.friendAvatar = userData.get().avatar
        console.log('data',data)
    } catch (e) {
        console.log('err',e)
    }

    return Promise.resolve(jsonUtils.getResponseBody(codes.success,data))
}

/**
 * 获取某对话的历史消息
 * @param conversationId 对话id
 * @param fromId
 * @param pageSize 分页大小
 */
exports.queryHistoryMessage = async function(conversationId, fromId, pageSize){
    let value = null
    try {
        value = await repository.getMessagesOfOneConversation(conversationId,fromId,pageSize)
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
 * 拉取某对话的最新消息
 * @param conversationId 对话id
 * @param afterId
 */
exports.pullLatestMessage = async function(conversationId,afterId){
    let value = null
    try {
        value = await repository.pullLatestMessagesOfConversation(conversationId,afterId)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error,e))
    }
    if(value===null){
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error))
    }
    let res = []
    value.forEach(function (item) {
        res.push(item)
    })
    return Promise.resolve(jsonUtils.getResponseBody(codes.success,res))
}


/**
 * 获得某用户所有未读消息
 * @param userId
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.countUnreadMessage = async function(userId){
    let value = null
    try {
        value = await repository.getUnreadConversationsOfOneUser(userId)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error,e))
    }
    if(value===null){
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error))
    }
    let res = {}
    value.forEach(function (item) {
        //console.log('item',item.get())
        if(!res.hasOwnProperty(item.get().conversationId)){
            res[item.get().conversationId] = 1
        }else{
            res[item.get().conversationId]+= 1
        }
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