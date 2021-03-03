const express = require('express');
const router = express.Router();
const fs = require('fs')
/**
 * 路由层：用户操作
 */

const service = require('../service/imageService')


/**
 * 按图片id获取图片对象
 */
router.get('/get_entity', function (req, res) {
    service.getImageEntityById(req.query.imageId).then(r => {
        res.send(r)
    }).catch(err => {
        res.send(err)
    })
})

module.exports = router;
