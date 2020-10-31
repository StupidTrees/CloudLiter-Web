const express = require('express')
const router = express.Router()

const service = require('../service/groupService')

router.post('/add',function(req,res){
    let queryId = req.body.authId
    if(req.body.userId!==undefined){
        queryId = req.body.userId
    }
    let queryGroupName = req.body.groupName
    service.createGroup(queryId,queryGroupName).then((value)=>{
        console.log(value)
        res.send(value)
    }).catch(err=>{
        console.log(err)
        res.send(err)
    })
})
router.post('/assign',function(req,res){
    let queryId = req.body.authId
    if(req.body.userId!==undefined){
        queryId = req.body.userId
    }
    let qureyFriendId = req.body.friendId
    let qureyGroupId = req.body.groupId
    service.setGroupNum(queryId,qureyFriendId,qureyGroupId).then((value)=>{
        res.send(value)
    }).catch(err=>{
        res.send(err)
    })
})
router.post('/delete',function(req,res){
    let queryGroupId = req.body.groupId
    service.deleteGroup(queryGroupId).then((value)=>{
        res.send(value)
    }).catch(err=>{
        res.send(err)
    })
})
router.get('/get',function(req,res){
    let queryUserId = req.body.authId
    if(req.body.userId!==undefined){
        queryUserId = req.body.userId
    }
    service.findAllGroup(queryUserId).then((value)=>{
        res.send(value)
    }).catch(err=>{
        res.send(err)
    })
})
module.exports=router