const jwt = require('jsonwebtoken')
const expressJwt = require('express-jwt')

const PRIVATE_KEY = 'this_is_a_key'
const EXPIRE_IN = '1day'
const ENCODE_ALGORITHM = 'HS256'

//
// exports.tokenVerifierMiddleware = expressJwt({
//     secret: PRIVATE_KEY, // 签名的密钥 或 PublicKey
//     algorithms:[ENCODE_ALGORITHM]
// }).unless({
//     path: ['user/login', 'user/signup']  // 指定路径不经过 Token 解析
// })

exports.signToken = function (user){
    const info = {
        userId: user.id,
        username: user.username
    };
    return jwt.sign(info,PRIVATE_KEY,{
        expiresIn: EXPIRE_IN
    })
}
exports.signIdToken = function (id,username){
    const info = {
        userId: id,
        username: username
    };
    return jwt.sign(info,PRIVATE_KEY,{
        expiresIn: EXPIRE_IN
    })
}


exports.verifyToken = function (token,callback){
    jwt.verify(token,PRIVATE_KEY,{},callback)
}
