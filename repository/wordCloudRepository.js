const { where } = require('sequelize')
const models = require('../database/models')
const codes = require('../utils/codes').codes
const Op = models.Op
const tools = require('../utils/tools')
/**
 * 仓库层：用户关系数据读写
 * 操作和云图相关的几个数据库
 */

const UserRelation = models.UserRelation
const Message = models.Message
const UserConversation = models.Conversation
const User = models.User
const wordCloudSum = models.wordCloudSum
const wordCloudBin = models.wordCloudBin

/**
 * 在创建账号时调用，创建user的词频总表
 * @param {} userId 
 */
exports.createUserSum = function(userId){
    //let message = await wordCloudSum.findAll({where:{[Op.and]:[{userId:userId},{state:'USER'}]}})
    
    return wordCloudSum.create({
            userId: userId,
            state: 'USER',
            totalWord: 0
    })
}

/**
 * 在创建会话时调用，创建conversation的词频总表
 * @param {*} userId 
 * @param {*} friendId 
 */
exports.createConSum = function(userId,friendId)
{
    return wordCloudSum.create({
        userId: userId,
        friendId: friendId,
        state: 'CONVERSATION',
        totalWord: 0
    })
}

/**
 * 用户个人总词频增加
 * @param {*} userId 
 * @param {*} addNum
 */
exports.addUserSum = function(userId,addNum){
    /*return wordCloudSum.update(
        {totalWord: totalWord + addNum},
        {
            where:{
                [Op.and]:[{userId:userId},{state:'USER'}]
            }
        }
    )*/
    return wordCloudSum.findOrCreate({
        where:{
            [Op.and]:[{userId:userId},{state:'USER'}]
        },
        defaults:{
            userId:userId,
            state:'USER',
            totalWord:addNum
        }
    }).then(([user,created])=>{
        if(created === false){
            return user.update({totalWord:user.totalWord+addNum})
        }
    })
}

/**
 * 会话总词频增加
 * @param {*} user1 
 * @param {*} user2 
 * @param {*} addNum
 */
exports.addConSum = function(user1,user2,addNum){
    /*return wordCloudSum.update(
        {totalWord: totalWord + addNum},
        {
            where:{
                [Op.and]:[
                    {state: 'CONVERSATION'},
                    {
                        [Op.or]:[
                            {[Op.and]:[{userId:user1},{friendId:user2}]},
                            {[Op.and]:[{userId:user2},{userId:user1}]}
                        ]
                    }
                ]
            }
        }
    )*/
    return wordCloudSum.findOrCreate({
        where:{
            [Op.and]:[
                {state: 'CONVERSATION'},
                {
                    [Op.or]:[
                        {[Op.and]:[{userId:user1},{friendId:user2}]},
                        {[Op.and]:[{userId:user2},{userId:user1}]}
                    ]
                }
            ]
        },
        defaults:{
            userId:user1,
            friendId:user2,
            state:'CONVERSATION',
            totalWord:addNum
        }
    }).then(([user,created])=>{
        if(created === false){
            return user.update({totalWord:user.totalWord+addNum})
        }
    })
}

/**
 * 查找word对应的用户个人词是否存在，没有就新建
 * @param {*} userId 
 * @param {*} word 
 * @param {*} addNum
 */
exports.findOrCreateUserWord = function(userId,word,addNum){
    return wordCloudBin.findOrCreate({
        where:{
            [Op.and]:[{userId:userId},{word:word},{state:'USER'}]
        },
        defaults:{
            userId:userId,
            state:'USER',
            word:word,
            num:addNum
        }
    }).then(([user,created])=>{
        if(created === false){
            return user.update({num:user.num+addNum})
        }
    })
}

/**
 * 查找word对应的会话词是否存在，没有就新建
 * @param {*} user1 
 * @param {*} user2 
 * @param {*} word 
 * @param {*} addNum
 */
exports.findOrCreateConWord = function(user1,user2,word,addNum){
    return wordCloudBin.findOrCreate({
        where:{
            [Op.and]:[
                {word:word},
                {state:'CONVERSATION'},
                {[Op.or]:[
                    {[Op.and]:[{userId:user1},{friendId:user2}]},
                    {[Op.and]:[{userID:user2},{friendId:user1}]}
                ]}
            ]
        },
        defaults:{
            userId: user1,
            friendId: user2,
            state: 'CONVERSATION',
            word: word,
            num:addNum
        }
    }).then(([user,created])=>{
        if(created === false){
            return user.update({num:user.num + addNum})
        }
    })
}

/**
 * 删除会话相关词频
 * @param {*} user1 
 * @param {*} user2 
 */
exports.deleteConWord = function(user1,user2){
    return wordCloudBin.destroy({
        where:{
            [Op.or]:[
                {[Op.and]:[{userId:user1},{friendId:user2},{state:'CONVERSATION'}]},
                {[Op.and]:[{userId:user2},{friendId:user1},{state:'CONVERSATION'}]}
            ]
        }
    })
}

/**
 * 删除会话总词频
 * @param {*} user1 
 * @param {*} user2 
 */
exports.deleteConSum = function(user1,user2){
    return wordCloudSum.destroy({
        where:{
            [Op.and]:[
                {state:'CONVERSATION'},
                {[Op.or]:[
                    {[Op.and]:[{userId:user1},{friendId:user2}]},
                    {[Op.and]:[{userId:user2},{friendId:user1}]}
                ]}
            ]
        }
    })
}

/**
 * 获取用户词频表
 * @param {*} userId
 */
exports.getUserMessage = function(userId){
    return wordCloudBin.findAll({
        where: {[Op.and]:[{userId: userId},{state:'USER'}]},
        order: [['num','DESC']]
    })
}

/**
 * 获取用户sum
 * @param {} userId 
 */
exports.getUserSum = function(userId){
    return wordCloudSum.findOne({
        where: {
            [Op.and]:[
                {userId:userId},{state:'USER'}
            ]
        }
    })
}

/**
 * 获取会话词频表
 * @param {*} user1 
 * @param {*} user2 
 */
exports.getConMessage = function(user1,user2){
    return wordCloudBin.findAll({
        where:{
            [Op.or]:[
                {[Op.and]:[{userId:user1},{friendId:user2},{state:'CONVERSATION'}]},
                {[Op.and]:[{userId:user2},{friendId:user1},{state:'CONVERSATION'}]}
            ]
        },
        order: [['num','DESC']]
    })
}

/**
 * 获取会话sum
 * @param {*} user1 
 * @param {*} user2 
 */
exports.getConSum = function(user1,user2){
    return wordCloudSum.findOne({
        where:{
            [Op.and]:[
                {state:'CONVERSATION'},
                {[Op.or]:[
                    {[Op.and]:[{userId:user1},{friendId:user2}]},
                    {[Op.and]:[{userId:user2},{friendId:user1}]}
                ]}
            ]
        }
    })
}