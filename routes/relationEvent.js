const express = require('express');
const router = express.Router();

const service = require('../service/relationEventService')

/**
 * 申请好友
 */
router.post('/event/request',function (req,res){
    let queryId = req.body.authId
    if(req.body.userId !== undefined){
        queryId = req.body.userId
    }
    service.applyFriend(queryId,req.body.friendId).then((value)=>{
        res.send(value)
    }).catch((err)=>{
        res.send(err)
    })
})

/**
 * 处理好友申请
 */
router.post('/event/response',function (req,res){
    service.responseFriendApply(req.body.eventId,req.body.action).then((value)=>{
        res.send(value)
    }).catch((err)=>{
        res.send(err)
    })
})

// /**
//  * NFC好友，action:ACCEPT,REJECT
//  */
// router.post('/event/direct_friends',function(req,res){
//     let queryId = req.body.authId
//     if(req.body.id!==undefined){
//         queryId = req.body.userId
//     }
//     service.directFriends(queryId,req.body.friendId,req.body.action).then((value)=>{
//         res.send(value)
//     }).catch(err=>{
//         res.send(err)
//     })
// })

// /**
//  * 查询好友请求
//  */
// router.get('/event/query_unread',function (req,res){
//     let queryId = req.query.authId
//     if(req.query.userId !== undefined){
//         queryId = req.query.userId
//     }
//     service.getUnread(queryId).then(value => {
//         res.send(value)
//     }).catch(err=>{
//         res.send(err)
//     })
// })

/**
 * 对未读好友事件计数
 */
router.get('/event/count_unread',function (req,res){
    let queryId = req.query.authId
    if(req.query.userId !== undefined){
        queryId = req.query.userId
    }
    service.countUnread(queryId).then(value => {
        res.send(value)
    }).catch(err=>{
        res.send(err)
    })
})

/**
 * 查询用户相关的所有好友申请事件
 */
router.get('/event/query_mine',function (req,res){
    let queryId = req.query.authId
    if(req.query.userId !== undefined){
        queryId = req.query.userId
    }
    service.getMine(queryId).then(value => {
        res.send(value)
    }).catch(err=>{
        res.send(err)
    })
})


/**
 * 标记所有好友事件已读
 */
router.post('/event/mark_read',function (req,res){
    let queryId = req.body.authId
    if(req.body.userId !== undefined){
        queryId = req.body.userId
    }
    service.markRead(queryId).then(value => {
        res.send(value)
    }).catch(err=>{
        res.send(err)
    })
})


/**
 * 删除好友
 */
router.post('/event/delete_friend',function (req,res){
    let queryId = req.body.authId
    if(req.body.userId!==undefined){
        queryId = req.body.userId
    }
    service.deleteFriend(queryId,req.body.friendId).then(value => {
        res.send(value)
    }).catch(err=>{
        console.log(err);
        res.send(err)
    })
})



module.exports = router