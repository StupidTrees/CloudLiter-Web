const express = require('express');
const router = express.Router();

const service = require('../service/relationEventService')

/**
 * 申请好友
 */
router.post('/event/request',function (req,res){
    let queryId = req.body.authId
    if(req.body.id !== undefined){
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
    service.resFriendApply(req.body.eventId,req.body.action).then((value)=>{
        res.send(value)
    }).catch((err)=>{
        res.send(err)
    })
})


module.exports = router