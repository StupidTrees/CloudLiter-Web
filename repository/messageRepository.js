const models = require('../database/models')
const {equals} = require("../utils/textUtils");
const Op = models.Op
const redisClient = require("../bin/onlineRepository").redisClient
const MessageRead = models.GroupMessageRead
const sequelize = require('../database/connector').sequelize
const Message = require('../database/models').Message

// const SequelizeRedis = require('sequelize-redis')
// const sequelizeRedis = new SequelizeRedis(redisClient);
// const Message = sequelizeRedis.getModel(MessageTable, { ttl: 60 * 60 * 24 });
// const redisAdaptor = new RedisAdaptor({
//     client: redisClient,
//     namespace: 'model',
//     lifetime: 60 * 60
// })
// const sequelizeCache = require('sequelize-transparent-cache')
// const {withCache} = sequeliz
// const Message = wit
//

/**
 * 将消息保存
 */
exports.saveMessage = function (message) {
    //let id = tools.getP2PIdOrdered(message.fromId, message.toId)
    return Message.create({
        read: 0,
        fromId: message.fromId,
        content: message.content,
        sensitive: message.sensitive,
        emotion: message.emotion,
        conversationId: message.conversationId,
        type: message.type,//,
        fileId: message.fileId,
        extra: JSON.stringify(message.extra)
    })
}

/**
 * 获取某一对话的消息记录
 * @param conversationId 对话id
 * @param fromId 查询某个消息之前的记录
 * @param pageSize 分页大小
 */
exports.getMessagesOfOneConversation = function (conversationId, fromId, pageSize) {
    if (fromId == null) {
        return Message.findAll({
            where: {
                conversationId: {
                    [Op.eq]: conversationId
                }
            },
            limit: parseInt(pageSize),
            order: [['id', 'DESC']]
        })
    } else {
        return Message.findAll({
            where: {
                [Op.and]: [
                    {
                        conversationId: conversationId
                    },
                    {
                        id: {
                            [Op.lt]: BigInt(fromId)
                        }
                    }
                ]

            },
            limit: parseInt(pageSize),
            order: [['id', 'DESC']]
        })
    }

}


/**
 * 拉取某一对话的最新消息记录
 * @param conversationId 对话id
 * @param afterId 查询某个消息之后的记录
 * @param includeBound 是否包含afterId
 */
exports.getMessagesAfter = function (conversationId, afterId, includeBound) {
    if (afterId == null) {
        return Promise.resolve([])
    } else {
        let op = equals(includeBound, 'true') ? Op.gte : Op.gt
        return Message.findAll({
            where: {
                [Op.and]: [
                    {
                        conversationId: conversationId
                    },
                    {
                        id: {
                            [op]: BigInt(afterId)
                        }
                    }
                ]
            },
            order: [['id', 'DESC']]
        })
    }


}


/**
 * 获取某用户的所有未读消息(只需要对话)
 * @param userId
 */
exports.getUnreadConversationsOfOneUser = function (userId) {
    return sequelize.query(`
    select count(*) as num,conversationId
    from message as m
    where m.read = 0
        and m.conversationId in
        (select id from conversation as c where c.user1Id = ${userId} or c.user2Id = ${userId})
        and m.fromId <> ${userId}
    group by conversationId
    `)
}
exports.getUnreadConversationsGroupOfOneUser = function (userId) {
    return sequelize.query(`
    select count(*) as num,conversationId
    from message as m
    where m.conversationId in
        (select c.id from conversation as c,group_member as gm
            where c.type = 'GROUP'
                  and c.groupId = gm.groupId
                  and gm.userId = ${userId}
        )
        and not exists 
        (select * from message_read
            where messageId = m.id
               and userId = ${userId})
        and m.fromId <> ${userId}
    group by conversationId
    `)
}


