const tokenUtils = require('../utils/tokenUtils')
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes
const excludedUrl = ['/user/login','/user/sign_up']
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
    if(tools.inArray(req.url,excludedUrl)){
        console.log('token验证','放行')
        return next()
    }
    console.log('token',token)

    //验证token
    tokenUtils.verifyToken(token,function(err,decoded){
        if(err){
            //验证失败，拦截
            console.log('token验证','失败:'+err)
            return res.status(403).send(jsonUtils.getResponseBody(codes.invalid_token))
        }else{
            //验证成功，放行
            console.log('token验证',decoded)
            req.query.id = decoded.userId
            if(decoded.userId===undefined){
                return res.status(403).send(jsonUtils.getResponseBody(codes.invalid_token))
            }
            return next()
        }

    })

}



module.exports = tokenVerifier