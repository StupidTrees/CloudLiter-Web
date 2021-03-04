const models = require('../database/models')
const tools = require('../utils/tools')
const {equals} = require("../utils/textUtils");
const Op = models.Op

/**
 * 仓库层：对话表数据读写
 */
const ImageTable = models.ImageTable


/**
 * 将图片记录保存
 */
exports.saveImage = function (fromId, toId, filename, sensitive) {
    return ImageTable.create({
        fromId: fromId,
        toId: toId,
        fileName: filename,
        sensitive: sensitive
    })
}

/**
 * 根据图片id获取图片对象
 */
exports.getImageById = function (imageId) {
    return ImageTable.findByPk(imageId)
}

/**
 * 根据图片id获取图片文件名
 */
exports.getImageFilenameById = function (imageId) {
    return ImageTable.findByPk(
        imageId, {
            attributes: ['fileName']
        }
    )
}


/**
 * 更新图片的分类结果
 * @param imageId
 * @param imageClass
 */
exports.updateSceneById = function (imageId, imageClass) {
    return ImageTable.update({
        "scene": imageClass
    }, {
        where: {
            "id": imageId
        }
    })
}


