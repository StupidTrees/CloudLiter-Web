const express = require('express');
const router = express.Router();
const formidable = require('formidable')
const path = require('path')
const config = require('../config')
const fs = require('fs')
/**
 * 路由层：用户操作
 */

const service = require('../service/userService')
const wordCloudService = require("../service/wordCloudService");


/**
 * 用户注册
 */
router.post('/sign_up', function (req, res) {
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
router.post('/login', function (req, res) {
    const body = req.body
    service.userLogin(body.username, body.password).then(
        (value) => {
           return res.send(value)
        }).catch(err => {
            console.log("error",err)
            return res.send(err)
        })
})

/**
 * 用户基本信息获取
 */
router.get('/profile/get', (req, res) => {

    let queryId = req.query.authId
    if(req.query.id!==undefined){
        queryId = req.query.id
    }
    console.log("fetch_profile",queryId)
    service.fetchBaseProfile(queryId).then((value) => {
        console.log(value)
        res.send(value)
    },error => {
        console.log(error)
    }).catch((err) => {
        console.log(err)
        res.send(err)
    })
})


/**
 * 搜索用户
 */
router.get('/search', (req, res, next) => {

    service.searchUser(req.query.text).then((value) => {
        res.send(value)
    }).catch((err) => {
        res.send(err)
    })
})

/**
 * 更改昵称
 */
router.post('/profile/change_nickname',function(req,res){
    let queryId = req.body.authId
    if(req.body.id!==undefined){
        queryId = req.body.id
    }
    service.changeNickname(queryId,req.body.nickname).then((value)=>{
        res.send(value)
    }).catch(err=>{
        res.send(err)
    })
})

/**
 * 修改签名
 */
router.post('/profile/change_signature',function(req,res){
    let queryId = req.body.authId
    if(req.body.id!==undefined){
        queryId = req.body.id
    }
    service.changeSignature(queryId,req.body.signature).then((value)=>{
        res.send(value)
    },(err)=>{
        res.send(err)
    })
})


/**
 * 更改性别
 */
router.post('/profile/change_gender',function(req,res){
    let queryId = req.body.authId
    if(req.body.id!==undefined){
        queryId = req.body.id
    }
    service.changeGender(queryId,req.body.gender).then((value)=>{
        res.send(value)
    }).catch(err=>{
        res.send(err)
    })
})


/**
 * 更改无障碍用户类型
 */
router.post('/profile/change_accessibility',function(req,res){
    let queryId = req.body.authId
    if(req.body.id!==undefined){
        queryId = req.body.id
    }
    service.changeAccessibilityType(queryId,req.body.accessibility).then((value)=>{
        res.send(value)
    }).catch(err=>{
        res.send(err)
    })
})

/**
 * 修改词云可访问性
 */
router.post('/profile/word_cloud_private',function(req,res){
    let queryId = req.body.authId
    if(req.body.id!==undefined){
        queryId = req.body.id
    }
    service.changeWordCloudAccessibility(queryId,req.body.private).then((value)=>{
        res.send(value)
    }).catch(err=>{
        console.log(err)
        res.send(err)
    })
})


/**
 * 上传头像
 */
router.post('/profile/upload_avatar',function (req, res) {
    const form = new formidable.IncomingForm()
    //设置文件保存的目标路径
    let targetPath = path.join(__dirname, '../')+config.files.avatarDir
    // 如果目录不存在则创建
    if (!fs.existsSync(targetPath))fs.mkdirSync(targetPath,{
        recursive:true
    })
    //设置文件目标路径
    form.uploadDir = targetPath
    // 上传文件大小限制
    form.maxFieldsSize = 20 * 1024 * 1024
    let userId = req.body.authId
    //从请求头中读取前端传来的文件files
    form.parse(req, function (err, fields, files) {
        if (err) {
            res.send({ err })
        } else {
            service.uploadAvatar(userId, files).then(
                (value)=>{
                    res.send(value)
                },(err)=>{
                    res.send(err)
                }
            )
        }
    })
})

/**
 * 按用户id查询头像
 */
router.get('/profile/query_avatar',function (req,res){
    service.queryAvatar(req.query.id).then(r => {
        res.writeHead(200, "Ok");
        res.write(r,"binary"); //格式必须为 binary，否则会出错
        res.end();
    }).catch((err)=>{
        res.send(err)
    })
})


/**
 * 获取用户词云
 */
router.get('/profile/word_cloud',function (req,res){
    let queryId = req.query.authId
    wordCloudService.getWordCloud('USER',queryId,req.query.userId).then(r=>{
        res.send(r)
    }).catch((err)=>{
        res.send(err)
    })
})


/**
 * 按文件名直接获取头像
 */
router.get('/profile/avatar',function (req,res){
    service.getAvatar(req.query.path).then(r => {
        res.writeHead(200, "Ok");
        res.write(r,"binary"); //格式必须为 binary，否则会出错
        res.end();
    }).catch(err=>{
        res.send(err)
    })
})

/**
 * 按词云查找用户
 */
router.get('/search/word_cloud',function (req,res){
    let queryId = req.query.authId
    service.searchUserByWordCloud(queryId,req.query.word).then(r => {
        res.send(r)
    }).catch(err=>{
        res.send(err)
    })
})

/**
 * 用户类型修改
 */
router.post('/profile/change_type',function (req,res){
    let queryId = req.body.authId
    service.changUserType(queryId,req.body.type,req.body.subType,req.body.typePermission).then(r => {
        res.send(r)
    }).catch(err=>{
        res.send(err)
    })
})

module.exports = router;
