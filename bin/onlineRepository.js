const redis = require('redis')
const client = redis.createClient(6379, '127.0.0.1');
client.on('connect', function () {
    console.log("redis", "connect")
})

client.on("error", function (err) {
    console.log("redis client连接失败", err);
});
client.on('ready', function (res) {
    console.log('client ready');
});


exports.addUserSocket = function (userId, socketId) {
    client.hset('id2SocketId', userId, socketId, redis.print)
}

exports.removeUserSocket = function (userId) {
    client.hdel('id2SocketId', userId, redis.print)
}
exports.userSocketExist = async function (userId) {
    //return Promise.resolve(id2SocketId.hasOwnProperty(userId))
    return new Promise((resolve, reject) => {
        client.hexists('id2SocketId', userId, (err, value) => {
            if (err || value == null) {
                reject(err)
            } else {
                resolve(value !== 0)
            }
        })
    })
}

exports.getSocketForUser = async function (userId) {
    // if (id2SocketId.hasOwnProperty(userId)) return Promise.resolve(id2SocketId[userId])
    // else return Promise.reject()
    return new Promise((resolve, reject) => {
        client.hget('id2SocketId', userId, (err, value) => {
            if (err || value == null) {
                reject(err)
            } else {
                resolve(value)
            }
        })
    })
}

exports.addUserToConversation = function (userId, conversationId) {
    //user2Conversation[userId] = conversationId
    client.hset('user2Conversation', userId, conversationId, redis.print)
}

exports.removeUserFromConversation = async function (userId, conversationId) {
    client.hdel('user2Conversation', userId, redis.print)
}

exports.getConversationOfUser = async function (userId) {
    return new Promise((resolve, reject) => {
        client.hget('user2Conversation', userId, (err, value) => {
            if (err || value == null) {
                reject(err)
            } else {
                resolve(value)
            }
        })
    })
}

exports.addUserToWaitingList = function (hostId, userId, conversationId) {
    client.hset('w_' + hostId, userId, conversationId, redis.print)
}

exports.removeUserFromWaitingList = function (hostId, userId) {
    client.hdel('w_' + hostId, userId, redis.print)
}

exports.getWaitingListOfUser = async function (hostId) {
    return new Promise((resolve, reject) => {
        client.hgetall('w_' + hostId, (err, result) => {
            if (err || result == null || result.length === 0) {
                reject(err)
            } else {
                let res = []
                for (let item in result) {
                    res.push({
                        userId: item,
                        conversationId: result[item]
                    })
                }
                resolve(res)
            }
        })
    })
}

exports.redisClient = client
