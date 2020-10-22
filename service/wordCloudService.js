const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes
const wordCloudRepository = require('../repository/wordCloudRepository')

/**
 * 服务层
 */


/**
 * 将词汇表统计词频后加入相关的数据库
 * @param {*} userId
 * @param {*} friendId
 * @param {*} list
 */
exports.conductList = async function (userId, friendId, list) {
    let store = {}
    list.forEach((item, index) => {
        if (store.hasOwnProperty(item)) {
            store[item] += 1
        } else {
            store[item] = 1
        }
    })
    if (list.length === 0) {
        return Promise.reject(jsonUtils.getResponseBody(codes.wordCloud_null))
    }
    //记录总数
    try {
        await wordCloudRepository.addConSum(userId, friendId, list.length)
        await wordCloudRepository.addUserSum(userId, list.length)
    } catch (err) {
        console.log(err)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    }

    //处理单个词
    let item
    for (item in store) {
        try {
            await wordCloudRepository.findOrCreateConWord(userId, friendId, item, store[item])
            await wordCloudRepository.findOrCreateUserWord(userId, item, store[item])
        } catch (err) {
            return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
        }
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.success))
}

/**
 * 获取用户词云信息
 * @param {*} userId
 */
exports.getUserCloud = async function (userId) {
    let sum
    let message
    let result = {}
    try {
        sum = await wordCloudRepository.getUserSum(userId)
    } catch (err) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    }
    result.sum = sum.totalWord

    try {
        message = await wordCloudRepository.getUserMessage(userId)
    } catch (err) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    }

    message.forEach(function (item) {
        let word = item.word
        result[word] = item.num
    })
    return Promise.resolve(jsonUtils.getResponseBody(codes.success, result))
}

/**
 * 获取对话词云信息
 * @param {*} userId
 * @param {*} friendId
 */
exports.getConCloud = async function (userId, friendId) {
    let sum
    let message
    let result = {}
    try {
        sum = await wordCloudRepository.getConSum(userId, friendId)
    } catch (err) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    }
    // result.sum = sum.totalWord
    try {
        message = await wordCloudRepository.getConMessage(userId, friendId)
    } catch (err) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    }

    message.forEach(function (item) {
        result[item.word] = item.num / sum.totalWord
    })
    return Promise.resolve(jsonUtils.getResponseBody(codes.success, result))
}