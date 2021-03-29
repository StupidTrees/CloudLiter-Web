const models = require('../database/models')
const Op = models.Op
const sequelize = require('../database/connector').sequelize
/**
 * 仓库层：对话表数据读写
 */

const Conversation = models.Conversation
const GroupMemberTable = models.GroupMember
/**
 * 创建新对话
 * @param id1 用户1
 * @param id2 用户2
 */
exports.newFriendConversation = function (id1, id2) {
    let smallId = Math.min(id1, id2)
    let largeId = Math.max(id1, id2)
    return Conversation.create({
        user1Id: smallId,
        user2Id: largeId,
        type: 'FRIEND',
        groupId: null,
        lastMessage: '已经成为好友啦，说句话吧！'
    })
}

/**
 * 创建群组绘画
 * @param groupId
 */
exports.newGroupConversation = function (groupId) {
    return Conversation.create({
        groupId: groupId,
        type: 'GROUP',
        lastMessage: '已经创建群组，说句话吧！'
    })
}


/**
 * 获取某用户的所有对话
 * @param userId 用户id
 */
exports.getConversationsOfOneUser = function (userId) {
    return sequelize.query(
        `select c.id,c.type,c.createdAt,c.updatedAt,lastMessage,r.friendId,u.nickname as friendNickname,r.remark as friendRemark,u.avatar
    from conversation as c,relation as r,user as u
    where c.id = r.conversationId
        and c.type = 'FRIEND'
        and (c.user1Id = ${userId} or c.user2Id = ${userId})
        and r.userId = ${userId} 
        and r.friendId = u.id
    `)
}

exports.getGroupConversationsOfOneUser = function (userId) {
    return sequelize.query(
        `select c.id,c.type,c.createdAt,c.updatedAt,lastMessage,gc.name,c.groupId,gc.avatar
    from conversation as c,group_chat as gc,group_member as gm
    where c.type = 'GROUP'
        and c.groupId = gc.id
        and gm.groupId = gc.id
        and gm.userId = ${userId}
    `)
}

/**
 * 根据id获取某一对话
 * @param conversationId
 */
exports.getConversationById = function (conversationId) {
    return Conversation.findByPk(conversationId)
}

/**
 *  获得某双人对话的对方信息
 * @param userId
 * @param conversationId
 * @returns {Promise<[undefined, number]>}
 */
exports.getRelationConversation = function (userId, conversationId) {
    return sequelize.query(
        `select lastMessage,r.friendId,u.nickname as friendNickname,r.remark as friendRemark,u.avatar
    from relation as r,user as u
    where r.conversationId = ${conversationId}
        and r.userId = ${userId} 
        and r.friendId = u.id
    `)
}

/**
 * 获得对话id
 * @param userId
 * @param friendId
 */
exports.getConversationId = function (userId, friendId) {
    return Conversation.findAll({
        attributes: ['id'],
        where: {
            [Op.or]: [{[Op.and]: [{user1Id: userId}, {user2Id: friendId}]},
                {[Op.and]: [{user1Id: friendId}, {user2Id: userId}]}]
        }
    })
}

exports.getConversationByGroupId = function (groupId) {
    return Conversation.findAll({
        where: {
            groupId: groupId
        }
    })
}

/**
 * 更新会话的最新消息
 * @param conversationId
 * @param lastMessage
 */
exports.updateConversation = function (conversationId, lastMessage) {
    return Conversation.update({
        lastMessage: lastMessage
    }, {
        where: {
            id: conversationId
        }
    })
    // return sequelize.query(`
    // update conversation
    // set lastMessage = '${lastMessage}'
    // where id = ${conversationId}
    // `)
}

/**
 * 获得改对话的所有成员id，除了userId
 * @param userId
 * @param conversationId
 */
exports.getConversationUserIds = async function (userId, conversationId) {
    return Conversation.findByPk(conversationId).then(value => {
        let result = []
        if (value == null) return result
        let data = value.get()
        if (data.type !== 'GROUP') {
            if (data.user1Id.toString() !== userId.toString()) {
                result.push(data.user1Id.toString())
            }
            if (data.user2Id.toString() !== userId.toString()) {
                result.push(data.user2Id.toString())
            }
            return result
        } else {
            return GroupMemberTable.findAll({
                where: {
                    groupId: data.groupId
                }
            }).then(members => {
                let res = []
                for (let i = 0; i < members.length; i++) {
                    let ID = members[i].get().userId
                    if (ID.toString() !== userId.toString()) {
                        res.push(ID)
                    }
                }
                return res
            })
        }

    })

}
