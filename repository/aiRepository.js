const http = require('http')
const querystring = require('querystring')

exports.faceRecognizeR = function (params){
    return new Promise((resolve, reject) => {
        let post_data = params
        //console.log('faceUpload')
        let content = querystring.stringify(post_data)
        let options = {
            hostname: 'localhost',
            port: 8088,
            path: '/face/query',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            }
        }

        let req = http.request(options, function (res) {
            let body = ""
            res.setEncoding('utf8')
            res.on('data', function (chunk) {
                console.log('BODY: ' + chunk)
                body += chunk
            })
            res.on('end', function () {
                console.log('body ' + body)
                resolve(body)
            })
        })
        req.on('error', function (e) {
            //console.log('problem with request: ' + e.message)
            reject(e)
        })
        req.write(content);
        req.end();
    })
}

/**
 * post人脸上传
 * @param params
 * @returns {Promise<unknown>}
 */
exports.faceUploadR = function (params){
    return new Promise((resolve, reject) => {
        let post_data = params
        //console.log('faceUpload')
        let content = querystring.stringify(post_data)
        let options = {
            hostname: 'localhost',
            port: 8088,
            path: '/face/insert',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            }
        }

        let req = http.request(options, function (res) {
            let body = ""
            res.setEncoding('utf8')
            res.on('data', function (chunk) {
                //console.log('BODY: ' + chunk)
                body += chunk
            })
            res.on('end', function () {
                //console.log('body ' + body)
                resolve(body)
            })
        })
        req.on('error', function (e) {
            //console.log('problem with request: ' + e.message)
        })
        req.write(content);
        req.end();
    })
}
/**
 * post图片分类
 * @param params
 * @returns {Promise<unknown>}
 */
exports.imageClassify = function (params) {
    return new Promise((resolve, reject) => {
        let post_data = params
        console.log('aiPost')
        let content = querystring.stringify(post_data)
        let options = {
            hostname: 'localhost',
            port: 5000,
            path: '/predict',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            }
        }

        let req = http.request(options, function (res) {
            let body = ""
            res.setEncoding('utf8')
            res.on('data', function (chunk) {
                console.log('BODY: ' + chunk)
                body += chunk
            })
            res.on('end', function () {
                console.log('body ' + body)
                resolve(body)
            })
        })
        req.on('error', function (e) {
            console.log('problem with request: ' + e.message)
        })
        req.write(content);
        req.end();
    })

}