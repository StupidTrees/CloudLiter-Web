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
    return  Promise.resolve(jsonUtils.getResponseBody(codes.success))
}

/**
 * NFC交友
 * @param userId
 * @param friendId
 * @param action
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.directFriends = async  function(userId,friendId,action){
    let judge = await eventRepository.findIfBeFriends(userId,friendId)
    if(judge){
        return Promise.resolve(jsonUtils.getResponseBody(codes.already_friends))
    }
    if(action==='REJECT'){
        try{
            await eventRepository.directReject(userId,friendId)
        }catch (err){
            return Promise.reject(jsonUtils.getResponseBody(codes.other_error,err))
        }
        return Promise.resolve(jsonUtils.getResponseBody(codes.success))
    }
    let message
    try{
        message = await eventRepository.directFind(userId,friendId)
    }catch (err){
        return Promise.reject((jsonUtils.getResponseBody(codes.other_error,err)))
    }
    let getUserId = message.userId
    let getId = message.id

    if(getUserId === userId){
        return Promise.resolve(jsonUtils.getResponseBody(codes.already_apply))
    }
    try{
        message = await eventRepository.acceptFriendApply(getId)
    }catch (err){
        if(message === undefined){
            return Promise.reject(jsonUtils.getResponseBody(codes.apply_not_exists))
        }
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    }
    //在关系表里插入数据
    try{
        await repository.makeFriends(userId,friendId)
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
        await convRepository.newConversation(userId, friendId)
    } catch (err) {
        console.log('对话表插入失败',err)
        if(err.original.code==='ER_DUP_ENTRY'){ //主键重复，即已有对话
            return Promise.reject(jsonUtils.getResponseBody(codes.conversation_exists))
        }
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error,err))
    }
    return  Promise.resolve(jsonUtils.getResponseBody(codes.success))
}


/**
 * 处理好友申请
 * @param eventId
 * @param action
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.resFriendApply = async function resFriendApply(id,action){
    if(action === 'ACCEPT'){
        let message
        try{
            message = await eventRepository.acceptFriendApply(id)
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
            message = await eventRepository.rejectFriendApply(id)
        }
        catch (err){
            if(message === undefined){
                return Promise.reject(jsonUtils.getResponseBody(codes.apply_not_exists))
            }
            return Promise.reject(jsonUtils.getResponseBody(codes.other_error,err))
        }
        if(equals(message,0)){
            return  Promise.reject(jsonUtils.getResponseBody(codes.apply_not_exists))
        }
        return Promise.resolve(jsonUtils.getResponseBody(codes.success))
    }
    return  Promise.reject(jsonUtils.getResponseBody(codes.format_error_empty))
}

/**
 * 获取好友请求信息
 * @param userId
 * @returns {Promise<never>}
 */
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
    return Promise.resolve(jsonUtils.getResponseBody(codes.success,result))
}

/**
 * 获取好友请求数
 * @param userId
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.countUnread = async function (userId){
    let message
    try{
        message = await eventRepository.getUnread(userId)
    }catch (err){
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error,err))
    }
    let count = message.length
    return Promise.resolve(jsonUtils.getResponseBody(codes.success,count))
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
        result.push({
            key:item.key,
            userId:item.userId,
            friendId:item.friendId,
            state:item.state,
            createdAt:item.createdAt,
            updatedAt:item.updatedAt
        })
    })
    return Promise.resolve(jsonUtils.getResponseBody(codes.success,result))
}

/**
 * 获取自己被拒绝的申请数
 * @param userId
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.countRejected = async function(userId){
    let message
    try{
        message = await eventRepository.getRejected(userId)
    }catch (err){
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error,err))
    }
    let count = message.length
    return Promise.resolve(jsonUtils.getResponseBody(codes.success,count))
}

/**
 * 删除好友，增加删除事件
 * @param userId
 * @param friendId
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.delFriend = async function(userId,friendId){
    let value
    try{
        value = await eventRepository.delFriend(userId,friendId)
    }catch (err){
        console.log(err)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error,err))
    }
    if(value===0){
        return Promise.reject(jsonUtils.getResponseBody(codes.relation_not_exists))
    }
    try{
        await eventRepository.deleteEvent(userId,friendId)
    }catch (err){
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error,err))
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.success))
}

/**
 * 计数自己被删的事件
 * @param userId
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.countDeleted = async function(userId){
    let message
    try{
        message = await eventRepository.getDeleted(userId)
    }catch (err){
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error,err))
    }
    let count = message.length
    return Promise.resolve(jsonUtils.getResponseBody(codes.success,count))
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