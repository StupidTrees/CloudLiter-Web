const models = require('../database/models')
const sequelize = require('../database/connector').sequelize
const WhitelistTable = models.Whitelist
/**
 * 仓库层：用户关系数据读写
 * 操作和云图相关的几个数据库
 */


exports.addToWhitelist = function (userId, whiteList){
    let values = []
    for(let i=0;i<whiteList.length;i++){
        values.push({
            userId:userId,
            whiteId:whiteList[i]
        })
    }
    return WhitelistTable.bulkCreate(values)
}

exports.getWhiteList = function (userId){
    return sequelize.query(`
    select distinct u.id,u.nickname,r.remark,u.avatar
    from whitelist as wl,user as u,relation as r
    where wl.whiteId = u.id
        and r.userId = ${userId}
        and r.friendId = wl.whiteId
        and wl.userId = ${userId}
    `)
}


exports.removeFromWhiteList = function (userId,friendId){
    return sequelize.query(`delete from whitelist
    where userId = ${userId}
        and whiteId = ${friendId}`)
}