const express = require('express');
const router = express.Router();
/**
 * 路由层：用户操作
 */

const service = require('../service/userService')


/**
 * 用户注册
 */
router.post('/sign_up', function (req, res, next) {
    const body = req.body;
    service.userSignUp(body.username, body.password, body.gender, body.nickname).then(function (r) {
        res.send(r)
    }).catch((err) => {
        res.send(err)
    })
})

/**
 * 用户登录
 */
router.post('/login', function (req, res, next) {
    const body = req.body
    service.userLogin(body.username, body.password).then(
        (value) => {
           return res.send(value)
        }, (err) => {
            console.log("error",err)
            return res.send(err)
        })
})

/**
 * 用户基本信息获取
 */
router.get('/profile/get', (req, res, next) => {

    service.fetchBaseProfile(req.query.id).then((value) => {
        res.send(value)
    }).catch((err) => {
        res.send(err)
    })
})

module.exports = router;
