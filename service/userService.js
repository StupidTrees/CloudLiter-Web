const repository = require('../database/userRepository');
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes
const codesUtils = require('../utils/codes')
const tokenUtils = require('../utils/tokenUtils')
const textUtils = require('../utils/textUtils')
const tools = require('../utils/tools')

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
    } else if (!(tools.inArray(gender,['MALE', 'FEMALE']))){
        return jsonUtils.getResponseBody(codes.format_error_gender)
    }
    //数据库操作：新建用户
    return await repository.createUser(username, password, gender, nickname).then(() => {
        return jsonUtils.getResponseBody(codes.success)
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
                return Promise.resolve(jsonUtils.getResponseBody(codes.success, {token: token}))
            } else {
                console.log('login', '密码错误')
                return Promise.reject(jsonUtils.getResponseBody(codes.login_wrong_password))
            }
        }).catch((err) => {
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
                username: user.username,
                nickname: user.nickname,
                gender: user.gender
            }))
        }
    }, (err) => {

        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    })
}
