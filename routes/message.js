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
    if(req.query.pageSize===undefined){
        req.query.pageSize = 15
    }
    let fromId = (req.query.fromId===undefined||req.query.fromId==null||equals(req.query.fromId,'null'))
        ?null:req.query.fromId
    console.log("fromId",fromId)
    service.queryHistoryMessage(req.query.conversationId,fromId,req.query.pageSize).then((value)=>{
        //console.log("value",value)
        res.send(value)
    },(err)=>{
        console.log('err',err)
        res.send(err)
    })
})

/**
 * 拉取某一对话的最新消息
 */
router.get('/pull_latest', function (req, res) {
    let afterId = req.query.afterId===undefined?null:req.query.afterId
    service.pullLatestMessage(req.query.conversationId,afterId).then((value)=>{
        res.send(value)
    },(err)=>{
        console.log('err',err)
        res.send(err)
    })
})

const sensitive = require('../service/ShieldingService')
const {equals} = require("../utils/textUtils");
router.get('/detective',function (req,res) {
    res.send(sensitive.checkSensitive(req.query.sentence))
})
module.exports = router;
