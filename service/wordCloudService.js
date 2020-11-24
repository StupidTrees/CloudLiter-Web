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

    //处理单个词
    let item
    for (item in store) {
        try {
            let convUpdated = await wordCloudRepository.findOrCreateConWord(conversationId, item, store[item])
            let usrUpdated = await wordCloudRepository.findOrCreateUserWord(userId, item, store[item])
            await wordCloudRepository.updateTop10("USER",userId, item,usrUpdated)
            await wordCloudRepository.updateTop10("CONV",conversationId, item, convUpdated)
        } catch (err) {
            return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
        }
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.success))
}

// /**
//  * 获取用户词云信息
//  * @param {*} userId
//  */
// exports.getUserWordCloud = async function (userId) {
//     let sum
//     let message
//     let result = {}
//     try {
//         sum = await wordCloudRepository.getUserSum(userId)
//     } catch (err) {
//         return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
//     }
//     try {
//         message = await wordCloudRepository.getUserWordCloud(userId)
//     } catch (err) {
//         return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
//     }
//
//     message.forEach(function (item) {
//         let word = item.word
//         result[word] = item.num/sum.totalWord
//     })
//     return Promise.resolve(jsonUtils.getResponseBody(codes.success, result))
// }

/**
 * 获取对话词云信息
 * @param type
 * @param userId
 * @param friendId
 */
exports.getWordCloud = async function (type,userId,friendId) {
    let id = type==='CONV'?tools.getP2PIdOrdered(userId,friendId):friendId
    let message
    let result = {}
    try{
        message = await wordCloudRepository.getTop10(type,id)
    }catch (err){
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error,err))
    }
    let sum = 0
    message.forEach(function (item){
        sum += item.freq
    })
    message.forEach(function (item){
        if(item.freq>0){
            result[item.name] = item.freq/sum;
        }
    })

    return Promise.resolve(jsonUtils.getResponseBody(codes.success, result))
}
/*
exports.updateTop10 = async function (id, word, num) {
    try {
        await wordCloudRepository.updateTop10(id, word, num)
    } catch (err) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    }
}*/