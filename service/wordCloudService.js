const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes
const wordCloudRepository = require('../repository/wordCloudRepository')
const tools = require('../utils/tools')

/**
 * 服务层
 */


/**
 * 将词汇表统计词频后加入相关的数据库
 * @param {*} userId
 * @param conversationId
 * @param {*} list
 */
exports.addToWordCloud = async function (userId,conversationId, list) {
    let store = {}
    list.forEach((item) => {
        if (store.hasOwnProperty(item)) {
            store[item] += 1
        } else {
            store[item] = 1
        }
    })
    if (list.length === 0) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error))
    }
    //记录总数
    try {
        await wordCloudRepository.addConSum(conversationId, list.length)
        await wordCloudRepository.addUserSum(userId, list.length)
    } catch (err) {
        console.log(err)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    }

    //处理单个词
    let item
    for (item in store) {
        try {
            await wordCloudRepository.findOrCreateConWord(conversationId, item, store[item])
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
exports.getUserWordCloud = async function (userId) {
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
        message = await wordCloudRepository.getUserWordCloud(userId)
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
 * @param userId
 * @param friendId
 */
exports.getConversationWordCloud = async function (userId,friendId) {
    let conversationId = tools.getP2PIdOrdered(userId,friendId)
    let sum
    let message
    let result = {}
    try {
        sum = await wordCloudRepository.getConversationSum(conversationId)
    } catch (err) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    }
    // result.sum = sum.totalWord
    try {
        message = await wordCloudRepository.getConversationWordCloud(conversationId)
    } catch (err) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    }

    message.forEach(function (item) {
        result[item.word] = item.num / sum.totalWord
    })
    return Promise.resolve(jsonUtils.getResponseBody(codes.success, result))
}