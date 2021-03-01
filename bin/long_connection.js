const convService = require('../service/conversationService')
const messageService = require('../service/messageService')
const shieldingService = require('../service/shieldingService')
const emotionService = require('../service/emotionService')
const tools = require('../utils/tools')
const textUtils = require('../utils/textUtils')
const wordCloudService = require('../service/wordCloudService')

let io

exports.initSocket = function (server) {
    io = require('socket.io').listen(server);
    io.on('connection', onConnect)
}


//记录用户id和socketId转换表
const id2SocketId = {}

//记录用户和其正在进行对话
const user2Conversation = {}
//记录用户正在被期待的对话
const userExpectedConversation = {}

function removeUserFromConversation(userId, convId) {
    if (user2Conversation[userId] === convId) {
        delete user2Conversation[userId]
    }

    //从朋友的被期待列表中移除自己
    let friendId = getTheOtherId(userId, convId)
    if (userExpectedConversation.hasOwnProperty(friendId)) {
        let users = userExpectedConversation[friendId]
        userExpectedConversation[friendId].splice(users.indexOf(userId), 1)
    }
}

function getTheOtherId(userId, conversationId) {
    let arr = conversationId.split('-')
    if (arr.length === 2) {
        let str1 = arr[0]
        let str2 = arr[1]
        if (textUtils.equals(userId, str1)) {
            return str2
        } else {
            return str1
        }
    }
    return ''
}

function removeUser(key) {
    //console.log("disconnect", key)
    if (user2Conversation.hasOwnProperty(key)) {
        removeUserFromConversation(key, user2Conversation[key])
        //console.log("用户断连，退出对话窗口", userExpectedConversation)
    }

    //console.log("用户" + key + "下线", userExpectedConversation)
    if (userExpectedConversation.hasOwnProperty(key)) {
        //通知正在和他进行对话的好友，他下了
        userExpectedConversation[key].forEach(item => {
            //console.log('通知下线', key + "->" + id2SocketId[item])
            io.to(id2SocketId[item]).emit('query_online_result', key, 'OFFLINE')
        })
    }
    if (id2SocketId.hasOwnProperty(key)) {
        //删除
        delete id2SocketId[key]
        //console.log(key + "退出了");
    }
}

function markOnline(socket, userId) {
    if (!id2SocketId.hasOwnProperty(userId)) {
        id2SocketId[userId] = socket.id
        //console.log(userId + "上线了");
        //console.log("当前在线列表", id2SocketId);
        //获取未读消息列表
        messageService.countUnreadMessage(userId).then((value) => {
            socket.emit('unread_message', JSON.stringify(value))
        })
        if (userExpectedConversation.hasOwnProperty(userId)) {
            //通知正在和他进行对话的好友，他上线了
            userExpectedConversation[userId].forEach(item => {
                //console.log('通知上线', userId + "->" + id2SocketId[item])
                io.to(id2SocketId[item]).emit('query_online_result', userId, 'ONLINE')
            })
        }

    }
}

