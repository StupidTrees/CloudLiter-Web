
//记录用户id和socketId转换表
const id2SocketId = {}
//记录用户和其正在进行对话
const user2Conversation = {}
//记录用户正在被期待的对话
const waitingList = {}

exports.addUserSocket = function (userId,socketId){
    id2SocketId[userId] = socketId
}

exports.removeUserSocket = function (userId){
    if(id2SocketId.hasOwnProperty(userId)){
        delete id2SocketId[userId]
    }
}
exports.userSocketExist = async function (userId){
    return Promise.resolve(id2SocketId.hasOwnProperty(userId))
}

exports.getSocketForUser = async function(userId){
    if(id2SocketId.hasOwnProperty(userId))return Promise.resolve(id2SocketId[userId])
    else return Promise.reject()
}

exports.addUserToConversation = function (userId,conversationId){
    user2Conversation[userId] = conversationId
}

exports.removeUserFromConversation = async function(userId,conversationId){
    if (user2Conversation[userId] === conversationId) {
        delete user2Conversation[userId]
    }
}

exports.getConversationOfUser = async function(userId){
    if(user2Conversation.hasOwnProperty(userId)) return Promise.resolve(user2Conversation[userId])
    else return Promise.reject()
}

exports.addUserToWaitingList = function (hostId,userId,conversationId){
    if(!waitingList.hasOwnProperty(hostId)){
        waitingList[hostId] = {}
    }
    waitingList[hostId][userId] = conversationId
}

exports.removeUserFromWaitingList = function (hostId,userId){
    if(!waitingList.hasOwnProperty(hostId)){
        waitingList[hostId] = {}
    }
    if(waitingList[hostId].hasOwnProperty(userId)){
        delete waitingList[hostId][userId]
    }
}

exports.getWaitingListOfUser = async function (hostId){
    if(!waitingList.hasOwnProperty(hostId)){
        waitingList[hostId] = {}
    }
    let res = []
    for(let x in waitingList[hostId]){
        res.push({
            userId:x,
            conversationId:waitingList[hostId][x]
        })
    }
    return Promise.resolve(res)
}

