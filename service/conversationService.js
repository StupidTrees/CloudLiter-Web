const repository = require('../repository/conversationRepository');
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes
const constants = require('../utils/consts')
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
            data.name = convName
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
    if (data.type === 'GROUP') {
        let groupEntity = await groupChatRepo.getGroupById(data.groupId)
        if (groupEntity != null) {
            data.name = groupEntity.get().name
        }
    } else {
        let info = await repository.getRelationConversationInfo(userId, conversationId)
        let infoData = info[0][0]
        data.friendId = infoData.friendId
        data.avatar = infoData.avatar
        if (textUtils.isEmpty(infoData.friendRemark)) {
            data.name = infoData.friendNickname
        } else {
            data.name = infoData.friendRemark
        }
    }

    return Promise.resolve(jsonUtils.getResponseBody(codes.success, data))
}


/**
 * 获取会话无障碍情况
 * @param userId 查询者
 * @param conversationId 对话id
 * @param type
 */
exports.getConversationAccessibilityInfo = async function (userId, conversationId, type) {
    if (type === 'FRIEND') {
        let value = await repository.getFriendAccessibilityInfo(userId, conversationId)
        if (value[0].length > 0) {
            let rValue = value[0][0]
            let data = {
                conversationId: conversationId,
                visual: ((rValue.type & constants.userTypes.VISUAL) !== 0 && rValue.typePermission !== 'PRIVATE') ? 1 : 0,
                hearing: ((rValue.type & constants.userTypes.HEARING) !== 0 && rValue.typePermission !== 'PRIVATE') ? 1 : 0,
                limb: ((rValue.type & constants.userTypes.LIMB) !== 0 && rValue.typePermission !== 'PRIVATE') ? 1 : 0
            }
            return Promise.resolve(jsonUtils.getResponseBody(codes.success, data))
        }
    } else {
        let value0 = await repository.getGroupAccessibilityInfo(userId, conversationId, constants.userTypes.VISUAL)
        let value1 = await repository.getGroupAccessibilityInfo(userId, conversationId, constants.userTypes.HEARING)
        let value2 = await repository.getGroupAccessibilityInfo(userId, conversationId, constants.userTypes.LIMB)
        let data = {
            conversationId: conversationId,
            visual: value0[0][0].count,
            hearing: value1[0][0].count,
            limb: value2[0][0].count
        }
        return Promise.resolve(jsonUtils.getResponseBody(codes.success, data))
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.other_error, "errrr"))
}
