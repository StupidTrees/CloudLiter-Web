const repository = require('../repository/conversationRepository');
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

    if (value == null) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error))
    }

    let res = []
    value.forEach(function (item) {
        let relData
        let friendData
        if (textUtils.equals(item.get().user1Id, userId)) {
            relData = item.get()['relation1'].get()
            friendData = item.get()['user2'].get()
        } else {
            relData = item.get()['relation2'].get()
            friendData = item.get()['user1'].get()
        }
        let rawData = item.get()
        let data = {
            id: rawData.key,
            historyId: rawData.historyId,
            lastMessage: rawData.lastMessage,
            friendId: relData.friendId,
            friendAvatar: friendData.avatar,
            friendNickname: friendData.nickname,
            friendRemark: relData.remark,
            group: relData.groupId,
            relationId: relData.key,
            createdAt: rawData.createdAt,
            updatedAt: rawData.updatedAt
        }
        res.push(data)
        // console.log('item',data)
    })
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
    if (value == null) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error))
    }
    if (value.length === 0) {
        return Promise.reject(jsonUtils.getResponseBody(codes.conversation_not_exist))
    }
    let rawData = value[0].get()
    //console.log("rawData",rawData)
    let relationData = rawData.hasOwnProperty('relation1') ? rawData['relation1'] : rawData['relation2']
    let userData = rawData.hasOwnProperty('user1') ? rawData['user1'] : rawData['user2']
    let data = {
        id: rawData.key,
        historyId: rawData.historyId,
        lastMessage: rawData.lastMessage,
        groupId: relationData.groupId,
        relationId: relationData.key,
        friendId: relationData.friendId,
        friendAvatar: userData.avatar,
        friendNickname : userData.nickname,
        friendRemark : relationData.remark,
        createdAt: rawData.createdAt,
        updatedAt: rawData.updatedAt
    }
    //console.log('data', data)
    return Promise.resolve(jsonUtils.getResponseBody(codes.success, data))
}

/**
 * 更新会话信息
 * @param fromId
 * @param toId
 * @param message
 */
exports.updateConversation = async function (fromId, toId, lastMessage) {
    try {
        await repository.updateConversation(fromId, toId, lastMessage)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.success))
}

