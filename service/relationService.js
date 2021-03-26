const repository = require('../repository/userRelationRepository')
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes
require('../repository/wordCloudRepository');

/**
 * 获取某用户的所有朋友
 * @param id
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.getFriends = async function (id) {
    let value = null
    let conversationId = null
    try {
        value = await repository.getFriendsOfId(id)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    if (value == null) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error))
    }
    //构建结果列表
    let res = []
    value.forEach(function (item) {
        let usr = item.get().user
        let group = item.get().group
        res.push(
            {
                conversationId:item.get().conversationId,
                groupId: item.get().groupId,
                remark: item.get().remark,
                groupName: group == null ? null : group.groupName,
                friendNickname: usr.nickname,
                friendId: usr.id,
                friendGender: usr.gender,
                friendAvatar: usr.avatar
            })
    })
    console.log(res)
    //console.log("result", res)
    return Promise.resolve(jsonUtils.getResponseBody(codes.success, res));
}


/**
 * 获取我和某好友的关系
 * @param userId
 * @param friendId
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.queryRelation = async function (userId, friendId) {
    let value = null
    try {
        value = await repository.queryRelationWithId(userId, friendId)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    if (value == null) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error))
    }
    if (value.length === 0) {
        return Promise.reject(jsonUtils.getResponseBody(codes.relation_not_exists))
    }
    let dataRaw = value[0].get()
    let usr = dataRaw.user.get()
    let group = dataRaw.group
    let data = {
        conversationId:dataRaw.conversationId,
        groupId: dataRaw.groupId,
        remark: dataRaw.remark,
        groupName: group == null ? null : group.groupName,
        friendNickname: usr.nickname,
        friendId: usr.id,
        friendGender: usr.gender,
        friendAvatar: usr.avatar
    }
    //console.log("result", res)
    return Promise.resolve(jsonUtils.getResponseBody(codes.success, data));
}


/**
 *
 * @param user1
 * @param user2
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.isFriend = async function (user1, user2) {
    return await repository.isFriend(user1, user2).then((count) => {
        return Promise.resolve(jsonUtils.getResponseBody(codes.success, count > 0))
    }).catch((err) => {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    })
}

/**
 *
 * @param id1
 * @param id2
 * @param remark
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.friendRemark = async function (id1, id2, remark) {
    try {
        await repository.friendRemark(id1, id2, remark)
    } catch (e) {
        console.log(e)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.success
    ))
}
