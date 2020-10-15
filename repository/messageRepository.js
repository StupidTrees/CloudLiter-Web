const models = require('../database/models')
const {equals} = require("../utils/textUtils");
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
        read: false,
        fromId: message.fromId,
        toId: message.toId,
        content: message.content,
        relationId: message.fromId + '-' + message.toId,
        sensitive: message.sensitive,
        conversationId: minId + '-' + maxId
    })
}

/**
 * 获取某一对话的消息记录
 * @param conversationId 对话id
 * @param fromId 查询某个消息之前的记录
 * @param pageSize 分页大小
 */
exports.getMessagesOfOneConversation = function (conversationId, fromId, pageSize) {
    console.log("fromId",fromId)
    if (fromId==null) {
        console.log("fromId===null",fromId)
        return Message.findAll({
            where: {
                conversationId: {
                    [Op.eq]: conversationId
                }
            },
            // offset: pageSize * pageNum,
            limit: parseInt(pageSize),
            order: [['id', 'DESC']]
        })
    } else {
        console.log("fromId!=null",fromId)
        return Message.findAll({
            where: {
                [Op.and]: [
                    {
                        conversationId: conversationId
                    },
                    {
                        id: {
                            [Op.lt]: parseInt(fromId)
                        }
                    }
                ]

            },
            //  offset: pageSize * pageNum,
            limit: parseInt(pageSize),
            order: [['id', 'DESC']]
        })
    }

}


/**
 * 拉取某一对话的最新消息记录
 * @param conversationId 对话id
 * @param afterId 查询某个消息之后的记录
 */
exports.pullLatestMessagesOfConversation = function (conversationId,afterId) {
    if (afterId == null) {
        return Promise.resolve([])
    } else {
        return Message.findAll({
            where: {
                [Op.and]: [
                    {
                        conversationId: conversationId
                    },
                    {
                        id: {
                            [Op.gt]: parseInt(afterId)
                        }
                    }
                ]
            },
            //  offset: pageSize * pageNum,
            //limit: parseInt(pageSize),
            order: [['id', 'DESC']]
        })
    }

}



/**
 * 获取某用户的所有未读消息(只需要对话)
 * @param userId
 */
exports.getUnreadConversationsOfOneUser = function (userId) {
    return Message.findAll(
        {
            attributes: ['conversationId'],
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
exports.markAllRead = function (toUserId, conversationId) {
    return Message.update({
        read: true
    }, {
        where: {
            [Op.and]: [
                {
                    conversationId: conversationId
                },
                {
                    toId: toUserId
                }
            ]

        }
    })
}

/**
 * 将某消息标记为已读
 * @param messageId
 */
exports.markRead = function (messageId) {
    return Message.update({
        read: true
    }, {
        where: {
            id: messageId
        }
    })
}