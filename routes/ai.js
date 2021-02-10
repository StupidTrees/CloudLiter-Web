const express = require('express');
const router = express.Router();
const fs = require('fs')
const config = require("../config");
const jsonUtils = require("../utils/jsonUtils");
const {codes} = require("../utils/codes");
const formidable = require("formidable");

router.post('/image/classify', function (req, res) {
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
            service.aiClassify(files).then(
                (value) => {
                    console.log("success",value)
                    res.send(value)
                }).catch(err => {
                    console.log("err_route",err)
                    res.send(err)
                }
            )
        }
    })
})
const service = require('../service/aiService')
module.exports = router;