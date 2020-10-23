const repository = require('../repository/userRelationRepository')
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes
const convRepository = require('../repository/conversationRepository')
const wordCloudRepository = require('../repository/wordCloudRepository')
const textUtils = require('../utils/textUtils')
const tools = require("../utils/tools");

/**
 * 服务层：关系操作
 */

/**
 * 获取某用户的所有朋友
 * @param id
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.getFriends = async function (id) {
    let value = null
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
 * 建立好友关系
 * @param user1
 * @param user2
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.makeFriends = async function (user1, user2) {
    //不能和自己成为好友
    if (textUtils.equals(user1, user2)) {
        return Promise.reject(jsonUtils.getResponseBody(codes.make_friends_with_myself))
    }
    //在关系表里插入数据
    try {
        await repository.makeFriends(user1, user2)
    } catch (err) {
        console.log('关系表插入失败', err)
        if (err.original.code === 'ER_DUP_ENTRY') { //主键重复，即已经是好友
            return Promise.reject(jsonUtils.getResponseBody(codes.already_friends))
        } else if (err.original.code === 'ER_NO_REFERENCED_ROW_2') { //外键不存在，即有一个用户id是假的
            return Promise.reject(jsonUtils.getResponseBody(codes.make_friends_with_ghost))
        }
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    }
    //在对话表里直接开启一个对话
    try {
        await convRepository.newConversation(user1, user2)
    } catch (err) {
        console.log('对话表插入失败', err)
        if (err.original.code === 'ER_DUP_ENTRY') { //主键重复，即已有对话
            return Promise.reject(jsonUtils.getResponseBody(codes.conversation_exists))
        }
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.success))
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

// /**
//  * 删除好友
//  * @param id1
//  * @param id2
//  * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
//  */
// exports.deleteFriend = async function (id1, id2) {
//     let value
//     try {
//         value = await repository.deleteFriend(id1, id2)
//
//     } catch (e) {
//         console.log(e)
//         return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
//     }
//     if (value === 0) {
//         return Promise.reject(jsonUtils.getResponseBody(codes.relation_not_exists))
//     }
//     return Promise.resolve(jsonUtils.getResponseBody(codes.success))
// }
