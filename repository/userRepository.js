const models = require('../database/models')
const Op = models.Op

/**
 * 仓库层：用户数据读写
 */

const User = models.User

/**
 * 根据用户id获取用户
 * @param id
 * @returns {Promise<Model<TModelAttributes, TCreationAttributes>[]>}
 */
exports.getUserById = function (id) {
    return User.findAll({
        where: {
            id: {
                [Op.eq]: id
            }
        }
    })
}

/**
 * 插入用户
 * @param username
 * @param password
 * @param gender
 * @param nickname
 * @returns {Promise<Model<any, any>>}
 */
exports.createUser = function (username, password, gender, nickname) {
    return User.create(
        {
            username: username,
            password: password,
            gender: gender,
            nickname: nickname,
        }
    )
}

/**
 * 根据用户名获取用户对象
 * @param username
 * @returns {Promise<Model<TModelAttributes, TCreationAttributes>[]>}
 */
exports.getUserByUsername = function (username) {
    return User.findAll({
        where: {
            username: {
                [Op.eq]: username
            }
        }
    })
}

/**
 * 根据字段搜索用户
 * @returns {Promise<Model<TModelAttributes, TCreationAttributes>[]>}
 * @param text
 */
exports.searchUser = function (text) {
    return User.findAll({
        where: {
            [Op.or]: [
                {
                    username: {
                        [Op.like]: '%' + text + '%'
                    }
                },
                {
                    nickname: {
                        [Op.like]: '%' + text + '%'
                    }
                }
            ]
        }
    })
}

/**
 * 更新用户头像
 */
exports.updateUserAvatar = function (id, avatarPath) {
    return User.update({
        avatar: avatarPath
    }, {
        where: {
            id: id
        }
    })
}

/**
 * 修改某用户的昵称
 * @param id
 * @param nickname
 * @returns {Promise<[number, Model<TModelAttributes, TCreationAttributes>[]]>}
 */
exports.changeNickname = function(id,nickname){
    return User.update({
        nickname:nickname
    },{
        where:{
            id:id
        }
    })
}

/**
 * 修改用户签名
 * @param id
 * @param signature
 * @returns {Promise<[number, Model<TModelAttributes, TCreationAttributes>[]]>}
 */
exports.changeSignature = function(id,signature){
    return User.update({
        signature:signature
    },{
        where:{
            id:id
        }
    })
}


/**
 * 修改某用户的性别
 * @param id
 * @param gender
 * @returns {Promise<[number, Model<TModelAttributes, TCreationAttributes>[]]>}
 */
exports.changeGender = function(id,gender){
    return User.update({
        gender:gender
    },{
        where:{
            id:id
        }
    })
}

/**
 * 获取某用户的头像文件名
 * @param id
 * @returns {Promise<Model<TModelAttributes, TCreationAttributes> | null>}
 */
exports.getAvatarPathById = function (id){
    return User.findOne({
    where:{
        id:id
    },
        attributes:['avatar']
    })
}