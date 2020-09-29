const repository = require('../database/userRepository');
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes
const config = require('../config')
const codesUtils = require('../utils/codes')
const tokenUtils = require('../utils/tokenUtils')
const textUtils = require('../utils/textUtils')
const tools = require('../utils/tools')
const fs = require('fs')
const path = require('path')

/**
 * 服务层：用户操作
 */

/**
 * 用户注册
 * @param username
 * @param password
 * @param gender
 * @param nickname
 * @returns {Promise<*>}
 */
exports.userSignUp = async function (username, password, gender, nickname) {
    //请求格式检查
    if (!textUtils.isUsernameLegal(username)) {
        return jsonUtils.getResponseBody(codes.format_error_username)
    } else if ((!textUtils.isPasswordLegal(password))) {
        return jsonUtils.getResponseBody(codes.format_error_password)
    } else if (textUtils.isEmpty(gender)) {
        return jsonUtils.getResponseBody(codesUtils.getFormatEmptyCode('请指定性别！'))
    } else if (!(tools.inArray(gender, ['MALE', 'FEMALE']))) {
        return jsonUtils.getResponseBody(codes.format_error_gender)
    }


    //数据库操作：新建用户
    return await repository.createUser(username, password, gender, nickname).then((value) => {
        console.log('value', value)
        let token = tokenUtils.signIdToken(value.id, username)
        return Promise.resolve(jsonUtils.getResponseBody(codes.success, {
            token: token,
            info: {
                username: username,
                id: value.id,
                nickname: nickname,
                gender: gender
            }
        }))
    }, (err) => {
        console.log('err', err)
        if (err.original.code === 'ER_DUP_ENTRY') {
            return Promise.reject(jsonUtils.getResponseBody(codes.signup_duplicated_username))
        } else {
            return Promise.reject(jsonUtils.getResponseBody(code.signup_other_error))
        }
    })
}

/***
 * 用户登录
 * @param username
 * @param password
 * @returns {Promise<{code: *, message: *} | {code: *, message: *}>}
 */
exports.userLogin = async function (username, password) {
    return await repository.getUserByUsername(username).then(
        (value) => {
            if (value.length === 0) { //获取到的用户数量为0：用户不存在
                return Promise.reject(jsonUtils.getResponseBody(codes.login_wrong_username, null))
            }
            const user = value[0].get()
            //验证密码
            if (user.password === password) {
                console.log('login', '密码正确')
                //密码正确，签发token
                let token = tokenUtils.signToken(user)
                return Promise.resolve(jsonUtils.getResponseBody(codes.success,
                    {
                        info: {
                            id: user.id,
                            username: user.username,
                            nickname: user.nickname,
                            gender: user.gender,
                            avatar: user.avatar
                        },
                        token: token
                    }))
            } else {
                console.log('login', '密码错误')
                return Promise.reject(jsonUtils.getResponseBody(codes.login_wrong_password))
            }
        }, (err) => {
            console.log('error', err)
            return Promise.reject(jsonUtils.getResponseBody(
                codes.other_error, err
            ))
        })
}

/**
 * 基本用户信息获取
 * @param userId
 * @returns {Promise<{code: *, message: *} | {code: *, data: *, message: *}>}
 */
exports.fetchBaseProfile = async function (userId) {
    return await repository.getUserById(userId).then((value) => {
        if (value.length === 0) {
            return Promise.reject(
                jsonUtils.getResponseBody(codes.login_wrong_username)
            )
        } else {
            let user = value[0].get()
            return Promise.resolve(jsonUtils.getResponseBody(codes.success, {
                id: user.id,
                username: user.username,
                nickname: user.nickname,
                gender: user.gender,
                avatar: user.avatar,
                signature: user.signature
            }))
        }
    }, (err) => {

        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    })
}


