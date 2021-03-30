const tokenUtils = require('../utils/tokenUtils')
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes
const excludedUrl = ['/user/login','/user/sign_up','/user/profile/query_avatar','/user/profile/query_avatar','/user/profile/avatar','/image/get','/message/voice']
const tools = require('../utils/tools')

/**
 * 验证token有效性的中间件
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
tokenVerifier = function (req, res, next) {
    let token =  req.headers['token']

    //跳过向特定地址的请求
    if(tools.inPaths(req._parsedUrl.pathname,excludedUrl)){
        console.log('token验证','放行')
        return next()
    }
    //验证token
    tokenUtils.verifyToken(token,function(err,decoded){
        if(err){
            //验证失败，拦截
            console.log('token验证','失败:'+err)
            return res.status(403).send(jsonUtils.getResponseBody(codes.invalid_token))
        }else{
            req.query.authId = decoded.userId
            req.body.authId = decoded.userId
            if(decoded.userId===undefined){
                return res.status(403).send(jsonUtils.getResponseBody(codes.invalid_token))
            }
            return next()
        }

    })

}



module.exports = tokenVerifier