const repository = require('../repository/voiceRepository');
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes

/**
 * 获得录音对象
 * @param voiceId
 */
exports.getVoiceEntityById = async function (voiceId) {
    let value = null
    try {
        value = await repository.getVoiceById(voiceId)
        return Promise.reject(jsonUtils.getResponseBody(codes.success, value.get()))
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
}

