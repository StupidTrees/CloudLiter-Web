const models = require('../database/models')
const Op = models.Op
const tools = require('../utils/tools')
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
        key: smallId + '-' + largeId,
        user1Id: smallId,
        user2Id: largeId,
        relation1Id: smallId + '-' + largeId,
        relation2Id: largeId + '-' + smallId
    })
}


/**
 * 获取某用户的所有对话
 * @param userId 用户id
 */
exports.getConversationsOfOneUser = function (userId) {
    return Conversation.findAll({
        where: {
            [Op.or]: [
                {
                    user1Id: {
                        [Op.eq]: userId
                    }
                },
                {
                    user2Id: {
                        [Op.eq]: userId
                    }
                }
            ]
        }, include: [{ //把relation1Id字段的用户对象也查出来
            //attributes:[],
            foreignKey:'relation1Id',
            as: 'relation1',
            model: Relation
        }, {
            foreignKey:'relation2Id',
            as: 'relation2',
            model: Relation
        },{
            foreignKey:'user1Id',
            as:'user1',
            model:User
        },{
            foreignKey:'user2Id',
            as:'user2',
            model:User
        }]
    })
}

/**
 * 更新会话的最新消息
 * @param fromId
 * @param toId
 * @param message
 */
exports.updateConversation = function (fromId,toId,message){
    return Conversation.update({
        lastMessage:message.content
    },{
        where:{
            key:{
                [Op.eq]:tools.getP2PIdOrdered(fromId,toId)
            }
        }
    })
}
