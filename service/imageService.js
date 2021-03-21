const repository = require('../repository/imageRepository');
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes
const fileUtils = require('../utils/fileUtils')
const config = require("../config");
const fs = require('fs')
const path = require('path')
const lodash = require('lodash')
const textUtils = require("../utils/textUtils");
const whiteListRepository = require("../repository/whiteListRepository");
const {getFileToResponse} = require("../utils/fileUtils");


/**
 * 根据图片id，获取图片文件
 * @param imageId
 */
exports.getImageById = async function (imageId) {
    let value = null
    try {
        value = await repository.getImageFilenameById(imageId)
        let filename = value.get().fileName
        return getFileToResponse(path.join(__dirname, '../') + config.files.chatImageDir + '/' + filename)
    } catch (e) {
        return jsonUtils.getResponseBody(codes.other_error, e)
    }
}

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
 * 返回某个好友的所有照片id
 * @param userId
 * @param friendId
 * @param pageSize
 * @param pageNum
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.getImagesOfFriend = async function (userId, friendId, pageSize, pageNum) {
    let value = null
    try {
        value = await repository.getImageOfFriend(userId, friendId, pageNum * pageSize, pageSize)
    } catch (err) {
        console.log(err)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    }
    let result = []
    for (let i = 0; i < value[0].length; i++) {
        let data = value[0][i]
        console.log(data)
        result.push(data.id)
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.success, result))
}

/**
 * 根据userId获取图片分类
 * @param userId
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.getClasses = async function (userId) {
    let value = null
    try {
        value = await repository.getClassesById(userId)
    } catch (err) {
        console.log(err)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    }
    let result = []
    for (let i = 0; i < value.length; i++) {
        let item = value[i]
        let data = item.get()
        if (data.classKey !== null) {
            let img = await repository.getImagesOfClass(userId, 0, 1, data.classKey)
            let representId
            if (img != null && img.length > 0) {
                representId = img[0].get().id
            }
            result.push({
                key: data.classKey,
                representId: representId
            })
        }
    }
    console.log(result)
    return Promise.resolve(jsonUtils.getResponseBody(codes.success, result))
}


/**
 * 获取某用户相册里的所有亲友
 * @param userId
 */
exports.getFriendFacesOfUser = async function (userId) {
    let value = null
    try {
        value = await repository.getFriendFacesOfUser(userId)
        let res = []
        for (let i = 0; i < value[0].length; i++) {
            let data = value[0][i]
            res.push({
                userId: data.userId,
                userName: getUsernameForShow(data.username,data.nickname,data.remark),
                userAvatar: data.avatar
            })
        }
        return Promise.resolve(jsonUtils.getResponseBody(codes.success, res))
    } catch (e) {
        console.log(e)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
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

/**
 * 添加人脸白名单
 * @param userId
 * @param whitelist
 */
exports.addToWhitelist = async function (userId, whitelist) {
    try {
       await whiteListRepository.addToWhitelist(userId,whitelist)
    } catch (err) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.success))
}


function getUsernameForShow(username,nickname,remark){
    let userName
    if (!textUtils.isEmpty(remark)) {
        userName = remark
    } else if (!textUtils.isEmpty(nickname)) {
        userName = nickname
    } else {
        userName = username
    }
    return userName
}

/**
 * 获得白名单
 * @param userId
 */
exports.getWhiteList = async function (userId) {
    try {
        let value = await whiteListRepository.getWhiteList(userId)
        let result = []
        for(let i =0;i<value[0].length;i++){
            let data = value[0][i]
            result.push({
                userId: data.id,
                userName: getUsernameForShow(data.username,data.nickname,data.remark),
                userAvatar: data.avatar
            })
        }
        return Promise.resolve(jsonUtils.getResponseBody(codes.success, result))
    } catch (err) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    }

}

/**
 * 获得白名单
 * @param userId
 * @param friendId
 */
exports.removeFromWhiteList = async function (userId,friendId) {
    try {
        await whiteListRepository.removeFromWhiteList(userId,friendId)
    } catch (err) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.success))

}

