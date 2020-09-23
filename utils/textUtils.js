
exports.isEmpty = function (text) {
   return text==null || text.length===0
}


exports.isUsernameLegal = function (username) {
    return !this.isEmpty(username) && username.length>3
}


exports.isPasswordLegal = function (password) {
    return !this.isEmpty(password) && password.length>=8
}