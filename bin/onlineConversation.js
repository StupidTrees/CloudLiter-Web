const client = require('./onlineRepository').redisClient
const redis = require('redis')
const socketCon = require('../bin/socketConnection')
const INTERVAL = 1000 * 60 * 2 //2分钟没发言就重置

const clocks = {}

exports.getHotTopicOfConversation = function (conversationId) {
    return new Promise((resolve, reject) => {
        client.hgetall('ctoken_' + conversationId, (err, value) => {
            if (err) {
                reject(err)
            } else {
                let list = []
                for (let k in value) {
                    list.push({
                        name: k,
                        frequency: value[k]
                    })
                }
                list = list.sort((a, b) => {
                    return parseInt(b.frequency) - parseInt(a.frequency)
                })
                let resList = []
                for (let i = 0; i < 5 && i < list.length; i++) {
                    resList.push(list[i])
                }
                resolve(resList)
            }
        })
    })
}

exports.addTokenToConversation = function (token, conversationId) {
    client.hget('conversationTs', conversationId, function (err, value) {
        if (value) {
            if (new Date().getTime() - value >= INTERVAL) {
                client.del('ctoken_' + conversationId)
            }
        }
        client.hincrby('ctoken_' + conversationId, token, 1)
        client.hset('conversationTs', conversationId, new Date().getTime(), redis.print)
        socketCon.broadcastConversationTopicInfo(conversationId).then()
        if (clocks.hasOwnProperty(conversationId)) {
            clearTimeout(clocks[conversationId])
        }
        clocks[conversationId] = setTimeout(() => {
            //超时后清空
            client.del('ctoken_' + conversationId)
            socketCon.broadcastConversationTopicInfo(conversationId).then()
        }, INTERVAL)
    })
}


