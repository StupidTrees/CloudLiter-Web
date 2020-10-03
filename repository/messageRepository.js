const models = require('../database/models')
const Op = models.Op
/**
 * 仓库层：对话表数据读写
 */

const Conversation = models.Conversation
const Relation = models.UserRelation
const User = models.User
const Message = models.Message

/**
 * 将消息保存
 */
exports.saveMessage = function (message) {
    let minId = Math.min(message.fromId, message.toId)
    let maxId = Math.max(message.fromId, message.toId)
    return Message.create({
        read:false,
        fromId: message.fromId,
        toId: message.toId,
        content: message.content,
        relationId: message.fromId + '-' + message.toId,
        conversationId: minId + '-' + maxId
    })
}

/**
 * 获取某一对话的消息记录
 * @param conversationId 对话id
 */
exports.getMessagesOfOneConversation = function (conversationId) {
    return Message.findAll({
        where: {
            conversationId: {
                [Op.eq]: conversationId
            }
        }
    })
}

/**
 * 获取某用户的所有未读消息
 * @param userId
 */
exports.getUnreadMessagesOfOneUser = function (userId) {
    return Message.findAll({
        where: {
            [Op.and]: [
                {
                    toId: userId
                },
                {
                    read: false
                }
            ]
        }
    })
}

/**
 * 将某对话下的所有消息标记为已读
 * @param conversationId
 */
exports.markAllRead = function (toUserId,conversationId){
    return Message.update({
        read:true
    },{
        where:{
            [Op.and]:[
                {
                    conversationId:conversationId
                },
                {
                    toId:toUserId
                }
            ]

        }
    })
}

/**
 * 将某消息标记为已读
 * @param messageId
 */
exports.markRead = function (messageId){
    return Message.update({
        read:true
    },{
        where:{
            id:messageId
        }
    })
}