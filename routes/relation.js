const express = require('express');
const router = express.Router();
/**
 * 路由层：用户操作
 */

const service = require('../service/relationService')


/**
 * 查询某一用户的所有好友
 */
router.get('/friends', function (req, res, next) {
    let queryId = req.query.authId
    if(req.query.id!==undefined){
        queryId = req.query.id
    }
    service.getFriends(queryId).then((value)=>{
        res.send(value)
    },(err)=>{
        res.send(err)
    })
})

/**
 * 建立好友关系
 */
router.post('/make_friends',function (req, res, next) {
    let queryId = req.body.authId
    if(req.body.id!==undefined){
        queryId = req.body.id
    }
    service.makeFriends(queryId,req.body.friend).then((value)=>{
        res.send(value)
    }).catch(err=>{
        res.send(err)
    })
})

/**
 * 判断是否是好友
 */
router.get('/is_friend',function (req, res) {
    let queryId = req.query.authId
    if(req.query.id1!==undefined){
        queryId = req.query.id1
    }
    service.isFriend(queryId,req.query.id2).then((value)=>{
        res.send(value)
    },(err)=>{
        res.send(err)
    })
})

module.exports = router;
