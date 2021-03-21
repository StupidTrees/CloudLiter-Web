const eventRepository = require('../repository/relationEventRepository')
const repository = require('../repository/userRelationRepository')
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes
const convRepository = require('../repository/conversationRepository')
const relationRepository = require('../repository/userRelationRepository')
const wordCloudRepository = require("../repository/wordCloudRepository");
const tools = require("../utils/tools");
const long_connection = require("../bin/long_connection");
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
    let judge//judge用于判断 1：已经申请 2：已经是好友
    try{
        judge = await  eventRepository.applyFriend(userId,friendId)
    }catch (err){
        console.log('好友申请失败',err)
        if(err.original.code==='ER_NO_REFERENCED_ROW_2'){
            return Promise.reject(jsonUtils.getResponseBody(codes.make_friends_with_ghost))
        }
        return  Promise.reject(jsonUtils.getResponseBody(codes.other_error,err))
    }
    if(judge===1){
        return Promise.reject(jsonUtils.getResponseBody(codes.already_apply))
    }
    else if(judge === 2){
        return Promise.reject(jsonUtils.getResponseBody(codes.already_friends))
    }
    //通知广播消息
    long_connection.notifyRelationEvent(friendId)
    return  Promise.resolve(jsonUtils.getResponseBody(codes.success))
}

/**
 * 处理好友申请
 * @param id
 * @param action
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.responseFriendApply = async function resFriendApply(id, action){
    if(equals(action,'ACCEPT')){
        let message
        try{
            message = await eventRepository.acceptFriendApply(id)
        } catch (err) {
            console.log('err',err)
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
        //通知广播消息
        long_connection.notifyRelationEvent(message.user1)
        return  Promise.resolve(jsonUtils.getResponseBody(codes.success))
    }
    else if(equals(action,'REJECT')){
        let message
        try{
            message = await eventRepository.rejectFriendApply(id)
        } catch (err){
            return Promise.reject(jsonUtils.getResponseBody(codes.other_error,err))
        }
        if(message === null || equals(message,0)){
            return  Promise.reject(jsonUtils.getResponseBody(codes.apply_not_exists))
        }
        //通知广播消息
        long_connection.notifyRelationEvent(message.user1)
        return Promise.resolve(jsonUtils.getResponseBody(codes.success))
    }
    return Promise.reject(jsonUtils.getResponseBody(codes.format_error_relation_action))
}


/**
 * 获取未读好友事件数
 * @param userId
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.countUnread = async function (userId){
    let result
    try{
        result = await eventRepository.countUnread(userId)
    }catch (err){
        console.log(err,err)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error,err))
    }

    return Promise.resolve(jsonUtils.getResponseBody(codes.success,result))
}

/**
 * 获取所有和自己相关的好友申请
 * @param userId
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.getMine = async function(userId){
    let message
    try{
        message = await eventRepository.getMine(userId)
    }catch (err){
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error,err))
    }
    let result = []
    message.forEach(function (item){
        let user1Data = item.get().user1.get()
        let user2Data = item.get().user2.get()
        let targetUser = equals(userId,user1Data.id)?user2Data:user1Data
        let unread = false
        if(equals(item.get().userId,userId)){ //自己发出的
            unread = (item.get().responseRead===false)
        }else{ //发给自己的
            unread = !item.get().read
        }
        result.push({
            id:item.id,
            userId:item.userId,
            friendId:item.friendId,
            otherAvatar:targetUser.avatar,
            otherNickname:targetUser.nickname,
            otherId:targetUser.id,
            state:item.state,
            createdAt:item.createdAt,
            updatedAt:item.updatedAt,
            unread:unread
        })
    })
    return Promise.resolve(jsonUtils.getResponseBody(codes.success,result))
}


/**
 * 删除好友，增加删除事件
 * @param userId
 * @param friendId
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.deleteFriend = async function(userId, friendId){
    let value
    try{
        await eventRepository.deleteFriend(userId,friendId)
        //同时删除对话词云
        await wordCloudRepository.deleteConversationWordCloud(tools.getP2PIdOrdered(userId,friendId))
    }catch (err){
        console.log(err)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error,err))
    }
    if(value===0){
        return Promise.reject(jsonUtils.getResponseBody(codes.relation_not_exists))
    }
    try{
        await eventRepository.createDeleteEvent(userId,friendId)
    }catch (err){
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error,err))
    }
    //通知广播消息
    long_connection.notifyRelationEvent(friendId)
    return Promise.resolve(jsonUtils.getResponseBody(codes.success))
}



/**
 * 将用户的所有未读标记为已读
 * @param userId
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.markRead = async function(userId){
    try{
        await eventRepository.markRead(userId)
    }catch (err){
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error,err))
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.success))
}