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
exports.applyFriend = async function (userId,friendId){
    let count1
    try {
            count1 = await RelationEvent.count({
            where: {
                [Op.or]: [{[Op.and]: [{userId: userId}, {friendId: friendId}]}, {[Op.and]: [{userId: friendId}, {friendId: userId}]}]
            }
        })
    }catch (err){
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error,err))
    }

        //曾经有关系
    if (count1 > 0) {
        let eventMessage
        try {
            eventMessage = await RelationEvent.findOne({
                where: {
                    [Op.or]:
                        [{[Op.and]: [{userId: userId}, {friendId: friendId}]}, {[Op.and]: [{userId: friendId}, {friendId: userId}]}]
                }
            })
        }catch (err){
            return Promise.reject(jsonUtils.getResponseBody(codes.other_error,err))
        }

        if (eventMessage.state === 'ACCEPTED') {//已经是好友
            return eventMessage.state
        }
        else {
            let count2 = await RelationEvent.count({where: {[Op.and]: [{userId: friendId}, {friendId: userId}, {state: 'REQUESTING'}]}})
            if (count2 > 0) {
                    return 'ACCEPT'
            }//目标已经向用户申请好友
            return RelationEvent.update({
                state: 'REQUESTING'
            }, {
                where: {
                    [Op.or]:
                        [{[Op.and]: [{userId: userId}, {friendId: friendId}]}, {[Op.and]: [{userId: friendId}, {friendId: userId}]}]
                }
            })
        }
    }
    //曾经没有关系
    /*let friend
    try{
        friend = await User.findByPk(friendId)
    }catch (err){
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error,err))
    }
    if(friend==null){
        return Promise.reject(jsonUtils.getResponseBody(codes.make_friends_with_ghost))
    }*/
    return RelationEvent.create({
        key: userId + '-' + friendId,
        userId: userId,
        friendId: friendId,
        state: 'REQUESTING'
    })
}

/**
 * 接受好友申请
 * @param eventId
 * @returns {Promise<{user1: ({type: *}|{}), user2: {type: *}}>}
 */
exports.acceptFriendApply = async function (eventId){
    let result
    result = await RelationEvent.findByPk(eventId)
    await RelationEvent.update(
        {state:'ACCEPTED'},
        {where:{key:eventId}})
    return {user1:result.userId,user2:result.friendId}
}

/**
 * 拒绝好友申请
 * @param eventId
 * @returns {Promise<[number, Model<TModelAttributes, TCreationAttributes>[]]>}
 */
exports.rejectFriendApply = function (eventId){
    return RelationEvent.update(
        {state:'REJECTED'},
        {where:{key:eventId}}
    )
}

/**
 * 获取好友申请信息
 * @param userId
 * @returns {Promise<Model<TModelAttributes, TCreationAttributes>[]>}
 */
exports.getUnread = function (userId){
    return RelationEvent.findAll({where:
            {[Op.and]:[{friendId:userId},{state:'REQUESTING'}]}
    })
}
