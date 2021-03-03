const express = require('express');
const router = express.Router();
const fs = require('fs')
const config = require("../config");
const jsonUtils = require("../utils/jsonUtils");
const {codes} = require("../utils/codes");
const formidable = require("formidable");

/**
 * 语音直接转文字
 */
router.post('/voice/dirtts', function (req, res) {
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
    let toId = req.query.toId
    let uuid = req.query.uuid
    let extra = req.query.seconds
    console.log('extra', extra)
    //从请求头中读取前端传来的文件files
    form.parse(req, function (err, fields, files) {
        if (err) {
            res.send(jsonUtils.getResponseBody(codes.other_error, err))
        } else {
            service.dirTTS(files).then(
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
 * 语音记录转文字
 */
router.post('/voice/tts', function (req, res) {
    service.voiceToWords(req.body.id).then(value => {
        res.send(value)
    }, error => {
        console.log("error:" + JSON.stringify(error))
        res.send(error)
    })
})

/**
 * 图像识别（直接上传文件）
 */
router.post('/image/classify_dir', function (req, res) {
    const form = new formidable.IncomingForm()
    //设置文件保存的目标路径
    let targetPath = path.join(__dirname, '../') + config.files.cacheDir
    // 如果目录不存在则创建
    if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath, {
        recursive: true
    })
    form.uploadDir = targetPath
    form.maxFieldsSize = 20 * 1024 * 1024
    form.parse(req, function (err, fields, files) {
        if (err) {
            res.send(jsonUtils.getResponseBody(codes.other_error, err))
        } else {
            // service.imageClassify(files).then(
            //     (value) => {
            //         console.log("success", value)
            //         res.send(value)
            //     }).catch(err => {
            //         console.log("err_route", err)
            //         res.send(err)
            //     }
            // )
        }
    })
})


/**
 * 图像识别（直接对某个聊天文件）
 */
router.post('/image/classify', function (req, res) {
    service.imageClassify(req.body.imageId).then(value => {
        res.send(value)
    }, error => {
        res.send(error)
    })
})


const service = require('../service/aiService')
module.exports = router;