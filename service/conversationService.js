const repository = require('../repository/conversationRepository');
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes


/**
 * 获取某一用户的所有对话
 * @param userId
 * @returns {Promise<never>}
 */
exports.getConversations = async function (userId){
    let value = null
    try {
        value = await repository.getConver
        sationsOfOneUser(userId)
    } catch (e) {
        console.log('err',e)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error,e))
    }

    if(value==null){
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error))
    }

    let res = []
    value.forEach(function (item,index){
        let relData = null
        let friendData = null
        if(item.get().user1Id===userId){
            relData = item.get()['relation1'].get()
            friendData = item.get()['user2'].get()
        }else{
            relData = item.get()['relation2'].get()
            friendData = item.get()['user1'].get()
        }

        let rawData = item.get()
        let data = {
            id:rawData.key,
            historyId: rawData.historyId,
            lastMessage: rawData.lastMessage,
            friendId:relData.friend,
            friendAvatar:friendData.avatar,
            friendNickname:friendData.nickname,
            group:relData.group,
            relationId:relData.key,
            createdAt:rawData.createdAt,
            updatedAt:rawData.updatedAt
        }
        res.push(data)
        console.log('item',data)
    })
    return Promise.resolve(jsonUtils.getResponseBody(codes.success,res))
}
