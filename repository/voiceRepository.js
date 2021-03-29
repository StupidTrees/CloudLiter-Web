const models = require('../database/models')
const tools = require('../utils/tools')
const {equals} = require("../utils/textUtils");
const Op = models.Op

/**
 * 仓库层：对话表数据读写
 */
const VoiceTable = models.VoiceTable


/**
 * 将图片记录保存
 */
exports.saveVoice = function (fromId, toId, conversationId, filename, length) {
    return VoiceTable.create({
        fromId: fromId,
        toId: toId,
        conversationId: conversationId,
        fileName: filename,
        length: length
    })
}

/**
 * 根据录音id获取录音对象
 */
exports.getVoiceById = function (voiceId) {
    return VoiceTable.findByPk(voiceId)
}


