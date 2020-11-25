const repository = require('../repository/userRepository');
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

    //通知数据库创建新用户
    let value = null
    try {
        value = await repository.createUser(username, password, gender, nickname)
    } catch (e) {
        console.log('sing_up_error',e)
        if (e.original.code === 'ER_DUP_ENTRY') { //有重复主键，说明用户已存在
            return Promise.reject(jsonUtils.getResponseBody(codes.signup_duplicated_username))
        } else {
            return Promise.reject(jsonUtils.getResponseBody(code.signup_other_error, e))
        }
    }
    //若数据库插入成功，value将会是创建的新用户
    //console.log('value', value)
    let token = tokenUtils.signIdToken(value.id, username) //为之签发token
    return Promise.resolve(jsonUtils.getResponseBody(codes.success, {
        token: token,
        info: { //将用户信息也顺便返回
            username: username,
            id: value.id.toString(),
            nickname: nickname,
            gender: gender
        }
    }))
}

/***
 * 用户登录
 * @param username
 * @param password
 * @returns {Promise<{code: *, message: *} | {code: *, message: *}>}
 */
exports.userLogin = async function (username, password) {
    //根据username，从数据库中读取用户
    let value = null
    try {
        value = await repository.getUserByUsername(username)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    if (value.length === 0) { //获取到的用户数量为0：用户不存在
        return Promise.reject(jsonUtils.getResponseBody(codes.login_wrong_username, null))
    }
    const user = value[0].get()
    //验证该用户的密码
    if (user.password === password) {
        console.log('login', '密码正确')
        //密码正确，签发token
        let token = tokenUtils.signToken(user)
        return Promise.resolve(jsonUtils.getResponseBody(codes.success,
            {
                info: {
                    id: user.id.toString(),
                    username: user.username,
                    nickname: user.nickname,
                    gender: user.gender,
                    avatar: user.avatar,
                    signature:user.signature
                },
                token: token
            }))
    } else {
        console.log('login', '密码错误')
        return Promise.reject(jsonUtils.getResponseBody(codes.login_wrong_password))
    }
}

/**
 * 基本用户信息获取
 * @param userId
 * @returns {Promise<{code: *, message: *} | {code: *, data: *, message: *}>}
 */
exports.fetchBaseProfile = async function (userId) {
    //从数据库中根据id读出该用户
    let value = null
    try {
        value = await repository.getUserById(userId)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    //如果读出的长度为0，说明用户不存在
    if (value.length === 0) {
        return Promise.reject(
            jsonUtils.getResponseBody(codes.login_wrong_username)
        )
    } else {
        //用户存在，那么将其基本信息打包，返回
        let user = value[0].get()
        return Promise.resolve(jsonUtils.getResponseBody(codes.success, {
            id: user.id,
            username: user.username,
            nickname: user.nickname,
            gender: user.gender,
            avatar: user.avatar,
            signature: user.signature,
            color:user.color
        }))
    }
}


/**
 * 根据关键字搜索用户
 * @param text 关键字
 */
exports.searchUser = async function (text) {
    //进行数据库搜索
    let value
    try {
        value = await repository.searchUser(text)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }

    let res = []
    //搜到的用户列表，把关键信息提取出来，打包，返回
    value.forEach(function (item) {
        res.push({
            username: item.username,
            nickname: item.nickname,
            avatar: item.avatar,
            id: item.id,
            gender: item.gender,
            color: item.color
        })
    })
    //console.log("result", res)
    return Promise.resolve(jsonUtils.getResponseBody(codes.success, res))
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
    //console.log("update_avatar", userId)
    // 通知用户数据库，变更该用户的头像文件名
    let value
    try {
        value = await repository.updateUserAvatar(userId, 'avatar_' + userId + path.extname(files.upload.name))
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    // 数据库更新成功
    if (value[0]) {
        //更换头像成功，将头像文件名返回
        return Promise.resolve(jsonUtils.getResponseBody(codes.success, {
            file: 'avatar_' + userId + path.extname(files.upload.name)
        }))
    } else {
        // 说明该用户id查找不到任何用户
        return Promise.reject(jsonUtils.getResponseBody(codes.login_wrong_username))
    }
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
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    //判断是否成功变更了某一行
    if (res[0] > 0) {
        return Promise.resolve(jsonUtils.getResponseBody(codes.success))
    } else {
        return Promise.reject(jsonUtils.getResponseBody(codes.login_wrong_username))
    }
}

/**
 * 更换签名
 * codes.signature_empty暂时先用着，还要改
 * @param userId 用户ID
 * @param signature 用户签名
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.changeSignature = async function (userId, signature) {
    let res
    try {
        res = await repository.changeSignature(userId, signature)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    //判断是否成功变更了某一行
    if (res[0] > 0) {
        return Promise.resolve(jsonUtils.getResponseBody(codes.success))
    } else {
        return Promise.reject(jsonUtils.getResponseBody(codes.signature_empty))
    }
}


/**
 * 更改性别
 * @param userId
 * @param gender 性别：MALE/FEMALE
 */
exports.changeGender = async function (userId, gender) {
    //输入格式检查
    if (!(tools.inArray(gender, ['MALE', 'FEMALE']))) {
        return Promise.reject(jsonUtils.getResponseBody(codes.format_error_gender))
    }
    let res
    try {
        res = await repository.changeGender(userId, gender)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    //判断是否成功变更了某一行
    if (res[0] > 0) {
        return Promise.resolve(jsonUtils.getResponseBody(codes.success))
    } else {
        return Promise.reject(jsonUtils.getResponseBody(codes.login_wrong_username))
    }
}


/**
 * 更改颜色
 * @param userId
 * @param color 颜色：RED/ORANGE/YELLOW/GREEN/CYAN/BLUE/PURPLE
 */
exports.changeColor = async function (userId, color) {
    //输入格式检查
    if (!(tools.inArray(color, ['RED','ORANGE','YELLOW','GREEN','CYAN','BLUE','PURPLE']))) {
        return Promise.reject(jsonUtils.getResponseBody(codes.format_error_color))
    }
    let res
    try {
        res = await repository.changeColor(userId, color)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    //判断是否成功变更了某一行
    if (res[0] > 0) {
        return Promise.resolve(jsonUtils.getResponseBody(codes.success))
    } else {
        return Promise.reject(jsonUtils.getResponseBody(codes.login_wrong_username))
    }
}


/**
 * 根据用户id，查询头像文件名
 * @param userId
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
    //console.log("path", path)
    //查询到头像文件名后，调用直接读取函数
    return this.getAvatar(path)
}


/**
 * 根据头像文件名，直接读取头像文件，直接返回给前端
 * @param fileName
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
        //console.log("error", e)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
}

/**
 * 根据用户词云搜索
 * @param word
 * @returns {Promise<void>}
 */
exports.searchUserByWordCloud = async function(Id,word){
    console.log("word:"+word)
    let value
    let user
    let result = []
    try {
        value = await repository.searchUserIdByWordCloud(word)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    //console.log(value.length)
    let arr = []

    let reg = new RegExp(word)
    for(let i = 1;i<=10;i++) {
        value.forEach(function (v) {
            //console.log("for")
            if(v['Top'+i].match(reg)){
                //console.log("if")
                arr.push(v['cloudId'])
            }
        })
    }
    console.log('arr'+arr)
    for(let j=0;j<arr.length;j++){
        //Id相同为查询者
        if(arr[j]==Id){
            continue
        }
        try {
            user = await repository.getUserById(arr[j])
        } catch (e) {
            return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
        }
        //如果读出的长度为0，说明用户不存在
        if (user.length === 0) {
            continue
        }

        let message = user[0].get()
        result.push({
            avatarUrl:message.avatar,
            userName:message.username,
            gender:message.gender,
            nickname:message.nickname
        })
    }

    return Promise.resolve(jsonUtils.getResponseBody(codes.success,result))

}