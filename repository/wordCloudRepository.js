const {where} = require('sequelize')
const models = require('../database/models')
const codes = require('../utils/codes').codes
const Op = models.Op
const tools = require('../utils/tools')
/**
 * 仓库层：用户关系数据读写
 * 操作和云图相关的几个数据库
 */

const UserRelation = models.UserRelation
const User = models.User
const wordCloudBin = models.wordCloudBin
const wordTop10 = models.wordTop10


exports.createUserTop10 = function (Id) {
    return wordTop10.create({
        cloudId: Id.toString(),
        /*
        TOP1:null,
        TOP2:null,
        TOP3:null,
        TOP4:null,
        TOP5:null,
        TOP6:null,
        TOP7:null,
        TOP8:null,
        TOP9:null,
        TOP10:null,
         */
        Top10: null,
        flag: 0,
        index: 0
    })
}
/**
 * 查找word对应的用户个人词是否存在，没有就新建
 * @param {*} userId
 * @param {*} word
 * @param {*} addNum
 */
exports.findOrCreateUserWord = function (userId, word, addNum) {
    return wordCloudBin.findOrCreate({
        where: {
            [Op.and]: [{key: userId}, {word: word}, {type: 'USER'}]
        },
        defaults: {
            key: userId.toString(),
            type: 'USER',
            word: word,
            num: addNum
        }
    }).then(([user, created]) => {
        let res = addNum
        if (created === false) {
            res = user.num + addNum
            user.update({num: res})
        }
        return res
    })
}


exports.updateTop10 = function (type, id, word, num) {
    wordTop10.findOrCreate({
            where: {
                cloudId: id
            },
            defaults: {
                cloudId: id,
                type: type
            }
        }
    ).then(value => {
        data = value[0].get()
        console.log(data)
        if (data.flag >= num) {
            return
        }
        let arr = []
        let obj
        for (i = 1; i <= 10; i++) {
            if (data['Top' + i] != null) {
                obj = {
                    name: data['Top' + i].split(':')[0],
                    freq: parseInt(data['Top' + i].split(':')[1])
                }
            } else {
                obj = {
                    name: null,
                    freq: -1
                }
            }
            arr.push(obj)
        }
        flag = 0
        if (num > data.flag) {
            for (i = 0; i < 10; i++) {
                if (arr[i].name === word) {
                    flag = 1
                    if (arr[i].freq < num)
                        arr[i] = {name: word, freq: num}
                }
            }
            if (!flag)
                arr[9] = {name: word, freq: num}
        }

        arr.sort((a, b) => {
            return b.freq - a.freq
        })


        return wordTop10.update(
            {
                Top1: arr[0].name + ':' + arr[0].freq,
                Top2: arr[1].name + ':' + arr[1].freq,
                Top3: arr[2].name + ':' + arr[2].freq,
                Top4: arr[3].name + ':' + arr[3].freq,
                Top5: arr[4].name + ':' + arr[4].freq,
                Top6: arr[5].name + ':' + arr[5].freq,
                Top7: arr[6].name + ':' + arr[6].freq,
                Top8: arr[7].name + ':' + arr[7].freq,
                Top9: arr[8].name + ':' + arr[8].freq,
                Top10: arr[9].name + ':' + arr[9].freq,
                flag: arr[9].freq
            },
            {
                where: {
                    [Op.and]: [
                        {type: type},
                        {
                            cloudId: id
                        }
                    ]
                }
            }
        )

    })

}


/**
 * 查找word对应的会话词是否存在，没有就新建
 * @param conversationId
 * @param {*} word
 * @param {*} addNum
 */
exports.findOrCreateConWord = function (conversationId, word, addNum) {
    return wordCloudBin.findOrCreate({
        where: {
            [Op.and]: [
                {word: word},
                {type: 'CONVERSATION'},
                {key: conversationId}
            ]
        },
        defaults: {
            key: conversationId,
            type: 'CONVERSATION',
            word: word,
            num: addNum
        }
    }).then(([user, created]) => {
        let res = addNum
        if (created === false) {
            res = user.num + addNum
            user.update({num: res})
        }
        return res
    })
}

/**
 * 删除会话相关词频
 * @param conversationId
 */
exports.deleteConversationWordCloud = function (conversationId) {
    return wordCloudBin.destroy({
        where: {
            [Op.and]: [{key: conversationId}, {type: 'CONVERSATION'}]
        }
    })
}

/**
 * 获取用户词频表
 * @param {*} userId
 */
exports.getUserWordCloud = function (userId) {
    return wordCloudBin.findAll({
        where: {[Op.and]: [{key: userId.toString()}, {type: 'USER'}]},
        order: [['num', 'DESC']],
        limit: 10 //最多10条
    })
}


/**
 * 获取会话词频表
 * @param conversationId
 */
exports.getConversationWordCloud = function (conversationId) {
    return wordCloudBin.findAll({
        where: {
            [Op.and]: [
                {type: 'CONVERSATION'},
                {key: conversationId}
            ]
        },
        order: [['num', 'DESC']],
        limit: 10
    })
}

exports.getTop10 = function (type, id) {
    return wordTop10.findOrCreate({
            where: {
                cloudId: id
            },
            defaults: {
                cloudId: id,
                type: type
            }
        }
    ).then(value => {
        data = value[0].get()
        let arr = []
        let obj
        for (i = 1; i <= 10; i++) {
            if (data['Top' + i] != null) {
                obj = {
                    name: data['Top' + i].split(':')[0],
                    freq: parseInt(data['Top' + i].split(':')[1])
                }
            } else {
                obj = {
                    name: null,
                    freq: -1
                }
            }
            arr.push(obj)
        }
        return arr
    })
}

exports.getUserFromWord(type, word)
{
    wordTop10.findAll(
        {
            where: {
                [Op.and]: [{
                    type: type,
                    [Op.or]: [
                        {Top1: word},
                        {Top2: word},
                        {Top3: word},
                        {Top4: word},
                        {Top5: word},
                        {Top6: word},
                        {Top7: word},
                        {Top8: word},
                        {Top9: word},
                        {Top10: word}
                    ]
                }]
            }
        }
    ).then(value => {
        let arr = []
        for (item in value) {
            data = item.get()
            arr.push(data.cloudId)
        }
        return arr
    })
}