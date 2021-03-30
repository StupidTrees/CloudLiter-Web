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
        //console.log(value)
        res.send(value)
    },(err)=>{
        console.log(err)
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
/**
 * 添加好友备注
 */
router.post('/friend_remark',function (req,res){
    let queryId = req.body.authId
    if(req.body.id1!==undefined){
        queryId = req.body.id1
    }
    service.friendRemark(queryId,req.body.id2,req.body.remark).then((value)=>{
        res.send(value)
    },(err)=>{
        res.send(err)
    })
})


/**
 * 查询关系对象
 */
router.get('/query',function(req,res){
    let queryId = req.query.authId
    if(req.query.userId!==undefined){
        queryId = req.query.userId
    }
    service.queryRelation(queryId,req.query.friendId).then((value )=>{
        res.send(value)
    },(err)=>{
        console.log(err)
        res.send(err)
    })
})
module.exports = router;
