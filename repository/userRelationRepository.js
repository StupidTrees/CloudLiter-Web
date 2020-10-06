const models = require('../database/models')
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes
const tools = require('../utils/tools')
const Op = models.Op
/**
 * 仓库层：用户关系数据读写
 */

const UserRelation = models.UserRelation
const UserConversation = models.Conversation
const RelationEvent = models.RelationEvent
const User = models.User

/**
 * 根据用户id，获取属于该用户的所有好友
 * @param id
 * @returns {Promise<Model<TModelAttributes, TCreationAttributes>[]>}
 */
exports.getFriendsWithId = function (id) {
    //查找关系表，并把关系表的外键（好友）对应的User表的内容include进来
    //最终返回的是用户信息列表
    return UserRelation.findAll({
        where: {
            userId: {
                [Op.eq]: id
            }
        }
        , include: [{ //把friend字段的用户对象也查出来
            //attributes:[],
            as: 'user',
            model: User
        }]
    })
}

/**
 * 查询我与某好友的关系对象
 * @param myId 我的id
 * @param friendId 朋友的id
 */
exports.queryRelationWithId = function (myId,friendId) {
    let id = tools.getP2PId(myId,friendId)
    return UserRelation.findAll({
        where: {
            key: id
        }
        , include: [{ //把friend字段的用户对象也查出来
            //attributes:[],
            as: 'user',
            model: User
        }]
    })
}

/**
 *建立好友关系
 * @param id1 用户1
 * @param id2 用户2
 * @returns {Promise<Model<TModelAttributes, TCreationAttributes>>}
 */
exports.makeFriends = function (id1, id2) {
    //这将在关系表中插入两行数据，即id1->id2和id2->id1
    return UserRelation.create({
        key: id1 + '-' + id2,
        userId: id1,
        friend: id2,
        group: null
    }).then((user) => {
        return UserRelation.create({
            key: id2 + '-' + id1,
            userId: id2,
            friend: id1,
            group: null
        })
    })
}


/**
 * 判断两个用户是否是好友
 * @param id1
 * @param id2
 * @returns {Promise<number>}
 */
exports.isFriend = function (id1, id2) {
    //在关系表中查找id1->id2的数目即可
    return UserRelation.count({
        where: {
            [Op.and]: [
                {
                    userId: {
                        [Op.eq]: id1
                    }
                },
                {
                    friend: {
                        [Op.eq]: id2
                    }
                }
            ]
        }
    })

}
/**
 * 添加朋友备注
 * @param id1
 * @param id2
 * @param remark
 * @returns {Promise<[number, Model<TModelAttributes, TCreationAttributes>[]]>}
 */
exports.friendRemark = function (id1, id2, remark) {
    return UserRelation.update({
        remark: remark
    }, {
        where: {[Op.and]: [{userId: id1}, {friend: id2}]}
    })
}

/**
 *
 * @param id1
 * @param id2
 * @returns {Promise<number>}
 */
exports.deleteFriend = function (id1,id2){
    return UserConversation.destroy({where: {[Op.or]: [{key: id1 + '-' + id2}, {key: id2 + '-' + id1}]}}).then((value)=>{
        return UserRelation.destroy({where:{[Op.and]:[{userId: id1},{friend:id2}]}})
    }).catch((err)=>{
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error,err))
    })
}
