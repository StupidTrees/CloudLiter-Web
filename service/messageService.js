const repository = require('../repository/messageRepository');
const imageRepo = require('../repository/imageRepository');
const voiceRepo = require('../repository/voiceRepository')
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
const emotionService = require("./emotionService");
const wordCloudService = require("./wordCloudService");
const convRepo = require("../repository/conversationRepository");
const {getFileToResponse} = require("../utils/fileUtils");

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
    let res = {}
    try {
        let value = await repository.getUnreadConversationsOfOneUser(userId)
        for (let i = 0; i < value[0].length; i++) {
            res[value[0].conversationId] = value[0].num
        }
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    try {
        let value = await repository.getUnreadConversationsGroupOfOneUser(userId)
        for (let i = 0; i < value[0].length; i++) {
            res[value[0].conversationId] = value[0].num
        }
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    // let value = null
    // try {
    //     value = await repository.getUnreadConversationsOfOneUser(userId)
    // } catch (e) {
    //     return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    // }
    // if (value === null) {
    //     return Promise.reject(jsonUtils.getResponseBody(codes.other_error))
    // }
    // let res = {}
    // value.forEach(function (item) {
    //     //console.log('item',item.get())
    //     if (!res.hasOwnProperty(item.get().conversationId)) {
    //         res[item.get().conversationId] = 1
    //     } else {
    //         res[item.get().conversationId] += 1
    //     }
    // })
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
 * 发送文字消息
 * @param fromId
 * @param conversationId
 * @param content
 * @param uuid
 */
exports.sendTextMessage = async function (fromId, conversationId, content, uuid) {
    let obj = {
        fromId: fromId,
        conversationId: conversationId,
        content: content,
        type: 'TXT'
    }
    let text = obj.content
    //情感分析
    let emotionResult = await emotionService.segmentAndAnalyzeEmotion(text)
    let emotionScore = emotionResult.score
    let segmentation = emotionResult.segmentation
    //敏感词检测
    let sensitive = await shieldingService.checkSensitive(text)
    //如果不敏感，就加入到词云统计
    if (!sensitive) {
        wordCloudService.addToWordCloud(obj.fromId, obj.conversationId, emotionResult.toWordCloud).then((value) => {
        }).catch(() => {
        })
    }
    obj.sensitive = sensitive
    obj.emotion = emotionScore
    obj.extra = segmentation
    let value
    try {
        value = await repository.saveMessage(obj)
    } catch (e) {
        console.log(e)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    // 数据库更新成功
    if (value) {
        //更新对话信息
        convRepo.updateConversation(conversationId, sensitive ? '*敏感信息*' : obj.content).then()
        let data = value.get()
        data.uuid = uuid
        long_connection.broadcastMessageSent(fromId, conversationId, data).then()
        return Promise.resolve(jsonUtils.getResponseBody(codes.success, data))
    } else {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error))
    }
}

/**
 * 发送图片消息
 * @param fromId
 * @param conversationId
 * @param files 图片文件
 * @param uuid
 */
exports.sendImageMessage = async function (fromId, conversationId, files, uuid) {
    // 手动给文件加后缀, formidable默认保存的文件是无后缀的
    let fileName = conversationId + "_" + UUID.v1() + path.extname(files.upload.name)
    let newPath = path.dirname(files.upload.path) + '/' + fileName
    await fs.renameSync(files.upload.path, newPath)
    let sensitiveDetail = null
    try {
        let img = fs.readFileSync(newPath);
        sensitiveDetail = await shieldingService.checkSensitiveImg(img)
    } catch (e) {
        console.log(e)
        fs.unlinkSync(newPath) //清除文件
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    console.log("敏感识别", sensitiveDetail)
    if (sensitiveDetail == null) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, '敏感词判定结果为空'))
    }
    let sensitive = sensitiveDetail['Hentai'] > 0.6 || sensitiveDetail['Porn'] > 0.6 || sensitiveDetail['Sexy'] > 0.6 ||
        sensitiveDetail['Hentai'] + sensitiveDetail['Porn'] + sensitiveDetail['Sexy'] > 0.7
    console.log("敏感图判断", sensitive)
    let message = {
        fromId: fromId,
        conversationId: conversationId,
        content: null,//fileName,
        type: 'IMG',
        extra: sensitiveDetail,
        sensitive: sensitive
    }
    let value
    try {
        let userIds = await convRepo.getConversationUserIds(fromId, conversationId)
        let toId
        if (userIds.length > 0) {
            toId = userIds[0]
        }
        let data = await imageRepo.saveImage(fromId, toId, conversationId, fileName, JSON.stringify(sensitiveDetail), 'NORMAL')
        let imageData = data.get()
        message.fileId = imageData.id
        value = await repository.saveMessage(message)
    } catch (e) {
        console.log(e)
        fs.unlinkSync(newPath) //清除文件
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    if (!value) {
        // 说明该用户id查找不到任何用户
        fs.unlinkSync(newPath) //清除文件
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error))
    }
    let messageData = value.get()
    //更换头像成功，通知长连接发送消息，同时将头像文件名返回
    messageData.uuid = uuid
    convRepo.updateConversation(conversationId, '[图片]').then()
    long_connection.broadcastMessageSent(fromId, conversationId, messageData).then()
    return Promise.resolve(jsonUtils.getResponseBody(codes.success, messageData))

}


/**
 * 发送语音消息
 * @param fromId
 * @param conversationId
 * @param files 语音文件
 * @param uuid
 * @param length
 */
exports.sendVoiceMessage = async function (fromId, conversationId, files, uuid, length) {
    // 手动给文件加后缀, formidable默认保存的文件是无后缀的
    let fileName = conversationId + "_" + UUID.v1() + path.extname(files.upload.name)
    let newPath = path.dirname(files.upload.path) + '/' + fileName
    await fs.renameSync(files.upload.path, newPath)
    let message = {
        fromId: fromId,
        conversationId: conversationId,
        content: fileName,
        type: 'VOICE',
        sensitive: false,
        extra: length.toString()
    }
    let value
    try {
        let userIds = await convRepo.getConversationUserIds(fromId, conversationId)
        let toId
        if (userIds.length > 0) {
            toId = userIds[0]
        }
        let data = await voiceRepo.saveVoice(fromId, toId, conversationId, fileName, length)
        let voiceData = data.get()
        message.fileId = voiceData.id
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
        convRepo.updateConversation(message.conversationId, '[语音]').then()
        long_connection.broadcastMessageSent(fromId, conversationId, data).then()
        return Promise.resolve(jsonUtils.getResponseBody(codes.success, data))
    } else {
        // 说明该用户id查找不到任何用户
        fs.unlinkSync(newPath) //清除文件
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error))
    }
}


/**
 * 根据聊天文件名，返回聊天语音
 * @param fileName
 */
exports.getChatVoiceMessage = async function (fileName) {
    return getFileToResponse(path.join(__dirname, '../') + config.files.chatVoiceDir + '/' + fileName)
}
