const repository = require('../repository/conversationRepository');
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes
const textUtils = require('../utils/textUtils')
const groupChatRepo = require('../repository/groupchatRepository')

/**
 * 获取某一用户的所有对话
 * @param userId
 */
exports.getConversations = async function (userId) {
    let res = []
    try {
        let value = await repository.getConversationsOfOneUser(userId)
        for (let i = 0; i < value[0].length; i++) {
            let data = value[0][i]
            let convName = null
            if (textUtils.isEmpty(data.friendRemark)) {
                convName = data.friendNickname
            } else {
                convName = data.friendRemark
            }
            data['name'] = convName
            res.push(data)
        }
        let value2 = await repository.getGroupConversationsOfOneUser(userId)
        for (let i = 0; i < value2[0].length; i++) {
            res.push(value2[0][i])
        }
    } catch (e) {
        console.log('err', e)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.success, res))
}

/**
 * 根据id获取某一对话
 * @param userId
 * @param conversationId
 */
exports.getConversationById = async function (userId, conversationId) {
    let value = null
    try {
        value = await repository.getConversationById(conversationId)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    if (value == null) {
        return Promise.reject(jsonUtils.getResponseBody(codes.conversation_not_exist))
    }
    let data = value.get()
    let convName
    if(!textUtils.isEmpty(data.groupId)){
        let groupEntity = await groupChatRepo.getGroupById(data.groupId)
        if(groupEntity!=null){
            convName = groupEntity.get().name
        }
    }else{
        let info = await repository.getRelationConversation(userId,conversationId)
        let infoData = info[0]
        if (textUtils.isEmpty(infoData.friendRemark)) {
            convName = infoData.friendNickname
        } else {
            convName = infoData.friendRemark
        }
    }
    data['name'] = convName
    return Promise.resolve(jsonUtils.getResponseBody(codes.success, data))
}
