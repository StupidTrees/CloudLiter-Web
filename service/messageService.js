const repository = require('../repository/messageRepository');
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes
const textUtils = require('../utils/textUtils')
const relationRepository = require('../repository/userRelationRepository')
const tools = require("../utils/tools");
const UUID = require('uuid');
const fs = require('fs')
const config = require("../config");
const long_connection = require("../bin/long_connection");
const shieldingService = require('../service/shieldingService')
/**
 * 更新会话信息
 * @param message
 */
exports.saveMessage = async function (message) {
    let value = null
    try {
        value = await repository.saveMessage(message)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    if (value === null) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error))
    }
    let data = value.get()
    //console.log("value",value.get())
    //获取备注信息
    try {
        let res = await relationRepository.queryRemarkWithId(message.toId, message.fromId)
        data.friendRemark = res[0].get().remark
        let userData = res[0].get().user
        if (textUtils.isEmpty(res[0].get().remark)) {
            data.friendRemark = userData.get().nickname
        }
        data.friendAvatar = userData.get().avatar
        let perm = userData.get().typePermission
        data.friendType = perm === 'PRIVATE' ? 0 : userData.get().type
        data.friendSubType = perm === 'PRIVATE?' ? 'normal' : userData.get().subType
        console.log('data', data)
    } catch (e) {
        console.log('err', e)
    }

    return Promise.resolve(jsonUtils.getResponseBody(codes.success, data))
}

/**
 * 获取某对话的历史消息
 * @param conversationId 对话id
 * @param fromId
 * @param pageSize 分页大小
 */
exports.queryHistoryMessage = async function (conversationId, fromId, pageSize) {
    let value = null
    try {
        value = await repository.getMessagesOfOneConversation(conversationId, fromId, pageSize)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    if (value === null) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error))
    }
    let res = []
    value.forEach(function (item) {
        //console.log('item',item.get())
        res.push(item)
    })
    return Promise.resolve(jsonUtils.getResponseBody(codes.success, res))
}


/**
 * 拉取某对话的最新消息
 * @param conversationId 对话id
 * @param afterId
 * @param includeBound
 */
exports.getMessagesAfter = async function (conversationId, afterId, includeBound) {
    let value = null
    try {
        value = await repository.getMessagesAfter(conversationId, afterId, includeBound)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    if (value === null) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error))
    }
    let res = []
    value.forEach(function (item) {
        res.push(item.get())
    })
    return Promise.resolve(jsonUtils.getResponseBody(codes.success, res))
}


/**
 * 获得某用户所有未读消息
 * @param userId
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.countUnreadMessage = async function (userId) {
    let value = null
    try {
        value = await repository.getUnreadConversationsOfOneUser(userId)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    if (value === null) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error))
    }
    let res = {}
    value.forEach(function (item) {
        //console.log('item',item.get())
        if (!res.hasOwnProperty(item.get().conversationId)) {
            res[item.get().conversationId] = 1
        } else {
            res[item.get().conversationId] += 1
        }
    })
    return Promise.resolve(jsonUtils.getResponseBody(codes.success, res))
}

/**
 * 将某消息标记为已读
 * @param messageId
 */
exports.markRead = async function (messageId) {
    try {
        await repository.markRead(messageId)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.success))
}

/**
 * 某对话全部标记为已读
 * @param toUserId
 * @param conversationId
 * @param topTime
 */
exports.markAllRead = async function (toUserId, conversationId, topTime) {
    try {
        await repository.markAllRead(toUserId, conversationId, topTime)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.success))
}


/**
 * 发送图片消息
 * @param fromId
 * @param toId
 * @param files 图片文件
 * @param uuid
 */
