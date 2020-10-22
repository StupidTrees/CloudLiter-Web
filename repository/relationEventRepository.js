const models = require('../database/models')
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes
const Op = models.Op
const tools = require('../utils/tools')
/**
 * 仓库层：用户关系数据读写
 */

const UserRelation = models.UserRelation
const Message = models.Message
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
    message = await UserRelation.findAll({where: {[Op.and]: [{userId: userId}, {friendId: friendId}]}})
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
 * @returns {Promise<{user1: ({type: *}|{}), user2: {type: *}}>}
 * @param id
 */
exports.acceptFriendApply = async function (id) {
    let result
    result = await RelationEvent.findByPk(id)
    await RelationEvent.update(
        {state: 'ACCEPTED', responseRead: false},
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
        {state: 'REJECTED', responseRead: false},
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
 */
exports.getUnread = function (userId) {
    return RelationEvent.findAll({
        where:
            {[Op.and]: [{friendId: userId}, {state: 'REQUESTING'}, {read: false}]}
    })
}

/**
 * 计数未读好友事件数目
 * @param userId
 */
exports.countUnread = function (userId) {
    return RelationEvent.count({
        where: {
            [Op.or]: [
                {
                    [Op.and]: [
                        {friendId: userId},
                        {read: false}]
                },
                {
                    [Op.and]: [
                        {userId: userId},
                        {responseRead: false}]
                }

            ]
        }
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
        order: [['createdAt', 'DESC']]
        ,
        include: [
            {
                attributes: ['id', 'avatar', 'nickname'],
                foreignKey: 'friendId',
                as: 'user2',
                model: User
            },
            {
                attributes: ['id', 'avatar', 'nickname'],
                foreignKey: 'userId',
                as: 'user1',
                model: User
            }
        ]
    })
}


/**
 * 删除好友与会话
 * @param userId
 * @param friendId
 * @returns {Promise<number>}
 */
exports.deleteFriend = function (userId, friendId) {
    let id = tools.getP2PIdOrdered(userId, friendId)
    return Message.destroy({
        where: {
            conversationId: id
        }
    }).then((value) => {
        return UserConversation.destroy({
            where: {
                key: id
            }
        })
    }).then((value) => {
        return UserRelation.destroy({
            where: {
                [Op.or]: [
                    {
                        key: tools.getP2PId(userId, friendId)
                    }, {
                        key: tools.getP2PId(friendId, userId)
                    }
                ]
            }
        })
    })

}

/**
 * 创建删除事件
 * @param userId
 * @param friendId
 * @returns {Promise<Model<TModelAttributes, TCreationAttributes>>}
 */
exports.createDeleteEvent = function (userId, friendId) {
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
 */
exports.markRead = function (userId) {
    return RelationEvent.update(
        {read: true},
        {
            where: {
                friendId: userId,
            }
        }
    ).then((() => {
        return RelationEvent.update(
            {responseRead: true},
            {
                where: {
                    [Op.and]: [
                        {userId: userId},
                        {responseRead: false}
                    ]
                }
            }
        )
    }))
}