const express = require('express');
const router = express.Router();
const fs = require('fs')
const service = require('../service/messageService')

/**
 * 查询某一对话的消息记录
 */
router.get('/get', function (req, res) {
    if (req.query.pageSize === undefined) {
        req.query.pageSize = 15
    }
    let fromId = (req.query.fromId === undefined || req.query.fromId == null || equals(req.query.fromId, 'null'))
        ? null : req.query.fromId
    console.log("fromId", fromId)
    service.queryHistoryMessage(req.query.authId, req.query.conversationId, fromId, req.query.pageSize).then((value) => {
        //console.log("value",value)
        res.send(value)
    }, (err) => {
        console.log('err', err)
        res.send(err)
    })
})

/**
 * 查询某一消息的已读用户
 */
router.get('/read_user', function (req, res) {
    service.queryReadUser(req.query.authId, req.query.messageId, req.query.conversationId, req.query.read).then((value) => {
        //console.log("value", value)
        res.send(value)
    }, (err) => {
        console.log('err', err)
        res.send(err)
    })
})

/**
 * 拉取某一对话的最新消息
 */
router.get('/get_message_after', function (req, res) {
    let afterId = (req.query.afterId === undefined || req.query.afterId == null || equals(req.query.afterId, 'null'))
        ? null : req.query.afterId
    service.getMessagesAfter(req.query.authId, req.query.conversationId, afterId, req.query.includeBound).then((value) => {
        res.send(value)
    }, (err) => {
        console.log('err', err)
        res.send(err)
    })
})

/**
 * 发送文本消息
 */
router.post('/send_text', function (req, res) {
    service.sendTextMessage(req.body.fromId, req.body.conversationId, req.body.content, req.body.uuid).then((value) => {
        console.log('send_text', value)
        res.send(value)
    }).catch((err) => {
        console.log('err', err)
        res.send(err)
    })
})

/**
 * 发送图片消息
 * toId在Param中
 */
router.post('/send_image', function (req, res) {
    const form = new formidable.IncomingForm()
    //设置文件保存的目标路径
    let targetPath = path.join(__dirname, '../') + config.files.chatImageDir
    // 如果目录不存在则创建
    if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath, {
        recursive: true
    })
    //设置文件目标路径
    form.uploadDir = targetPath
    // 上传文件大小限制
    form.maxFieldsSize = 20 * 1024 * 1024
    let userId = req.body.authId
    let conversationId = req.query.conversationId
    let uuid = req.query.uuid
    //从请求头中读取前端传来的文件files
    form.parse(req, function (err, fields, files) {
        if (err) {
            res.send(jsonUtils.getResponseBody(codes.other_error, err))
        } else {
            service.sendImageMessage(userId, conversationId, files, uuid).then(
                (value) => {
                    res.send(value)
                }, (err) => {
                    res.send(err)
                }
            )
        }
    })
})


/**
 * 发送语音消息
 * toId在Param中
 */
router.post('/send_voice', function (req, res) {
    const form = new formidable.IncomingForm()
    //设置文件保存的目标路径
    let targetPath = path.join(__dirname, '../') + config.files.chatVoiceDir
    // 如果目录不存在则创建
    if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath, {
        recursive: true
    })
    //设置文件目标路径
    form.uploadDir = targetPath
    // 上传文件大小限制
    form.maxFieldsSize = 20 * 1024 * 1024
    let userId = req.body.authId
    let conversationId = req.query.conversationId
    let uuid = req.query.uuid
    let length = req.query.seconds
    //从请求头中读取前端传来的文件files
    form.parse(req, function (err, fields, files) {
        if (err) {
            res.send(jsonUtils.getResponseBody(codes.other_error, err))
        } else {
            service.sendVoiceMessage(userId, conversationId, files, uuid, length).then(
                (value) => {
                    res.send(value)
                }, (err) => {
                    res.send(err)
                }
            )
        }
    })
})


/**
 * 按文件名直接获取语音文件
 */
router.get('/voice', function (req, res) {
    service.getChatVoiceMessage(req.query.path).then(r => {
        res.writeHead(200, "Ok");
        res.write(r, "binary"); //格式必须为 binary，否则会出错
        res.end();
    }).catch(err => {
        res.send(err)
    })
})


const formidable = require("formidable");
const jsonUtils = require("../utils/jsonUtils");
const config = require("../config");
const {codes} = require("../utils/codes");
const {equals} = require("../utils/textUtils");
module.exports = router;
