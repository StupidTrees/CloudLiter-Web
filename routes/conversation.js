const express = require('express');
const router = express.Router();

/**
 * 路由层：用户操作
 */

const service = require('../service/conversationService')
const wordCloudService = require("../service/wordCloudService");


/**
 * 查询某一用户的所有对话
 */
router.get('/get', function (req, res, next) {
    let queryId = req.query.authId
    if (req.query.id !== undefined) {
        queryId = req.query.id
    }
    service.getConversations(queryId).then((value) => {
        res.send(value)
    }, (err) => {
        console.log(err)
        res.send(err)
    })
})

/**
 * 根据id查询某一对话的详情
 */
router.get('/query', function (req, res, next) {
    service.getConversationById(req.query.authId, req.query.conversationId).then((value) => {
        res.send(value)
    }, (err) => {
        res.send(err)
    })
})

router.get('/word_cloud', function (req, res) {
    wordCloudService.getWordCloud(req.query.authId, 'CONV', req.query.conversationId).then((value) => {
        res.send(value)
    }, (err) => {
        res.send(err)
    })
})

router.post('/delete_wordcloud', function (req, res) {
    wordCloudService.delWordCloud(req.body.wordId, req.body.cloudId).then(value => {
        res.send(value)
    }, error => {
        res.send(error)
    })
})

router.post('/set_whiteid', function (req, res) {
    servicsetWhiteId(req.body.authId, req.body.whiteId).then(value => {
        res.send(value)
    }, error => {
        res.send(error)
    })
})
module.exports = router;
