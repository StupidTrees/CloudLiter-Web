/**
 * 判断字符串是否为空
 * @param text
 * @returns {boolean}
 */
exports.isEmpty = function (text) {
   return text===undefined ||text==null || text.length===0
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

/**
 * 判断两元素是否在字符串意义上相等
 * @param t1
 * @param t2
 * @returns {boolean}
 */
exports.equals = function (t1,t2){
    return t1.toString()===t2.toString()
}
