const groupRepository = require('../repository/groupRepository');
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes


exports.createGroup = async function(userId,groupName){
    let flag = await groupRepository.decideExistingName(userId,groupName)
    if(flag === 0){
        try {
            await groupRepository.createNewGroup(userId,groupName)
        } catch (e) {
            return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
        }
        return Promise.resolve(jsonUtils.getResponseBody(codes.success))
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.group_name_exists_error))
}
exports.setGroupNum = async function(userId,friendId,groupId){
    let value = null
    try {
        value = await groupRepository.changeGroupNum(userId,friendId,groupId)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }

    return Promise.resolve(jsonUtils.getResponseBody(codes.success))
}
exports.deleteGroup = async function(groupId){
    try {
        await groupRepository.deleteGroup(groupId)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.success))
}
exports.renameGroup = async function(groupId,newName){
    try {
        await groupRepository.renameGroup(groupId,newName)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.success))
}
exports.findAllGroup = async function(userId){
    let value = null
    try {
        value = await groupRepository.findAllGroup(userId)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.success,value))
}