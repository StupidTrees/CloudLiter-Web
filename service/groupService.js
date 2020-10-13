const groupRepository = require('../repository/groupRepository');
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes
const config = require('../config')
const codesUtils = require('../utils/codes')
const textUtils = require('../utils/textUtils')
const tools = require('../utils/tools')
const fs = require('fs')
const path = require('path')

exports.createGroup = async function(userId,groupName){
    let flag = null
    flag = await groupRepository.decideExistingName(userId,groupName)
    if(flag.length === 0){
        let value = null
        try {
            value = await groupRepository.createNewGroup(userId,groupName)
        } catch (e) {
            return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
        }
        return Promise.resolve(jsonUtils.getResponseBody(codes.success))
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.groupname_exists_error))
}
exports.setGroupNum = async function(userId,friendId,groupId){
    let is_friend = null
    is_friend = await groupRepository.isFriend(userId,friendId)
    if(is_friend.length===1) {
        let is_group_existed = null
        is_group_existed=await groupRepository.isGroupExisted(groupId)
        if(is_group_existed.length===1) {
            let value = null
            try {
                value = await groupRepository.changeGroupNum(userId, friendId, groupId)
            } catch (e) {
                return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
            }
            return Promise.resolve(jsonUtils.getResponseBody(codes.success))
        }
        return Promise.resolve(jsonUtils.getResponseBody(codes.group_not_existed))
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.not_friend_build_group_error))
}
exports.deleteGroup = async function(groupId){
    let is_group_existed = null
    is_group_existed=await groupRepository.isGroupExisted(groupId)
    if(is_group_existed.length===1) {
        let value = null
        try {
            value = await groupRepository.deleteGroup(groupId)
        } catch (e) {
            return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
        }
        return Promise.resolve(jsonUtils.getResponseBody(codes.success))
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.group_not_existed))
}
exports.findAllGroup = async function(userId){
    let value = null
    try {
        value = await groupRepository.findAllGroup(userId)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    if (value.length === 0) { //获取到小组数为0
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, null))
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.success))
}