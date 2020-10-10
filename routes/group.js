const express = require('express')
const router = express.Router()

const service = require('../service/groupService')

router.post('/add',function(req,res){
    let queryId = req.body.authId
    if(req.body.userId!==undefined){
        queryId = req.body.userId
    }
 //   let qureyGroupName
   // if(req.body.groupName!=undefined)
   // {
       let qureyGroupName = req.body.groupName
   // }
    service.createGroup(queryId,qureyGroupName).then((value)=>{
        res.send(value)
    }).catch(err=>{
        res.send(err)
    })
})
router.post('/assign',function(req,res){
    let queryId
    if(req.body.userId!==undefined){
        queryId = req.body.userId
    }
    //let qureyFriendId
  //  if(req.body.friendId!=undefined)
  //  {
        let qureyFriendId = req.body.friendId
 //   }
   //let qureyGroupId
   // if(req.body.groupId!=undefined)
  //  {
       let qureyGroupId = req.body.groupId
  //  }
    service.createGroup(queryId,qureyFriendId,qureyGroupId).then((value)=>{
        res.send(value)
    }).catch(err=>{
        res.send(err)
    })
})
router.post('/delete',function(req,res){
    let queryGroupId
    if(req.body.groupId!==undefined){
        queryGroupId = req.body.GroupId
    }

    service.deleteGroup(queryGroupId).then((value)=>{
        res.send(value)
    }).catch(err=>{
        res.send(err)
    })
})
router.post('/get',function(req,res){
    let queryUserId
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