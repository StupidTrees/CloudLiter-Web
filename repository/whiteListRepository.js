const {where} = require('sequelize')
const models = require('../database/models')
const codes = require('../utils/codes').codes
const Op = models.Op
const tools = require('../utils/tools')
const sequelize = require('sequelize');
const TextUtils = require("../utils/textUtils");
//const sequelize = new Sequelize('sqlite::memory:');
/**
 * 仓库层：用户关系数据读写
 * 操作和云图相关的几个数据库
 */

const whiteList = models.whiteList

exports.addWhiteId = function (userId, whiteId){
    return whiteList.create({
        userId:userId,
        whiteId:whiteId
    })
}

exports.findByUserId = function (userId){
    return whiteList.findAll({
        where:{userId:userId}
    })
}