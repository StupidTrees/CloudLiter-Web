const tokenUtils = require('../utils/tokenUtils')
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes
const excludedUrl = ['/user/login','/user/sign_up']
const tools = require('../utils/tools')


tokenVerifier = function (req, res, next) {
    let token =  req.headers['token']

    if(tools.inArray(req.url,excludedUrl)){
        console.log('token验证','放行')
        return next()
    }
    console.log('token',token)
    tokenUtils.verifyToken(token,function(err,decoded){
        if(err){
            console.log('token验证','失败:'+err)
            return res.status(403).send(jsonUtils.getResponseBody(codes.invalid_token))
        }else{
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