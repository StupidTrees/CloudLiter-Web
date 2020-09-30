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

module.exports = router;
