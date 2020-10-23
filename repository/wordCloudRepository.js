const {where} = require('sequelize')
const models = require('../database/models')
const codes = require('../utils/codes').codes
const Op = models.Op
const tools = require('../utils/tools')
/**
 * 仓库层：用户关系数据读写
 * 操作和云图相关的几个数据库
 */

const UserRelation = models.UserRelation
const User = models.User
const wordCloudSum = models.wordCloudSum
const wordCloudBin = models.wordCloudBin

/**
 * 在创建账号时调用，创建user的词频总表
 * @param {} userId
 */
exports.createUserSum = function (userId) {
    //let message = await wordCloudSum.findAll({where:{[Op.and]:[{userId:userId},{type:'USER'}]}})

    return wordCloudSum.create({
        key: userId.toString(),
        type: 'USER',
        totalWord: 0
    })
}

/**
 * 在创建会话时调用，创建conversation的词频总表
 * @param conversationId
 */
exports.createConSum = function (conversationId) {
    return wordCloudSum.create({
        key: conversationId.toString(),
        type: 'CONVERSATION',
        totalWord: 0
    })
}

/**
 * 用户个人总词频增加
 * @param {*} userId
 * @param {*} addNum
 */
exports.addUserSum = function (userId, addNum) {
    return wordCloudSum.findOrCreate({
        where: {
            [Op.and]: [{key: userId.toString()}, {type: 'USER'}]
        },
        defaults: {
            key: userId.toString(),
            type: 'USER',
            totalWord: addNum
        }
    }).then(([user, created]) => {
        if (created === false) {
            return user.update({totalWord: user.totalWord + addNum})
        }
    })
}

/**
 * 会话总词频增加
 * @param conversationId
 * @param {*} addNum
 */
exports.addConSum = function (conversationId, addNum) {
    return wordCloudSum.findOrCreate({
        where: {
            [Op.and]: [
                {type: 'CONVERSATION'},
                {key: conversationId}
            ]
        },
        defaults: {
            key: conversationId.toString(),
            type: 'CONVERSATION',
            totalWord: addNum
        }
    }).then(([user, created]) => {
        if (created === false) {
            return user.update({totalWord: user.totalWord + addNum})
        }
    })
}

/**
 * 查找word对应的用户个人词是否存在，没有就新建
 * @param {*} userId
 * @param {*} word
 * @param {*} addNum
 */
exports.findOrCreateUserWord = function (userId, word, addNum) {
    return wordCloudBin.findOrCreate({
        where: {
            [Op.and]: [{key: userId}, {word: word}, {type: 'USER'}]
        },
        defaults: {
            key: userId.toString(),
            type: 'USER',
            word: word,
            num: addNum
        }
    }).then(([user, created]) => {
        if (created === false) {
            return user.update({num: user.num + addNum})
        }
    })
}

/**
 * 查找word对应的会话词是否存在，没有就新建
 * @param conversationId
 * @param {*} word
 * @param {*} addNum
 */
exports.findOrCreateConWord = function (conversationId, word, addNum) {
    return wordCloudBin.findOrCreate({
        where: {
            [Op.and]: [
                {word: word},
                {type: 'CONVERSATION'},
                {key: conversationId}
            ]
        },
        defaults: {
            key: conversationId,
            type: 'CONVERSATION',
            word: word,
            num: addNum
        }
    }).then(([user, created]) => {
        if (created === false) {
            return user.update({num: user.num + addNum})
        }
    })
}

/**
 * 删除会话相关词频
 * @param conversationId
 */
exports.deleteConversationWordCloud = function (conversationId) {
    return wordCloudBin.destroy({
        where: {
            [Op.and]: [{key: conversationId}, {type: 'CONVERSATION'}]
        }
    })
}

/**
 * 删除会话总词频
 * @param conversationId
 */
exports.deleteConversationSum = function (conversationId) {
    return wordCloudSum.destroy({
        where: {
            [Op.and]: [
                {type: 'CONVERSATION'},
                {key: conversationId}
            ]
        }
    })
}

/**
 * 获取用户词频表
 * @param {*} userId
 */
exports.getUserWordCloud = function (userId) {
    return wordCloudBin.findAll({
        where: {[Op.and]: [{key: userId.toString()}, {type: 'USER'}]},
        order: [['num', 'DESC']],
        limit: 10 //最多10条
    })
}

/**
 * 获取用户sum
 * @param {} userId
 */
exports.getUserSum = function (userId) {
    return wordCloudSum.findOne({
        where: {
            [Op.and]: [
                {key: userId.toString()}, {type: 'USER'}
            ]
        }
    })
}

/**
 * 获取会话词频表
 * @param conversationId
 */
exports.getConversationWordCloud = function (conversationId) {
    return wordCloudBin.findAll({
        where: {
            [Op.and]: [
                {type: 'CONVERSATION'},
                {key: conversationId}
            ]
        },
        order: [['num', 'DESC']],
        limit:10
    })
}

/**
 * 获取会话sum
 * @param conversationId
 */
exports.getConversationSum = function (conversationId) {
    return wordCloudSum.findOne({
        where: {
            [Op.and]: [
                {type: 'CONVERSATION'},
                {key: conversationId}
            ]
        }
    })
}