/**
 * 根据关键字搜索用户
 * @param text 关键字
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.searchUser = async function (text) {
    return await repository.searchUser(text).then((value) => {
        let res = []
        //搜到的用户列表，把关键信息提取出来，打包，返回
        value.forEach(function (item) {
            res.push({
                username: item.username,
                nickname: item.nickname,
                avatar: item.avatar,
                id: item.id,
                gender: item.gender
            })
        })
        console.log("result", res)
        return Promise.resolve(jsonUtils.getResponseBody(codes.success, res))
    }, (err) => {
        console.log("error", err)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    })
}


/**
 * 上传用户头像
 * @param userId 用户id
 * @param files 头像文件
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.uploadAvatar = async function (userId, files) {
    // 手动给文件加后缀, formidable默认保存的文件是无后缀的
    let newPath = path.dirname(files.upload.path) + '/avatar_' + userId + path.extname(files.upload.name)
    // 将文件重命名为avatar_用户id的形式
    await fs.renameSync(files.upload.path, newPath)
    console.log("update_avatar", userId)
    // 通知用户数据库，变更该用户的头像文件名
    return repository.updateUserAvatar(userId, 'avatar_' + userId + path.extname(files.upload.name)).then((value) => {
        console.log('va', value)
        if (value[0]) {
            //更换头像成功，将头像文件名返回
            return Promise.resolve(jsonUtils.getResponseBody(codes.success, {
                file: 'avatar_' + userId + path.extname(files.upload.name)
            }))
        } else {
            // 说明该用户id查找不到任何用户
            return Promise.reject(jsonUtils.getResponseBody(codes.login_wrong_username))
        }
    }, (err) => {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    })
}

/**
 * 更换昵称
 * @param userId 用户id
 * @param nickname 昵称
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.changeNickname = async function (userId, nickname) {
    let res
    try {
        res = await repository.changeNickname(userId, nickname)
        if (res[0] > 0) {
            return Promise.resolve(jsonUtils.getResponseBody(codes.success))
        } else {
            return Promise.reject(jsonUtils.getResponseBody(codes.login_wrong_username))
        }
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
}


/**
 * 更改性别
 * @param userId
 * @param gender 性别：MALE/FEMALE
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.changeGender = async function (userId, gender) {
    if (!(tools.inArray(gender, ['MALE', 'FEMALE']))) {
        return Promise.reject(jsonUtils.getResponseBody(codes.format_error_gender))
    }
    try {
        let res = await repository.changeGender(userId, gender)
        if (res[0] > 0) {
            return Promise.resolve(jsonUtils.getResponseBody(codes.success))
        } else {
            return Promise.reject(jsonUtils.getResponseBody(codes.login_wrong_username))
        }
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
}


/**
 * 根据用户id，查询头像文件名
 * @param userId
 * @returns {Promise<TResult1|undefined>}
 */
exports.queryAvatar = async function (userId) {
    let path = null
    try {
        path = await repository.getAvatarPathById(userId).then((value) => {
            if (value === null) return null
            return value.get().avatar
        })
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    if (path === null) {
        return Promise.reject(jsonUtils.getResponseBody(codes.login_wrong_username))
    }
    console.log("path", path)
    //查询到头像文件民后，调用直接读取函数
    return this.getAvatar(path)
}


/**
 * 根据头像文件名，直接读取头像文件，直接返回给前端
 * @param fileName
 * @returns {Promise<unknown>}
 */
exports.getAvatar = async function (fileName) {
    try {
        let file = await new Promise((resolve, reject) => {
            //直接生成头像路径
            let target = path.join(__dirname, '../') + config.files.avatarDir + '/' + fileName
            //读取头像文件
            fs.readFile(target, 'binary', function (err, file) {
                    if (err) {
                        reject(err)
                    } else if (file === null) {
                        reject(jsonUtils.getResponseBody(codes.no_avatar_file))
                    } else {
                        //读取成功
                        resolve(file)
                    }
                })
            }
        ).then((file) => {
            return file
        });
        return Promise.resolve(file)

    } catch
        (e) {
        console.log("error", e)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
}

