/**
 * 判断字符串是否为空
 * @param text
 * @returns {boolean}
 */
exports.isEmpty = function (text) {
   return text==null || text.length===0
}


/**
 * 判断用户名是否合法
 * @param username
 * @returns {boolean}
 */
exports.isUsernameLegal = function (username) {
    return !this.isEmpty(username) && username.length>3
}

/**
 * 判断密码是否合法
 * @param password
 * @returns {boolean}
 */
exports.isPasswordLegal = function (password) {
    return !this.isEmpty(password) && password.length>=8
}

exports.equals = function (a1,a2){
    return a1.toString()===a2.toString()
}