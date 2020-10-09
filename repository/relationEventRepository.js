const models = require('../database/models')
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes
const Op = models.Op
/**
 * 仓库层：用户关系数据读写
 */

const UserRelation = models.UserRelation
const UserConversation = models.Conversation
const RelationEvent = models.RelationEvent
const User = models.User

/**
 * 好友申请
 * @param userId
 * @param friendId
 * @returns {Promise<string|[number, Model<TModelAttributes, TCreationAttributes>[]]|Model<TModelAttributes, TCreationAttributes>|*>}
 */
exports.applyFriend = async function (userId, friendId) {
    let message = await RelationEvent.findAll({where: {[Op.and]: [{userId: userId}, {friendId: friendId}, {state: 'REQUESTING'}]}})
    if (message.length !== 0) {
        return 1
    }
    message = await UserRelation.findAll({where: {[Op.and]: [{userId: userId}, {friend: friendId}]}})
    if (message.length !== 0) {
        return 2
    }
    return await RelationEvent.create({
        userId: userId,
        friendId: friendId,
        state: 'REQUESTING',
        read: false
    })
}

/**
 * 接受好友申请
 * @param eventId
 * @returns {Promise<{user1: ({type: *}|{}), user2: {type: *}}>}
 */
exports.acceptFriendApply = async function (id) {
    let result
    result = await RelationEvent.findByPk(id)
    await RelationEvent.update(
        {state: 'ACCEPTED'},
        {
            where: {
                [Op.or]: [
                    {[Op.and]: [{id: id}, {state: 'REQUESTING'}]},
                    {[Op.and]: [{userId: result.friendId}, {friendId: result.userId}, {state: 'REQUESTING'}]}
                ]
            }
        })
    return {user1: result.userId, user2: result.friendId}
}

/**
 * 拒绝好友申请
 * @param eventId
 * @returns {Promise<[number, Model<TModelAttributes, TCreationAttributes>[]]>}
 */
exports.rejectFriendApply = async function (id) {
    let result
    result = await RelationEvent.findByPk(id)
    await RelationEvent.update(
        {state: 'REJECTED'},
        {
            where: {
                [Op.or]: [
                    {[Op.and]: [{id: id}, {state: 'REQUESTING'}]},
                    {[Op.and]: [{userId: result.friendId}, {friendId: result.userId}, {state: 'REQUESTING'}]}]
            }
        }
    )
    return result
}

/**
 * 获取好友申请信息（对方正在申请且未读）
 * @param userId
 * @returns {Promise<Model<TModelAttributes, TCreationAttributes>[]>}
 */
exports.getUnread = function (userId) {
    return RelationEvent.findAll({
        where:
            {[Op.and]: [{friendId: userId}, {state: 'REQUESTING'}, {read: false}]}
    })
}

/**
 * 获取好友申请信息（所有和自己相关）
 * @param userId
 * @returns {Promise<Model<TModelAttributes, TCreationAttributes>[]>}
 */
exports.getMine = function (userId) {
    return RelationEvent.findAll({
        where: {
            [Op.or]: [{friendId: userId}, {userId: userId}]
        },
        include:[
            {
                attributes:['id','avatar','nickname'],
                foreignKey:'friendId',
                as:'user2',
                model:User
            },
            {
                attributes:['id','avatar','nickname'],
                foreignKey:'userId',
                as:'user1',
                model:User
            }
        ]
    })
}

/**
 * 获取自己被拒绝的申请
 * @param userId
 * @returns {Promise<Model<TModelAttributes, TCreationAttributes>[]>}
 */
exports.getRejected = function (userId) {
    return RelationEvent.findAll({
        where:
            {[Op.and]: [{userId: userId}, {state: 'REJECTED'}]}
    })
}

/**
 * 获取自己被删的事件
 * @param userId
 * @returns {Promise<Model<TModelAttributes, TCreationAttributes>[]>}
 */
exports.getDeleted = function (userId) {
    return RelationEvent.findAll({
        where:
            {[Op.and]: [{friendId: userId}, {state: 'DELETE'}]}
    })
}

/**
 * 删除好友与会话
 * @param userId
 * @param friendId
 * @returns {Promise<number>}
 */
exports.delFriend = function (userId, friendId) {
    return UserConversation.destroy({where: {[Op.or]: [{key: userId + '-' + friendId}, {key: friendId + '-' + userId}]}}).then((value) => {
        return UserRelation.destroy({
            where: {
                [Op.or]: [
                    {[Op.and]: [{userId: userId}, {friend: friendId}]},
                    {[Op.and]: [{userId: friendId}, {friend: userId}]}
                ]
            }
        })
    }).catch((err) => {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    })
}

/**
 * 创建删除事件
 * @param userId
 * @param friendId
 * @returns {Promise<Model<TModelAttributes, TCreationAttributes>>}
 */
exports.deleteEvent = function (userId, friendId) {
    return RelationEvent.create({
        userId: userId,
        friendId: friendId,
        state: 'DELETE',
        read: false
    })
}

/**
 * 将用户的所有未读标记为已读
 * @param userId
 * @returns {Promise<[number, Model<TModelAttributes, TCreationAttributes>[]]>}
 */
exports.markRead = function (userId) {
    return RelationEvent.update(
        {read: true},
        {where: {friendId: userId}}
    )
}