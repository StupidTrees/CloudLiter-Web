const express = require('express');
const router = express.Router();

/**
 * 路由层：用户操作
 */

const service = require('../service/conversationService')


/**
 * 查询某一用户的所有对话
 */
router.get('/get', function (req, res, next) {
    let queryId = req.query.authId
    if(req.query.id!==undefined){
        queryId = req.query.id
    }
    service.getConversations(queryId).then((value)=>{
        res.send(value)
    },(err)=>{
        res.send(err)
    })
})

/**
 * 根据id查询某一对话的详情
 */
router.get('/query', function (req, res, next) {
    let myId = req.query.authId
    if(req.query.userId!==undefined){
        myId = req.query.userId
    }
    service.getConversationById(myId,req.query.friendId).then((value)=>{
        res.send(value)
    },(err)=>{
        res.send(err)
    })
})

module.exports = router;
