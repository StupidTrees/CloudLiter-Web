const express = require('express');
const router = express.Router();
const fs = require('fs')
/**
 * 路由层：用户操作
 */

const service = require('../service/imageService')

/**
 * 按图片id获取聊天文件
 */
router.get('/get', function (req, res) {
    service.getImageById(req.query.imageId).then(r => {
        res.writeHead(200, "Ok");
        res.write(r, "binary"); //格式必须为 binary，否则会出错
        res.end();
    }).catch(err => {
        res.send(err)
    })
})

/**
 * 返回目标类别图片id(一页)
 */
router.get('/by_class',function (req,res){
    service.getImagesByClass(req.query.authId,req.query.pageSize,req.query.pageNum,req.query.classKey).then(r => {
        res.send(r)
    }).catch(err => {
        res.send(err)
    })
})

/**
 * 返回包含某位好友的所有照片
 */
router.get('/by_friend',function (req,res){
    service.getImagesOfFriend(req.query.authId,req.query.friendId,req.query.pageSize,req.query.pageNum).then(r => {
        res.send(r)
    }).catch(err => {
        res.send(err)
    })
})

/**
 * 根据userId获取图片分类
 */
router.get('/classes', function (req, res) {
    service.getClasses(req.query.authId).then(r => {
        res.send(r)
    }).catch(err => {
        res.send(err)
    })
})

/**
 * 根据userId获取相册里的亲友人脸
 */
router.get('/friend_faces',function (req,res){
    service.getFriendFacesOfUser(req.query.authId).then(r => {
        res.send(r)
    }).catch(err => {
        res.send(err)
    })
})

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

/**
 * 获取某用户的所有人脸
 */
router.get('/get_faces', function (req, res) {
    service.getFacesOfUser(req.query.authId).then(r => {
        res.send(r)
    }).catch(err => {
        res.send(err)
    })
})

router.get("/face",function(req,res){
    service.getFaceImage(req.query.authId,req.query.faceId).then(r=>{
        res.writeHead(200, "Ok");
        res.write(r, "binary"); //格式必须为 binary，否则会出错
        res.end();
    }).catch(err=>{
        res.send(err)
    })
})

router.post("/delete_face",function(req,res){
    service.deleteFace(req.body.authId,req.body.faceId).then(r=>{
        console.log("delete_face",r)
       res.send(r)
    }).catch(err=>{
        console.log("delete_face_err",err)
        res.send(err)
    })
})


router.get("/whitelist",function(req,res){
    service.getWhiteList(req.query.authId).then(r=>{
        res.send(r)
    }).catch(err=>{
        console.log("get_whitelist_err",err)
        res.send(err)
    })
})


router.post("/add_whitelist",function(req,res){
    service.addToWhitelist(req.body.authId,req.body.whitelist).then(r=>{
        res.send(r)
    }).catch(err=>{
        console.log("get_whitelist_err",err)
        res.send(err)
    })
})

router.post("/remove_whitelist",function(req,res){
    service.removeFromWhiteList(req.body.authId,req.body.friendId).then(r=>{
        res.send(r)
    }).catch(err=>{
        res.send(err)
    })
})
module.exports = router;
