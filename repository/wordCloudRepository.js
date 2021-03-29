const {where} = require('sequelize')
const models = require('../database/models')
const codes = require('../utils/codes').codes
const Op = models.Op
const tools = require('../utils/tools')
const TextUtils = require("../utils/textUtils");
const sequelize = require('../database/connector').sequelize
//const sequelize = new Sequelize('sqlite::memory:');
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
 * @param userId
 * @param friendId
 */
exports.deleteConversationWordCloud = function (userId,friendId) {
    // return wordCloudBin.destroy({
    //     where: {
    //         [Op.and]: [{key: conversationId}, {type: 'CONVERSATION'}]
    //     }
    // })
    return sequelize.query(`delete from wordCloudBins 
    where id in (
        select id from conversation
        where (user1Id =${userId} and user2Id = ${friendId}) or (user1Id =${friendId} and user2Id = ${userId})
    )`)
}

/**
 * 删除用户的特定一个词频
 * @returns {Promise<number>}
 * @param userId
 * @param word
 */
exports.deleteUserWordCloud = function (userId, word) {
    return wordCloudBin.destroy({
        where: {
            [Op.and]: [{key: userId}, {word:word}]
        }
    })
}

/**
 * 按频率高到低排序
 * @param cloudId
 * @returns {Promise<Model[]>}
 */
exports.findAllByF = function (cloudId) {

    return wordCloudBin.findAll({
        where: {key: cloudId},
        order: sequelize.literal('num DESC')

    })
}

exports.findWord = function (wordId) {
    return wordCloudBin.findAll({
        where: {id: wordId}
    })
}

/**
 * 找到某词位于词云中的次位
 * @param cloudId
 * @param wordKey
 */
exports.getRank = function (cloudId, wordKey) {
    return wordTop10.findByPk(cloudId).then(value => {
        let data = value.get()
        for (let i = 1; i <= 10; i++) {
            let word = data['Top' + i]
            if (!TextUtils.isEmpty(word)&&word.split(':')[0] === wordKey) {
                return i
            }
        }
        return -1
    })
}

exports.reSort = function (cloudId, rank, addMessage, length) {
    wordTop10.findOrCreate({
            where: {
                cloudId: cloudId
            },
            defaults: {
                cloudId: cloudId,
                type: 'USER'
            }
        }
    ).then(value => {
        console.log('rank:' + rank)
        let data = value[0].get()
        console.log(data)
        let arr = []
        let obj
        let i
        for (i = 1; i < rank; i++) {
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
        i = rank + 1
        console.log(i)
        for (; i <= 10; i++) {
            console.log('in')
            let j = ''
            j = 'Top' + i
            console.log(j + '   ' + data[j])
            if (data[j] != null) {
                obj = {
                    name: data[j].split(':')[0],
                    freq: parseInt(data[j].split(':')[1])
                }
            } else {
                obj = {
                    name: null,
                    freq: -1
                }
            }
            console.log(i + '   ' + obj.name)
            arr.push(obj)
        }
        console.log(length)
        if (length <= 9) {
            obj = {
                name: null,
                freq: -1
            }
            arr.push(obj)
        } else {
            obj = {
                name: addMessage.word,
                freq: addMessage.num
            }
            console.log('add:  ' + addMessage.word)
            arr.push(obj)
        }
        for (i = 0; i < 10; i++) {
            let a = arr[i]
            console.log(JSON.stringify(a))
        }
        // arr.sort((a, b) => {
        //     return b.freq - a.freq
        // })


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
                        {type: 'USER'},
                        {
                            cloudId: cloudId
                        }
                    ]
                }
            }
        )

    })
}

// /**
//  * 获取用户词频表
//  * @param {*} userId
//  */
// exports.getUserWordCloud = function (userId) {
//     return wordCloudBin.findAll({
//         where: {[Op.and]: [{key: userId.toString()}, {type: 'USER'}]},
//         order: [['num', 'DESC']],
//         limit: 10 //最多10条
//     })
// }


// /**
//  * 获取会话词频表
//  * @param conversationId
//  */
// exports.getConversationWordCloud = function (conversationId) {
//     return wordCloudBin.findAll({
//         where: {
//             [Op.and]: [
//                 {type: 'CONVERSATION'},
//                 {key: conversationId}
//             ]
//         },
//         order: [['num', 'DESC']],
//         limit: 10
//     })
// }

/**
 * 改变词云可见性
 * @param userId
 * @param isPrivate
 */
exports.changeAccessibility = function (userId, isPrivate) {
    return wordTop10.update({
        private: isPrivate
    }, {
        where: {
            cloudId: userId.toString()
        }
    })
}


exports.isPrivate = function (userId) {
    // return wordTop10.findByPk(userId, {
    //     attributes: ['private']
    // })
    return wordTop10.findOrCreate({
        where: {
            cloudId:userId
        },
        defaults: {
            cloudId: userId,
            type: 'USER'
        }
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
        return {
            list: arr,
            private: data.private
        }
    })
}

exports.getUserFromWord = function (type, word) {
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
exports.getUserById = function (id) {
    return wordTop10.findAll({
        where: {
            cloudId: {
                [Op.eq]: id
            }
        }
    })
}