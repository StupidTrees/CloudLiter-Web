const repository = require('../repository/conversationRepository');
const whiteListRepository = require('../repository/whiteListRepository')
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes
const textUtils = require('../utils/textUtils')

/**
 * 获取某一用户的所有对话
 * @param userId
 */
exports.getConversations = async function (userId) {
    let value = null
    try {
        value = await repository.getConversationsOfOneUser(userId)
    } catch (e) {
        console.log('err', e)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    let res = []
    for(let i=0;i<value[0].length;i++){
        res.push(value[0][i])
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.success, res))
}

/**
 * 根据id获取某一对话
 * @param userId
 * @param friendId
 */
exports.getConversationById = async function (userId, friendId) {
    let value = null
    try {
        value = await repository.getConversationById(userId, friendId)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    if (value[0].length === 0) {
        return Promise.reject(jsonUtils.getResponseBody(codes.conversation_not_exist))
    }
    let data = value[0]
    return Promise.resolve(jsonUtils.getResponseBody(codes.success, data))
}

/**
 * 更新会话信息
 * @param fromId
 * @param toId
 * @param lastMessage
 */
exports.updateConversation = async function (fromId, toId, lastMessage) {
    try {
        await repository.updateConversation(fromId, toId, lastMessage)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.success))
}