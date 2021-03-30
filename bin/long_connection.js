const messageService = require('../service/messageService')
const conversationRepository = require('../repository/conversationRepository')
const textUtils = require('../utils/textUtils')
const relationRepository = require("../repository/userRelationRepository");
const online = require('./online')
let io

exports.initSocket = function (server) {
    io = require('socket.io').listen(server);
    io.on('connection', onConnect)
}

async function removeUserFromConversation(userId, convId) {
    await online.removeUserFromConversation(userId, convId)
    //从朋友的被期待列表中移除自己
    let ids = null
    try {
        ids = await conversationRepository.getConversationUserIds(userId, convId)
        if (ids.length === 1) {
            online.removeUserFromWaitingList(ids[0], userId)
        }
    } catch (e) {
        console.log(e)
    }
}

async function removeUser(key) {
    online.getConversationOfUser(key).then(conversationId => {
        removeUserFromConversation(key, conversationId)
    })
    online.getWaitingListOfUser(key).then(waiting => {
        waiting.forEach(item => {
            online.getSocketForUser(item.userId).then(socket => {
                io.to(socket).emit('query_online_result', item.conversationId, 'OFFLINE')
            })
        })
    })
    online.removeUserSocket(key)
}

async function markOnline(socket, userId) {
    return online.userSocketExist(userId).then((exist) => {
        if (!exist) {
            online.addUserSocket(userId, socket.id)
            //获取未读消息列表
            messageService.countUnreadMessage(userId).then((value) => {
                socket.emit('unread_message', JSON.stringify(value))
                console.log("unread_message", JSON.stringify(value))
            })
            online.getWaitingListOfUser(userId).then(waitingList => {
                waitingList.forEach(item => {
                    online.getSocketForUser(item.userId).then(socket => {
                        io.to(socket).emit('query_online_result', item.conversationId, 'ONLINE')
                    })
                })
            })

        }
    })
}

function onConnect(socket) {
    //console.log('新用户登录');
    //监听新用户加入
    socket.on('login', function (userId) {
        //  let obj = JSON.parse(objStr)
        //console.log("login", userId)
        socket.name = userId
        markOnline(socket, userId).then()
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
    socket.on('into_conversation', async function (userId, conversationId) {
        await markOnline(socket, userId) //确保在线
        //断开用户和原有对话的联系
        await online.getConversationOfUser(userId).then(oldId => {
            removeUserFromConversation(userId, oldId)
        }).catch(e => {
            console.log(e)
        })
        //加入新对话
        online.addUserToConversation(userId, conversationId)
        //将自己加入到朋友的被期待表中
        await conversationRepository.getConversationUserIds(userId, conversationId).then(ids => {
            ids.forEach(host => {
                online.addUserToWaitingList(host, userId, conversationId)
            })
        })
        console.log("用户进入对话窗口")
        //通知正在和他进行对话的好友，他进入了某对话
        online.getWaitingListOfUser(userId).then(waiting => {
            waiting.forEach(d => {
                let mark = textUtils.equals(conversationId, d.conversationId) ? 'YOU' : 'OTHER'
                online.getSocketForUser(d.userId).then(socket => {
                    io.to(socket).emit('query_online_result', d.conversationId, mark)
                })
            })
        })
    })

    //某用户退出某对话
    socket.on('left_conversation', async function (userId, conversationId) {
        console.log("用户退出对话窗口")
        await removeUserFromConversation(userId, conversationId)
        //通知正在和他进行对话的好友，他退出某对话
        online.getWaitingListOfUser(userId).then(waiting => {
            waiting.forEach(d => {
                online.getSocketForUser(d.userId).then(socket => {
                    io.to(socket).emit('query_online_result', d.conversationId, 'ONLINE')
                })
            })
        })
    })

    //标记某对话下的消息全部已读
    socket.on('mark_all_read', async function (chatType, userId, convId, topTime) {
        //console.log('标记全部已读', chatType + "," + userId + "," + convId + "," + topTime)
        await markOnline(socket, userId)//保持在线
        if (userId == null || convId == null || topTime == null) {
            return;
        }
        let res = await messageService.markAllRead(chatType, userId, convId, topTime)
        //通知处于对话框对方，他读了一堆消息
        conversationRepository.getConversationUserIds(userId, convId).then((ids) => {
            for (let i = 0; i < ids.length; i++) {
                online.getSocketForUser(ids[i]).then(socket => {
                    //console.log('通知全部已读',socket + "," + JSON.stringify(res))
                    io.to(socket).emit('friend_read_all', userId, convId, topTime, JSON.stringify(res))
                })
            }
        })

    })

    //标记某消息已读
    socket.on('mark_read', async function (chatType, userId, convId, messageId) {
        await markOnline(socket, userId)//保持在线
        //console.log('标记已读',userId + "," + convId + "," + messageId)
        if (userId == null || convId == null || messageId == null) {
            return;
        }
        let res = await messageService.markRead(chatType, userId, messageId)
        //通知处于对话框的对方，他读了一条消息
        conversationRepository.getConversationUserIds(userId, convId).then((ids) => {
            for (let i = 0; i < ids.length; i++) {
                online.getSocketForUser(ids[i]).then(socket => {
                   // console.log('通知已读',socket + "," + JSON.stringify(res))
                    io.to(socket).emit('friend_read_one', userId, convId, messageId, JSON.stringify(res))
                })
            }
        })


    })

    //获取某对话的在线情况
    socket.on('query_online', async function (userId, conversationId) {
        await markOnline(socket, userId)//保持在线
        conversationRepository.getConversationUserIds(userId, conversationId).then((ids) => {
                if (ids.length === 1) {
                    let friendId = ids[0]
                    online.userSocketExist(friendId).then(exist => {
                            let mark = exist ? 'ONLINE' : 'OFFLINE'
                            online.getConversationOfUser(friendId).then(friendConversation => {
                                if (friendConversation === conversationId) {
                                    mark = 'YOU'
                                } else {
                                    mark = 'OTHER'
                                }
                                socket.emit('query_online_result', conversationId, mark)
                            }, err => {
                                socket.emit('query_online_result', conversationId, mark)
                            })
                        }
                    )
                }
            }
        )

    })

}


exports.broadcastMessageSent = async function (userId, conversationId, message) {
    let listeners = await conversationRepository.getConversationUserIds(userId, conversationId)
    for (let i = 0; i < listeners.length; i++) {
        let toId = listeners[i]
        online.getSocketForUser(toId.toString()).then(socket => {
            messageService.queryMessageSenderName(toId, userId).then(name => {
                message.friendRemark = name
                io.to(socket).emit('message', message);
            })
        })
    }
}


exports.notifyRelationEvent = function (targetUserId) {
    //console.log('通知好友事件')
    online.getSocketForUser(targetUserId.toString()).then(socket => {
        io.to(socket).emit('relation_event')
    })
}