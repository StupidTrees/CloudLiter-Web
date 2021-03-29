const models = require('../database/models')
const tools = require('../utils/tools')
const {equals} = require("../utils/textUtils");
const Op = models.Op
const Relation = models.UserRelation
const User = models.User
const Message = models.Message
const sequelize = require('../database/connector').sequelize

/**
 * 将消息保存
 */
exports.saveMessage = function (message) {
    //let id = tools.getP2PIdOrdered(message.fromId, message.toId)
    return Message.create({
        read: false,
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
    // console.log("fromId", fromId)

    if (fromId == null) {
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
        and conversationId in(select id from conversation where user1Id = ${userId} or user2Id = ${userId})
    group by conversationId
    `)
    // return Message.findAll(
    //     {
    //         attributes: ['conversationId'],
    //         where: {
    //             [Op.and]: [
    //                 {
    //                     toId: userId
    //                 },
    //                 {
    //                     read: false
    //                 }
    //             ]
    //         }
    //     })
}
exports.getUnreadConversationsGroupOfOneUser = function (userId) {
    return sequelize.query(`
    select count(*) as num,conversationId
    from message as m
    where m.read = 0
        and m.conversationId in
        (select c.id from conversation as c,group_member as gm
            where c.groupId is not null
                  and c.groupId = gm.groupId
                  and gm.userId = ${userId}
        )
    group by conversationId
    `)
    // return Message.findAll(
    //     {
    //         attributes: ['conversationId'],
    //         where: {
    //             [Op.and]: [
    //                 {
    //                     toId: userId
    //                 },
    //                 {
    //                     read: false
    //                 }
    //             ]
    //         }
    //     })
}

/**
 * 将某对话下的所有消息标记为已读
 * @param toUserId
 * @param conversationId
 * @param topTime
 */
exports.markAllRead = function (toUserId, conversationId, topTime) {
    if (equals(topTime, 'null')) {
        topTime = 0
    }
    return Message.update({
        read: true
    }, {
        where: {
            [Op.and]: [
                {
                    conversationId: conversationId
                },
                {
                    fromId: {[Op.ne]:toUserId}
                },
                {
                    createdAt: {
                        [Op.gte]: topTime
                    }
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

/**
 * 根据id获取消息
 * @param id
 * @returns {Promise<Model[]>}
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

exports.deleteMessagesOfConversation = function (conversationId){
    return Message.destroy({
        where:{
            conversationId:conversationId
        }
    })
}