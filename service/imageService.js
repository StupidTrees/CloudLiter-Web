const repository = require('../repository/imageRepository');
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes

/**
 * 更新会话信息
 * @param imageId
 */
exports.getImageEntityById = async function (imageId) {
    let value = null
    try {
        value = await repository.getImageById(imageId)
        return Promise.reject(jsonUtils.getResponseBody(codes.success, value.get()))
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
}

