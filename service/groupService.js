const groupRepository = require('../repository/groupRepository');
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes

/**
 * 创建分组
 * @param userId
 * @param groupName
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.createGroup = async function(userId,groupName){
    let flag = null
    flag = await groupRepository.isExistingName(userId,groupName)
    if(flag.length === 0){//判断是否已经存在这个分组，不存在则创建
        let value = null
        try {
            value = await groupRepository.createNewGroup(userId,groupName)
        } catch (e) {
            return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
        }
        return Promise.resolve(jsonUtils.getResponseBody(codes.success))
    }
    //否则返回失败信息
    return Promise.resolve(jsonUtils.getResponseBody(codes.groupname_exists_error))
}

/**
 * 为用户的好友指定分组
 * @param userId
 * @param friendId
 * @param groupId
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.setGroupNum = async function(userId,friendId,groupId){
    let is_friend = null
    is_friend = await groupRepository.isFriend(userId,friendId)
    if(is_friend.length===1) {//判断传入friendId是否是好友，如果是好友继续运行
        let is_group_existed = null
        is_group_existed=await groupRepository.isGroupExisted(groupId)
        if(is_group_existed.length===1) {//判断该分组是否存在，不存在无法指定其分组
            let value = null
            try {
                value = await groupRepository.changeGroupNum(userId, friendId, groupId)
            } catch (e) {
                return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
            }
            return Promise.resolve(jsonUtils.getResponseBody(codes.success))
        }
        //返回不存在该分组的错误信息
        return Promise.resolve(jsonUtils.getResponseBody(codes.group_not_existed))
    }
    //返回不是好友不能创建分组的错误信息
    return Promise.resolve(jsonUtils.getResponseBody(codes.not_friend_build_group_error))
}

/**
 * 删除分组
 * @param groupId
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.deleteGroup = async function(groupId){
    let is_group_existed = null
    is_group_existed=await groupRepository.isGroupExisted(groupId)
    if(is_group_existed.length===1) {//判断要删除的分组是否存在，如果存在则继续运行
        let value = null
        try {
            value = await groupRepository.deleteGroup(groupId)
        } catch (e) {
            return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
        }
        return Promise.resolve(jsonUtils.getResponseBody(codes.success))
    }
    //若不存在返回不存在该分组的错误信息
    return Promise.resolve(jsonUtils.getResponseBody(codes.group_not_existed))
}

/**
 * 找到该用户的所有分组
 * @param userId
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.findAllGroup = async function(userId){
    let value = null
    try {
        value = await groupRepository.findAllGroup(userId)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    if (value.length === 0) { //获取到小组数为0，该用户无分组
        return Promise.reject(jsonUtils.getResponseBody(codes.not_have_group, null))
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.success))
}