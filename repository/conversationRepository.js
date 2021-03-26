const models = require('../database/models')
const Op = models.Op
const sequelize = require('../database/connector').sequelize
/**
 * 仓库层：对话表数据读写
 */

const Conversation = models.Conversation
const Relation = models.UserRelation
const User = models.User

/**
 * 创建新对话
 * @param id1 用户1
 * @param id2 用户2
 */
exports.newConversation = function (id1, id2) {
    let smallId = Math.min(id1, id2)
    let largeId = Math.max(id1, id2)
    return Conversation.create({
        //key: smallId + '-' + largeId,
        user1Id: smallId,
        user2Id: largeId,
        lastMessage: '已经成为好友啦，说句话吧！'
    })
}


/**
 * 获取某用户的所有对话
 * @param userId 用户id
 */
exports.getConversationsOfOneUser = function (userId) {
    return sequelize.query(
        `select c.id,c.createdAt,c.updatedAt,lastMessage,r.friendId,u.avatar as friendAvatar,u.nickname as friendNickname,r.remark as friendRemark,r.groupId
    from conversation as c,relation as r,user as u
    where c.id = r.conversationId
        and (c.user1Id = ${userId} or c.user2Id = ${userId})
        and r.userId = ${userId}
        and r.friendId = u.id
    `)
}

/**
 * 根据id获取某一对话
 * @param userId
 * @param friendId
 */
exports.getConversationById = function (userId, friendId) {
    return sequelize.query(
        `select c.id,c.createdAt,c.updatedAt,c.lastMessage,r.friendId,u.avatar as friendAvatar,u.nickname as friendNickname,r.remark as friendRemark,r.groupId
    from conversation as c,relation as r,user as u
    where c.id = r.conversationId
        and r.userId = ${userId}
        and r.friendId = ${friendId}
        and u.id = ${friendId}
    `)
}

/**
 * 获得对话id
 * @param userId
 * @param friendId
 */
exports.getConversationId = function (userId, friendId) {
    return Conversation.findAll({
        attributes:['id'],
        where: {
            [Op.or]: [{[Op.and]: [{user1Id: userId}, {user2Id: friendId}]},
                {[Op.and]: [{user1Id: friendId}, {user2Id: userId}]}]
        }
    })
}


/**
 * 更新会话的最新消息
 * @param fromId
 * @param toId
 * @param lastMessage
 */
exports.updateConversation = function (fromId, toId, lastMessage) {
    return sequelize.query(`
    update conversation
    set lastMessage = '${lastMessage}'
    where (user1Id=${fromId} and user2Id = ${toId})
            or (user2Id=${fromId} and user1Id = ${toId})
    `)
}

/**
 * 获得改对话的所有成员id，除了userId
 * @param userId
 * @param conversationId
 */
exports.getConversationUserIds = function (userId,conversationId){
    return Conversation.findByPk(conversationId).then(value=>{
        let result = []
        let data = value.get()
        if(data.groupId==null){
           if(data.user1Id.toString()!==userId.toString()){
               result.push(data.user1Id.toString())
           }
            if(data.user2Id.toString()!==userId.toString()){
                result.push(data.user2Id.toString())
            }
        }
        return Promise.resolve(result)
    })
}
