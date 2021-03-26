const messageService = require('../service/messageService')
const conversationRepository = require('../repository/conversationRepository')
const textUtils = require('../utils/textUtils')
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

async function removeUserFromConversation(userId, convId) {
    if (user2Conversation[userId] === convId) {
        delete user2Conversation[userId]
    }
    //从朋友的被期待列表中移除自己
    let ids = null
    try{
        ids = await conversationRepository.getConversationUserIds(userId, convId)
        for(let i=0;i<ids.length;i++){
            let friendId = ids[i]
            if (userExpectedConversation.hasOwnProperty(friendId)) {
                let users = userExpectedConversation[friendId]
                userExpectedConversation[friendId].splice(users.indexOf(userId), 1)
            }
        }
    }catch (e){
        console.log(e)
    }

}

async function removeUser(key) {
    if (user2Conversation.hasOwnProperty(key)) {
        await removeUserFromConversation(key, user2Conversation[key])
    }
    if (userExpectedConversation.hasOwnProperty(key)) {
        //通知正在和他进行对话的好友，他下了
        console.log("removeUser",key)
        userExpectedConversation[key].forEach(item => {
            io.to(id2SocketId[item]).emit('query_online_result', key, 'OFFLINE')
        })
    }
    if (id2SocketId.hasOwnProperty(key)) {
        delete id2SocketId[key]
    }
}

function markOnline(socket, userId) {
    if (!id2SocketId.hasOwnProperty(userId)) {
        id2SocketId[userId] = socket.id
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
        removeUser(userId).then()
    })
    //监听用户退出
    socket.on('disconnect', function () {
        //将退出用户在在线列表删除
        let key = socket.name
        removeUser(key).then()
    })

    //某用户进入某对话
    socket.on('into_conversation', async function (userId, friendId, conversationId) {
        markOnline(socket, userId) //确保在线
        if (user2Conversation.hasOwnProperty(userId)) {
            //断开用户和原有对话的联系
            await removeUserFromConversation(userId, user2Conversation[userId])
            //console.log("断开用户和原有对话的联系")
        }
        user2Conversation[userId] = conversationId
        //将自己加入到朋友的被期待表中
        if (!userExpectedConversation.hasOwnProperty(friendId)) {
            userExpectedConversation[friendId] = []
        }
        userExpectedConversation[friendId].push(userId)
        console.log("用户进入对话窗口", userExpectedConversation)

        //通知正在和他进行对话的好友，他进入了某对话
        if (userExpectedConversation.hasOwnProperty(userId)) {
            userExpectedConversation[userId].forEach(item => {
                console.log('通知进入对话', userId + "->" + id2SocketId[item])
                let mark = textUtils.equals(friendId, item) ? 'YOU' : 'OTHER'
                io.to(id2SocketId[item]).emit('query_online_result', userId, mark)
            })
        }
    })

    //某用户退出某对话
    socket.on('left_conversation', async function (userId, conversationId) {
        console.log("用户退出对话窗口", userExpectedConversation)
        await removeUserFromConversation(userId, conversationId)

        //通知正在和他进行对话的好友，他退出某对话
        if (userExpectedConversation.hasOwnProperty(userId)) {
            userExpectedConversation[userId].forEach(item => {
                console.log('通知退出对话', userId + "->" + id2SocketId[item])
                io.to(id2SocketId[item]).emit('query_online_result', userId, 'ONLINE')
            })
        }
    })

    //标记某对话下的消息全部已读
    socket.on('mark_all_read', function (userId, convId, topTime) {
        //console.log('标记全部已读', userId + "," + convId + "," + topTime)
        markOnline(socket, userId)//保持在线
        if (userId == null || convId == null || topTime == null) {
            return;
        }
        messageService.markAllRead(userId, convId, topTime).then()
        //通知处于对话框对方，他读了一堆消息
        conversationRepository.getConversationUserIds(userId, convId).then((ids) => {
            ids.forEach((friendId) => {
                if (userExpectedConversation.hasOwnProperty(friendId)) {
                    //console.log('通知已读全部消息', userId + "->" + id2SocketId[getTheOtherId(userId, convId)])
                    io.to(id2SocketId[friendId]).emit('friend_read_all', userId, convId, topTime)
                }
            })
        })

    })

    //标记某消息已读
    socket.on('mark_read', function (userId, convId, messageId) {
        markOnline(socket, userId)//保持在线
        //console.log('标记已读',userId + "," + convId + "," + messageId)
        if (userId == null || convId == null || messageId == null) {
            return;
        }
        messageService.markRead(messageId).then()
        //通知处于对话框的对方，他读了一条消息
        conversationRepository.getConversationUserIds(userId, convId).then((ids) => {
            ids.forEach((friendId) => {
                if (userExpectedConversation.hasOwnProperty(friendId)) {
                    //console.log('通知已读某条消息', userId + "->" + id2SocketId[getTheOtherId(userId, convId)])
                    io.to(id2SocketId[friendId]).emit('friend_read_one', userId, convId, messageId)
                }
            })
        })


    })

    //获取某好友是否在线
    socket.on('query_online', function (userId, friendId) {
        markOnline(socket, userId)//保持在线
        let mark = id2SocketId.hasOwnProperty(friendId) ? 'ONLINE' : 'OFFLINE'
        if (user2Conversation.hasOwnProperty(friendId)) {
            conversationRepository.getConversationUserIds(friendId, user2Conversation[friendId]).then((ids) => {
                let contains = false
                for(let i=0;i<ids.length;i++){
                    if (ids[i].toString() === userId.toString()) {
                        contains = true
                        break
                    }
                }
                if (contains) {
                    mark = 'YOU'
                } else {
                    mark = 'OTHER'
                }
                socket.emit('query_online_result', friendId, mark)
            })
        } else {
            socket.emit('query_online_result', friendId, mark)
        }

    })

}


exports.broadcastMessageSent = function (message) {
    //更新对话信息
    if (id2SocketId.hasOwnProperty(message.fromId.toString())) {
        if (id2SocketId.hasOwnProperty(message.toId.toString())) {
            io.to(id2SocketId[message.toId]).emit('message', message);
        }
    }
}


exports.notifyRelationEvent = function (targetUserId) {
    //console.log('通知好友事件')
    if (id2SocketId.hasOwnProperty(targetUserId.toString())) {
        let socket = id2SocketId[targetUserId.toString()]
        io.to(socket).emit('relation_event')
        // //console.log(message.fromId + '对' + message.toId + '说：' + message.content);
    }
}