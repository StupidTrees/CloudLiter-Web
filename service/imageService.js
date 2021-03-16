const repository = require('../repository/imageRepository');
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes
const fileUtils = require('../utils/fileUtils')
const config = require("../config");
const fs = require('fs')
const path = require('path')
const lodash = require('lodash')

/**
 * 返回同类别图片id
 * @param userId
 * @param pageSize
 * @param pageNum
 * @param classKey
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.getImagesByClass = async function (userId, pageSize, pageNum, classKey) {
    let value = null
    try {
        value = await repository.getImagesOfClass(userId, pageNum * pageSize, pageSize, classKey)
    } catch (err) {
        console.log(err)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    }
    let imageId = []
    value.forEach(function (item) {
        let data = item.get()
        imageId.push(data.id)
    })
    return Promise.resolve(jsonUtils.getResponseBody(codes.success, imageId))
}

/**
 * 根据userId获取图片分类
 * @param userId
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.getClasses = async function (userId) {
    console.log('userId:' + userId)
    let value = null
    try {
        value = await repository.getClassesById(userId)
    } catch (err) {
        console.log(err)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    }

    console.log('value:' + JSON.stringify(value[0].get()))
    let classes = {}
    for (let i = 0; i < value.length; i++) {
        let item = value[i]
        let data = item.get()
        if (data.scene !== null) {
            let img = await repository.getImagesOfClass(userId, 0, 1, data.scene)
            let representId
            if (img != null && img.length > 0) {
                representId = img[0].get().id
            }
            classes[data.scene] = {
                key: data.scene,
                representId: representId
            }
        }
    }
    let result = []
    for(let x in classes){
        result.push(classes[x])
    }
    console.log(result)
    return Promise.resolve(jsonUtils.getResponseBody(codes.success, result))
}

/**
 * 获取图片对象
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

/**
 * 获取人脸列表
 * @param userId
 */
exports.getFacesOfUser = async function (userId) {
    let value = null
    try {
        value = await repository.getFaces(userId)
        let res = []
        value.forEach((item, _) => {
            res.push(item.get())
        })
        return Promise.reject(jsonUtils.getResponseBody(codes.success, res))
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
}


/**
 * 获取人脸图片
 * @param userId 请求人的id，防止隐私泄漏
 * @param faceId
 */
exports.getFaceImage = async function (userId, faceId) {
    let value = null
    try {
        value = await repository.getFaceFilenameById(userId, faceId)
        let filename = value.get().pic_name
        return fileUtils.getFileToResponse(path.join(__dirname, '../') + config.files.faceImageDir + filename)
    } catch (e) {
        console.log(e)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
}


/**
 * 删除人脸
 * @param userId 请求人的id，防止隐私泄漏
 * @param faceId
 */
exports.deleteFace = async function (userId, faceId) {
    let value = null
    try {
        value = await repository.getFaceFilenameById(userId, faceId)
        let filename = value.get().pic_name
        let filepath = path.join(__dirname, '../') + config.files.faceImageDir + filename
        try {
            fs.unlinkSync(filepath)
        } catch (e) {
        }
        await repository.deleteFace(userId, faceId)
        return Promise.resolve(jsonUtils.getResponseBody(codes.success))
    } catch (e) {
        console.log(e)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
}