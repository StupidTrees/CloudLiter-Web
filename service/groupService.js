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
    let value = null
    try {
        value = await groupRepository.createNewGroup(userId,groupName)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    if (value.length === 0) { //获取到的用户数量为0：用户不存在
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, null))
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.success))
}
exports.setGroupNum = async function(userId,friendId,groupId){
    let value = null
    try {
        value = await groupRepository.changeGroupNum(userId,friendId,groupId)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    console.log(value)
    if (value === 0) { //获取到的用户数量为0
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, null))
    }
}
exports.deleteGroup = async function(groupId){
    let value = null
    try {
        value = await groupRepository.deleteGroup(groupId)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    if (value.length === 0) { //获取到的用户数量为0：用户不存在
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, null))
    }
}
exports.findAllGroup = async function(userId){
    let value = null
    try {
        value = await groupRepository.findAllGroup(userId)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    console.log(value)
    if (value.length === 0) { //获取到的用户数量为0：用户不存在
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, null))
    }
}