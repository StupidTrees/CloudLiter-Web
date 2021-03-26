const repository = require('../repository/groupchatRepository');
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes
const textUtils = require('../utils/textUtils')
const tools = require("../utils/tools");
const fs = require('fs')
const config = require("../config");

exports.createChat = async function (masterId, name, userList) {
    let value = null
    try {
        value = await repository.createNewGroupChat(masterId, name)
    } catch (e) {
        console.log(e)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    let chatId = value.get().id
    console.log('chatId:'+chatId)
    for(let i = 0;i<userList.length;i++){
        console.log('userList:'+i+'  '+userList[i].userId)
        userList[i].chatId = chatId
    }
    try {
        value = await repository.addMembers(userList)
    } catch (e) {
        console.log(e)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.success))
}