exports.sendImageMessage = async function (fromId, toId, files, uuid) {
    // 手动给文件加后缀, formidable默认保存的文件是无后缀的
    let fileName = tools.getP2PId(fromId, toId) + "_" + UUID.v1() + path.extname(files.upload.name)
    let newPath = path.dirname(files.upload.path) + '/' + fileName
    await fs.renameSync(files.upload.path, newPath)

    let res = null
    try {
        let img = fs.readFileSync(newPath);
        res = await shieldingService.checkSensitiveImg(img)
    } catch (e) {
        console.log(e)
        fs.unlinkSync(newPath) //清除文件
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    console.log("敏感识别", res)
    if (res == null) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, '敏感词判定结果为空'))
    }

    let sensitive = res['Hentai'] > 0.6 || res['Porn'] > 0.6 || res['Sexy'] > 0.6 ||
        res['Hentai'] + res['Porn'] + res['Sexy'] > 0.7

    console.log("敏感图判断", sensitive)
    let message = {
        fromId: fromId,
        toId: toId,
        conversationId: tools.getP2PIdOrdered(fromId, toId),
        relationId: tools.getP2PId(fromId, toId),
        content: fileName,
        type: 'IMG',
        extra: res,
        sensitive: sensitive
    }
    let value
    try {
        value = await repository.saveMessage(message)
    } catch (e) {
        console.log(e)
        fs.unlinkSync(newPath) //清除文件
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }

    // 数据库更新成功
    if (value) {
        //更换头像成功，通知长连接发送消息，同时将头像文件名返回
        let data = value.get()
        data.uuid = uuid
        console.log("保存图片文件", data)

        //获取备注信息
        try {
            let rel = await relationRepository.queryRemarkWithId(toId, fromId)
            data.friendRemark = rel[0].get().remark
            let userData = rel[0].get().user
            if (textUtils.isEmpty(rel[0].get().remark)) {
                data.friendRemark = userData.get().nickname
            }
            data.friendAvatar = userData.get().avatar
            let perm = userData.get().typePermission
            data.friendType = perm === 'PRIVATE' ? 0 : userData.get().type
            data.friendSubType = perm === 'PRIVATE?' ? 'normal' : userData.get().subType
            console.log('data', data)
        } catch (e) {
            console.log('err', e)
        }

        long_connection.sentImageMessage(data)
        return Promise.resolve(jsonUtils.getResponseBody(codes.success, data))
    } else {
        // 说明该用户id查找不到任何用户
        fs.unlinkSync(newPath) //清除文件
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error))
    }
}

/**
 * 发送图片消息
 * @param fromId
 * @param toId
 * @param files 图片文件
 * @param uuid
 * @param extra
 */
exports.sendVoiceMessage = async function (fromId, toId, files, uuid, extra) {
    // 手动给文件加后缀, formidable默认保存的文件是无后缀的
    let fileName = tools.getP2PId(fromId, toId) + "_" + UUID.v1() + path.extname(files.upload.name)
    let newPath = path.dirname(files.upload.path) + '/' + fileName
    await fs.renameSync(files.upload.path, newPath)
    let message = {
        fromId: fromId,
        toId: toId,
        conversationId: tools.getP2PIdOrdered(fromId, toId),
        relationId: tools.getP2PId(fromId, toId),
        content: fileName,
        type: 'VOICE',
        sensitive: false,
        extra: extra.toString()
    }
    let value
    try {
        value = await repository.saveMessage(message)
    } catch (e) {
        console.log(e)
        fs.unlinkSync(newPath) //清除文件
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    // 数据库更新成功
    if (value) {
        let data = value.get()
        data.uuid = uuid
        console.log("保存音频文件", data)
        //获取备注信息
        try {
            let rel = await relationRepository.queryRemarkWithId(toId, fromId)
            data.friendRemark = rel[0].get().remark
            let userData = rel[0].get().user
            if (textUtils.isEmpty(rel[0].get().remark)) {
                data.friendRemark = userData.get().nickname
            }
            data.friendAvatar = userData.get().avatar
            let perm = userData.get().typePermission
            data.friendType = perm === 'PRIVATE' ? 0 : userData.get().type
            data.friendSubType = perm === 'PRIVATE?' ? 'normal' : userData.get().subType
            console.log('data', data)
        } catch (e) {
            console.log('err', e)
        }
        long_connection.sentVoiceMessage(data)
        return Promise.resolve(jsonUtils.getResponseBody(codes.success, data))
    } else {
        // 说明该用户id查找不到任何用户
        fs.unlinkSync(newPath) //清除文件
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error))
    }
}




/**
 * 根据聊天文件名，返回聊天图片
 * @param fileName
 */
exports.getChatImage = async function (fileName) {
    try {
        let file = await new Promise((resolve, reject) => {
                //直接生成路径
                let target = path.join(__dirname, '../') + config.files.chatImageDir + '/' + fileName
                //读取文件
                fs.readFile(target, 'binary', function (err, file) {
                    if (err) {
                        reject(err)
                    } else if (file === null) {
                        reject(jsonUtils.getResponseBody(codes.no_chat_image_file))
                    } else {
                        //读取成功
                        resolve(file)
                    }
                })
            }
        ).then((file) => {
            return file
        });
        return Promise.resolve(file)

    } catch
        (e) {
        //console.log("error", e)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
}


/**
 * 根据聊天文件名，返回聊天语音
 * @param fileName
 */
exports.getChatVoiceMessage = async function (fileName) {
    try {
        let file = await new Promise((resolve, reject) => {
                //直接生成路径
                let target = path.join(__dirname, '../') + config.files.chatVoiceDir + '/' + fileName
                //读取文件
                fs.readFile(target, 'binary', function (err, file) {
                    if (err) {
                        reject(err)
                    } else if (file === null) {
                        reject(jsonUtils.getResponseBody(codes.no_chat_voice_file))
                    } else {
                        //读取成功
                        resolve(file)
                    }
                })
            }
        ).then((file) => {
            return file
        });
        return Promise.resolve(file)

    } catch
        (e) {
        //console.log("error", e)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
}
