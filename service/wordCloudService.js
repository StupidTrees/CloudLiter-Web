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
exports.addToWordCloud = async function (userId, conversationId, list) {
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

    //处理单个词
    let item
    for (item in store) {
        try {
            let convUpdated = await wordCloudRepository.findOrCreateConWord(conversationId, item, store[item])
            let usrUpdated = await wordCloudRepository.findOrCreateUserWord(userId, item, store[item])
            await wordCloudRepository.updateTop10("USER", userId, item, usrUpdated)
            await wordCloudRepository.updateTop10("CONV", conversationId, item, convUpdated)
        } catch (err) {
            return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
        }
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.success))
}


/**
 * 获取词云信息
 * @param userId
 * @param type
 * @param id
 */
exports.getWordCloud = async function (userId, type, id) {
    let data
    let result = {}
    try {
        data = await wordCloudRepository.getTop10(type, id)
    } catch (err) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    }
    //不是用户自己的，且不可见
    if (type !== 'CONV' && userId.toString() !== id.toString() && data.private) {
        return Promise.reject(jsonUtils.getResponseBody(codes.word_cloud_private))
    }
    let list = data.list
    let sum = 0
    list.forEach(function (item) {
        sum += item.freq
    })
    list.forEach(function (item) {
        if (item.freq > 0) {
            result[item.name] = item.freq / sum;
        }
    })

    return Promise.resolve(jsonUtils.getResponseBody(codes.success, result))
}


/**
 * 删除词云
 * @param word
 * @param cloudId
 */
exports.delWordCloud = async function (word, cloudId) {
    let rank
    console.log('word:' + word)
    try {
        rank = await wordCloudRepository.getRank(cloudId, word)
    } catch (err) {
        console.log(err)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    }
    if (rank === -1) {
        return Promise.reject(jsonUtils.getResponseBody(codes.no_such_word_cloud))
    }
    let data
    try {
        data = await wordCloudRepository.findAllByF(cloudId)
    } catch (err) {
        console.log(err)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    }

    try {
        await wordCloudRepository.deleteUserWordCloud(cloudId, word)
    } catch (err) {
        console.log(err)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    }
    try {
        //console.log('2')
        let value
        if (data.length >= 10) {
            value = data[9].get()
            console.log(value.word)
        }
        await wordCloudRepository.reSort(cloudId, rank, value, data.length)
    } catch (err) {
        console.log(err)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    }
    return Promise.reject(jsonUtils.getResponseBody(codes.success))
}