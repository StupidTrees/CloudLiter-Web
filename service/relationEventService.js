const eventRepository = require('../repository/relationEventRepository')
const repository = require('../repository/userRelationRepository')
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes
const convRepository = require('../repository/conversationRepository')
const equals = require('../utils/textUtils').equals
/**
 * 服务层：关系操作
 */

/**
 * 好友申请
 * @param userId
 * @param friendId
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.applyFriend = async  function(userId,friendId){
    //不能和自己成为好友
    if(equals(userId,friendId)){
        return Promise.reject(jsonUtils.getResponseBody(codes.make_friends_with_myself))
    }
    //在relationEvent中增加申请事件
    let state
    try{
        state = await  eventRepository.applyFriend(userId,friendId)//count用于判断
    }catch (err){
        console.log('好友申请失败',err)
        if(err.original.code==='ER_NO_REFERENCED_ROW_2'){
            return Promise.reject(jsonUtils.getResponseBody(codes.make_friends_with_ghost))
        }
        return  Promise.reject(jsonUtils.getResponseBody(codes.other_error,err))
    }
    if(state === 'ACCEPT'){
        this.resFriendApply(friendId+'-'+userId,'ACCEPT').then(value => {
            return  Promise.resolve(jsonUtils.getResponseBody(codes.success))
        }).catch(err=>{
            return Promise.reject(jsonUtils.getResponseBody(codes.other_error,err))
        })
    }
    else if(state === 'ACCEPTED'){
        return Promise.reject(jsonUtils.getResponseBody(codes.already_friends))
    }
    return  Promise.resolve(jsonUtils.getResponseBody(codes.success))

}

/**
 * 处理好友申请
 * @param eventId
 * @param action
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.resFriendApply = async function resFriendApply(eventId,action){
    if(action === 'ACCEPT'){
        let message
        try{
            message = await eventRepository.acceptFriendApply(eventId)
        }
        catch (err) {
            if(message === undefined){
                return Promise.reject(jsonUtils.getResponseBody(codes.apply_not_exists))
            }
            return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
        }
        //在关系表里插入数据
        try{
            await repository.makeFriends(message.user1,message.user2)
        }catch (err){
            console.log('关系表插入失败',err)
            if(err.original.code==='ER_DUP_ENTRY'){ //主键重复，即已经是好友
                return Promise.reject(jsonUtils.getResponseBody(codes.already_friends))
            }else if(err.original.code==='ER_NO_REFERENCED_ROW_2'){ //外键不存在，即有一个用户id是假的
                return Promise.reject(jsonUtils.getResponseBody(codes.make_friends_with_ghost))
            }
            return Promise.reject(jsonUtils.getResponseBody(codes.other_error,err))
        }
        //在对话表里直接开启一个对话
        try {
            await convRepository.newConversation(message.user1, message.user2)
        } catch (err) {
            console.log('对话表插入失败',err)
            if(err.original.code==='ER_DUP_ENTRY'){ //主键重复，即已有对话
                return Promise.reject(jsonUtils.getResponseBody(codes.conversation_exists))
            }
            return Promise.reject(jsonUtils.getResponseBody(codes.other_error,err))
        }
        return  Promise.resolve(jsonUtils.getResponseBody(codes.success))
    }
    else if(action === 'REJECT'){
        let message
        try{
            message = await eventRepository.rejectFriendApply(eventId)
        }
        catch (err){
            return Promise.reject(jsonUtils.getResponseBody(codes.other_error,err))
        }
        if(equals(message,0)){
            return  Promise.reject(jsonUtils.getResponseBody(codes.apply_not_exists))
        }
        return Promise.resolve(jsonUtils.getResponseBody(codes.success))
    }
    return  Promise.reject(jsonUtils.getResponseBody(codes.format_error_empty))
}

exports.getUnread = async function(userId){
    let message
    try{
        message = await eventRepository.getUnread(userId)
    }catch (err){
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error,err))
    }
    let result = []
    message.forEach(function (item){
        result.push({
            key:item.key,
            userId:item.userId,
            friendId:item.friendId,
            state:item.state,
            createdAt:item.createdAt,
            updatedAt:item.updatedAt
        })
    })
    return Promise.reject(jsonUtils.getResponseBody(codes.success,result))
}