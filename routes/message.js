const express = require('express');
const router = express.Router();
/**
 * 路由层：用户操作
 */

const service = require('../service/messageService')


/**
 * 查询某一对话的消息记录
 */
router.get('/get', function (req, res) {
    if(req.query.pageNum===undefined){
        req.query.pageNum = 0
    }
    if(req.query.pageSize===undefined){
        req.query.pageSize = 15
    }
    service.getMessages(req.query.conversationId,req.query.pageSize,req.query.pageNum).then((value)=>{
        res.send(value)
    },(err)=>{
        res.send(err)
    })
})

module.exports = router;
