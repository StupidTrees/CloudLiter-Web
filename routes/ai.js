const express = require('express');
const router = express.Router();
const fs = require('fs')
const config = require("../config");
const jsonUtils = require("../utils/jsonUtils");
const {codes} = require("../utils/codes");
const formidable = require("formidable");
/**
 * 路由层：用户操作
 */
router.post('/image/testpost',function (req,res){
    console.log('get post')
    service.testPost().then((value)=>{
        res.send(value)
    },(err)=>{
        console.log(err)
        res.send(err)
    })
})
router.post('/image/classify', function (req, res) {

    const form = new formidable.IncomingForm()
    //设置文件保存的目标路径
    let targetPath = path.join(__dirname, '../') + config.files.cacheDir
    // 如果目录不存在则创建
    if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath, {
        recursive: true
    })

    //设置文件目标路径
    form.uploadDir = targetPath
    // 上传文件大小限制
    form.maxFieldsSize = 20 * 1024 * 1024
    let userId = req.body.authId
    let uuid = req.query.uuid
    //从请求头中读取前端传来的文件files
    form.parse(req, function (err, fields, files) {
        if (err) {
            res.send(jsonUtils.getResponseBody(codes.other_error, err))
        } else {
            service.aiClassify(userId, files).then(
                (value) => {
                    res.send(value)
                }, (err) => {
                    res.send(err)
                }
            )
        }
    })
})
const service = require('../service/aiService')
module.exports = router;