function onConnect(socket) {
    //console.log('新用户登录');
    //监听新用户加入
    socket.on('login', function (userId) {
        //  let obj = JSON.parse(objStr)
        //console.log("login", userId)
        socket.name = userId
        markOnline(socket, userId)
    })

    socket.on('logout', function (userId) {
        removeUser(userId)
    })
    //监听用户退出
    socket.on('disconnect', function () {
        //将退出用户在在线列表删除
        let key = socket.name
        removeUser(key)
    })

    //某用户进入某对话
    socket.on('into_conversation', function (userId, friendId, conversationId) {
        markOnline(socket, userId) //确保在线
        if (user2Conversation.hasOwnProperty(userId)) {
            //断开用户和原有对话的联系
            removeUserFromConversation(userId, user2Conversation[userId])
            //console.log("断开用户和原有对话的联系")
        }
        user2Conversation[userId] = conversationId
        //将自己加入到朋友的被期待表中
        if (!userExpectedConversation.hasOwnProperty(friendId)) {
            userExpectedConversation[friendId] = []
        }
        userExpectedConversation[friendId].push(userId)
        //console.log("用户进入对话窗口", userExpectedConversation)

        //通知正在和他进行对话的好友，他进入了某对话
        if (userExpectedConversation.hasOwnProperty(userId)) {
            userExpectedConversation[userId].forEach(item => {
                //console.log('通知进入对话', userId + "->" + id2SocketId[item])
                let mark = textUtils.equals(friendId, item) ? 'YOU' : 'OTHER'
                io.to(id2SocketId[item]).emit('query_online_result', userId, mark)
            })
        }
    })

    //某用户退出某对话
    socket.on('left_conversation', function (userId, conversationId) {

        removeUserFromConversation(userId, conversationId)
        //console.log("用户退出对话窗口", userExpectedConversation)
        //通知正在和他进行对话的好友，他退出某对话
        if (userExpectedConversation.hasOwnProperty(userId)) {
            userExpectedConversation[userId].forEach(item => {
                //console.log('通知退出对话', userId + "->" + id2SocketId[item])
                io.to(id2SocketId[item]).emit('query_online_result', userId, 'ONLINE')
            })
        }
    })

    //标记某对话下的消息全部已读
    socket.on('mark_all_read', function (userId, convId, topTime) {
        //console.log('标记全部已读', userId + "," + convId + "," + topTime)
        markOnline(socket, userId)//保持在线
        if(userId==null||convId==null||topTime==null){
            return ;
        }
        messageService.markAllRead(userId, convId, topTime).then()
        //通知处于对话框对方，他读了一堆消息
        if (userExpectedConversation.hasOwnProperty(getTheOtherId(userId, convId))) {
            //console.log('通知已读全部消息', userId + "->" + id2SocketId[getTheOtherId(userId, convId)])
            io.to(id2SocketId[getTheOtherId(userId, convId)]).emit('friend_read_all', userId, convId,topTime)
        }
    })

    //标记某消息已读
    socket.on('mark_read', function (userId, convId, messageId) {
        markOnline(socket, userId)//保持在线
        //console.log('标记已读',userId + "," + convId + "," + messageId)
        if(userId==null||convId==null||messageId==null){
            return ;
        }
        messageService.markRead(messageId).then()
        //通知处于对话框的对方，他读了一条消息
        if (userExpectedConversation.hasOwnProperty(getTheOtherId(userId, convId))) {
            //console.log('通知已读某条消息', userId + "->" + id2SocketId[getTheOtherId(userId, convId)])
            io.to(id2SocketId[getTheOtherId(userId, convId)]).emit('friend_read_one', userId, convId,messageId)
        }

    })

    //监听用户发布聊天内容
    socket.on('message', function (objStr) {
        let obj = JSON.parse(objStr)
        markOnline(socket, obj.fromId)//保持在线
        //console.log('发送消息', obj)
        //console.log('对方的socketId为', id2SocketId[obj.toId])

        async function processSentence(text) {
            //情感分析
            let emotionResult = await emotionService.segmentAndAnalyzeEmotion(text)
            //console.log("情感分析结果", emotionResult)
            let emotionScore = emotionResult.score
            let segmentation = emotionResult.segmentation
            //敏感词检测
            let sensitive = await shieldingService.checkSensitive(text)
            //如果不敏感，就加入到词云统计
            if (!sensitive) {
                wordCloudService.addToWordCloud(obj.fromId, obj.conversationId, emotionResult.toWordCloud).then()
            }
            //console.log("敏感判定结果", sensitive)
            return Promise.resolve({emotion: emotionScore, sensitive: sensitive, segmentation: segmentation})
        }

        processSentence(obj.content).then((value) => {
            obj.sensitive = value.sensitive
            obj.emotion = value.emotion
            obj.extra = value.segmentation
            //更新对话信息
            convService.updateConversation(obj.fromId, obj.toId, value.sensitive ? '*敏感信息*' : obj.content).then()
            //保存消息，保存成功才能传递给对方
            messageService.saveMessage(obj).then((value) => {
                io.to(id2SocketId[obj.toId]).emit('message', value.data);
                value.data.uuid = obj.uuid //传递客户端上的uuid
                socket.emit('message_sent', value.data)
                //console.log('value', value)
                //console.log(obj.fromId + '对' + obj.toId + '说：' + obj.content);
            }, (err) => {
                //console.log("消息发送失败", err)
            })
        })


    });

    //获取某好友是否在线
    socket.on('query_online', function (userId, friendId) {
        markOnline(socket, userId)//保持在线
        let mark = id2SocketId.hasOwnProperty(friendId) ? 'ONLINE' : 'OFFLINE'
        if (user2Conversation.hasOwnProperty(friendId)) {
            let other = getTheOtherId(friendId, user2Conversation[friendId])
            if (textUtils.equals(other, userId)) {
                mark = 'YOU'
            } else {
                mark = 'OTHER'
            }
        }
        socket.emit('query_online_result', friendId, mark)
    })

}


//发送图片消息
exports.sentImageMessage = function (message) {
    ////console.log('sendImageMessage', id2SocketId)
    //更新对话信息
    convService.updateConversation(message.fromId, message.toId, '[图片]').then()
    if (id2SocketId.hasOwnProperty(message.fromId.toString())) {
        let socket = id2SocketId[message.fromId.toString()]
        if (id2SocketId.hasOwnProperty(message.toId.toString())) {
            io.to(id2SocketId[message.toId]).emit('message', message);
        }
        io.to(socket).emit('message_sent', message)
       // //console.log(message.fromId + '对' + message.toId + '说：' + message.content);
    }
}

//发送图片消息
exports.sentVoiceMessage = function (message) {
  //  //console.log('sendVoiceMessage', id2SocketId)
    //更新对话信息
    convService.updateConversation(message.fromId, message.toId, '[语音]').then()
    if (id2SocketId.hasOwnProperty(message.fromId.toString())) {
        let socket = id2SocketId[message.fromId.toString()]
        if (id2SocketId.hasOwnProperty(message.toId.toString())) {
            io.to(id2SocketId[message.toId]).emit('message', message);
        }
        io.to(socket).emit('message_sent', message)
       // //console.log(message.fromId + '对' + message.toId + '说：' + message.content);
    }
}

exports.notifyRelationEvent = function(targetUserId){
    //console.log('通知好友事件')
    if (id2SocketId.hasOwnProperty(targetUserId.toString())) {
        let socket = id2SocketId[targetUserId.toString()]
        io.to(socket).emit('relation_event')
        // //console.log(message.fromId + '对' + message.toId + '说：' + message.content);
    }
}