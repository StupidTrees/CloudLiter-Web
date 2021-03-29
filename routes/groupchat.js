const express = require('express');
const router = express.Router();
const service = require('../service/groupchatService')
const formidable = require('formidable')
const path = require('path')
const config = require('../config')
const fs = require('fs')

router.post('/create', function (req, res) {
    service.createChat(req.query.authId, req.body.name, req.body.list).then(value => {
        res.send(value)
    }, error => {
        res.send(error)
    })
})

router.get('/members', function (req, res) {
    service.getAllMembers(req.query.groupId).then(value => {
        res.send(value)
    }, error => {
        res.send(error)
    })
})

router.post('/quit', function (req, res) {
    service.quitGroupChat(req.body.authId, req.body.groupId).then(value => {
        res.send(value)
    }, error => {
        res.send(error)
    })
})

router.post('/destroy', function (req, res) {
    service.destroyGroupChat(req.body.authId, req.body.groupId).then(value => {
        res.send(value)
    }, error => {
        res.send(error)
    })
})

router.get('/get', function (req, res) {
    service.getGroupEntity(req.query.groupId).then(value => {
        res.send(value)
    }, error => {
        res.send(error)
    })
})
router.post('/rename', function (req, res) {
    service.changeGroupName(req.body.groupId, req.body.name).then(value => {
        res.send(value)
    }, error => {
        res.send(error)
    })
})

router.post('/quit', function (req, res) {
    service.changeGroupName(req.body.groupId, req.body.name).then(value => {
        res.send(value)
    }, error => {
        res.send(error)
    })
})


/**
 * 上传群组头像
 */
router.post('/upload_avatar', function (req, res) {
    const form = new formidable.IncomingForm()
    try { //设置文件保存的目标路径
        let targetPath = path.join(__dirname, '../') + config.files.avatarDir
        // 如果目录不存在则创建
        if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath, {
            recursive: true
        })
        //设置文件目标路径
        form.uploadDir = targetPath
        // 上传文件大小限制
        form.maxFieldsSize = 20 * 1024 * 1024
        //从请求头中读取前端传来的文件files
        form.parse(req, function (err, fields, files) {
            if (err) {
                res.send({err})
            } else {
                service.uploadGroupAvatar(req.query.groupId, files).then(
                    (value) => {
                        res.send(value)
                    }, (err) => {
                        console.log("upload_avatar", err)
                        res.send(err)
                    }
                )
            }
        })
    } catch (e) {
        console.log(e)
    }
})
module.exports = router;