async function markGroupAllReadForMessageId(userId, messages) {
    let res = []
    for (let i = 0; i < messages.length; i++) {
        let messageId = messages[i].get().id
        let oldRead = messages[i].get().read
        let obj = await MessageRead.findOrCreate({
            where: {
                [Op.and]: [
                    {userId: userId},
                    {messageId: messageId}
                ]
            },
            defaults: {
                userId: userId,
                messageId: messageId
            }
        }).then((result) => {
            if (result[1]) {
                return Message.increment(
                    {read: 1},
                    {
                        where: {
                            id: messageId
                        }
                    }
                ).then((value) => {
                    return {
                        messageId: messageId,
                        read: oldRead + 1
                    }
                })
            } else {
                return null
            }
        }).catch(e => {
            console.log(e)
            return null
        })
        if (obj != null) {
            console.log("obj", obj)
            res.push(obj)
        }
    }
    return res
}

/**
 * 将某对话下的所有消息标记为已读
 * @param chatType
 * @param toUserId
 * @param conversationId
 * @param topTime
 */
exports.markAllRead = function (chatType, toUserId, conversationId, topTime) {
    if (equals(topTime, 'null')) {
        topTime = 0
    }
    if (chatType === 'GROUP') {
        return Message.findAll({
            attributes: ['id', 'read'],
            where: {
                [Op.and]: [
                    {
                        conversationId: conversationId
                    },
                    {
                        createdAt: {
                            [Op.gte]: topTime
                        }
                    },
                    {
                        fromId: {
                            [Op.ne]: toUserId
                        }
                    }
                ]

            }
        }).then(messages => {
            return markGroupAllReadForMessageId(toUserId, messages)
        })
    } else {
        return Message.update({
            read: 1
        }, {
            where: {
                [Op.and]: [
                    {
                        conversationId: conversationId
                    },
                    {
                        fromId: {[Op.ne]: toUserId}
                    },
                    {
                        createdAt: {
                            [Op.gte]: topTime
                        }
                    }
                ]

            }
        }).then(() => {
            return []
        })
    }

}

/**
 * 将某消息标记为已读
 * @param chatType
 * @param userId
 * @param messageId
 */
exports.markRead = function (chatType, userId, messageId) {
    if (chatType === 'GROUP') {
        return MessageRead.findOrCreate({
            where: {
                [Op.and]: [
                    {userId: userId},
                    {messageId: messageId}
                ]
            },
            defaults: {
                userId: userId,
                messageId: messageId
            }
        }).then((result) => {
            if (result[1]) {
                return Message.increment({
                    read: 1
                }, {
                    where: {
                        [Op.and]: [
                            {id: messageId},
                            {fromId: {[Op.ne]: userId}}
                        ]
                    }
                }).then((value) => {
                    return Message.findByPk(messageId, {
                        attributes: ['read']
                    }).then((fin) => {
                        return [{
                            messageId: messageId,
                            read: fin.get().read
                        }]
                    })

                })
            } else {
                return []
            }
        })
    } else {
        return Message.update({
            read: 1
        }, {
            where: {
                [Op.and]: [
                    {id: messageId},
                    {fromId: {[Op.ne]: userId}}
                ]
            }
        }).then((value) => {
            return [{
                messageId: messageId,
                read: 1
            }]
        })
    }

}

/**
 * 根据id获取消息
 * @param id
 */
exports.getMessageById = function (id) {
    return Message.findAll({
        where: {id: id}
    })
}

/**
 * 将相应的语音识别结果记录到message中
 * @param id 消息id
 * @param text 语音识别的结果
 * @param score
 * @param sensitive
 */
exports.setTTSResult = function (id, text, score, sensitive) {
    return Message.update({
        ttsResult: text,
        emotion: score,
        sensitive: sensitive
    }, {
        where: {id: id}
    })
}

exports.deleteMessagesOfConversation = function (conversationId) {
    return Message.destroy({
        where: {
            conversationId: conversationId
        }
    })
}

exports.getReadUsers = function (messageId) {

    return MessageRead.findAll({
        where: {
            messageId: messageId
        }
    })
}


exports.getUnreadUsers = function (userId, messageId, conversationId) {
    return sequelize.query(`
    select distinct gm.userId
    from conversation as c, group_member as gm, message as m
    where c.groupId = gm.groupId
    and gm.userId <> ${userId}
    and m.conversationId = c.id
    and c.id = ${conversationId}
    and not exists(
        select * from message_read as mr
        where mr.userId = gm.userId
        and mr.messageId = ${messageId}
    )
    `)
}