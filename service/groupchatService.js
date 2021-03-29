const repository = require('../repository/groupchatRepository');
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes
const conversationRepository = require('../repository/conversationRepository')
const imageRepo = require("../repository/imageRepository");
const messageRepo = require("../repository/messageRepository")
const path = require('path')
const fs = require('fs')
const relationEventRepo = require("../repository/relationEventRepository");
exports.createChat = async function (masterId, name, userList) {
    try {
        let value = await repository.createNewGroupChat(masterId, name)
        let chatId = value.get().id
        userList.push(masterId)
        await repository.addMembers(chatId, userList)
        await conversationRepository.newGroupConversation(chatId)
    } catch (e) {
        console.log(e)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.success))
}

exports.changeGroupName = async function (groupId, name) {
    try {
        await repository.renameGroup(groupId, name)
        return Promise.resolve(jsonUtils.getResponseBody(codes.success))
    } catch (e) {
        console.log("rename_group", e)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }

}

exports.getGroupEntity = async function (groupId) {
    try {
        let value = await repository.getGroupById(groupId)
        if (value) {
            return Promise.resolve(jsonUtils.getResponseBody(codes.success, value.get()))
        } else {
            return Promise.reject(jsonUtils.getResponseBody(codes.other_error, 'group not exist'))
        }
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }

}


exports.getAllMembers = async function (groupId) {
    try {
        let value = await repository.getAllMembers(groupId)
        let res = []
        if (value && value.length > 0) {
            for (let i = 0; i < value[0].length; i++) {
                let data = value[0][i]
                res.push(data)
            }
        }
        return Promise.resolve(jsonUtils.getResponseBody(codes.success, res))
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
}

/**
 * 退出群聊
 * @param userId
 * @param groupId
 */
exports.quitGroupChat = async function (userId, groupId) {
    try {
        await repository.quitGroup(userId, groupId)
        return Promise.resolve(jsonUtils.getResponseBody(codes.success))
    } catch (e) {
        console.log("quit_group", e)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }

}

/**
 * 退出群聊
 * @param userId
 * @param groupId
 */
exports.destroyGroupChat = async function (userId, groupId) {
    try {
        let value = await repository.getGroupById(groupId)
        //有权限
        if (value!=null && value.get().master === userId) {
            let convValue = await conversationRepository.getConversationByGroupId(groupId)
            // 删除聊天文件
            if(convValue.length>0){
                await relationEventRepo.deleteImageFiles(convValue[0].get().id)
                await relationEventRepo.deleteVoiceFiles(convValue[0].get().id)
                await messageRepo.deleteMessagesOfConversation(convValue[0].get().id)
            }
            await imageRepo.deleteChatGroupAvatar(groupId)
            await repository.destroyGroup(groupId)
        }
        return Promise.resolve(jsonUtils.getResponseBody(codes.success))
    } catch (e) {
        console.log("destroy_group", e)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }

}


/**
 * 更改群组头像
 * @param groupId
 * @param files 头像文件
 */
exports.uploadGroupAvatar = async function (groupId, files) {
    // 手动给文件加后缀, formidable默认保存的文件是无后缀的
    let fileName = 'g' + groupId + path.extname(files.upload.name)
    let newPath = path.dirname(files.upload.path) + '/' + fileName
    // 将文件重命名为avatar_用户id的形式
    await fs.renameSync(files.upload.path, newPath)
    // 通知用户数据库，变更该用户的头像文件名
    let value
    try {
        await imageRepo.deleteChatGroupAvatar(groupId)
        value = await imageRepo.saveImage(null, null, null, fileName, '{}')
        let imageId = value.get().id
        await repository.updateGroupAvatar(groupId, imageId)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    // 数据库更新成功
    if (value) {
        //更换头像成功，将头像文件名返回
        return Promise.resolve(jsonUtils.getResponseBody(codes.success))
    } else {
        // 说明该用户id查找不到任何用户
        return Promise.reject(jsonUtils.getResponseBody(codes.login_wrong_username))
    }
}