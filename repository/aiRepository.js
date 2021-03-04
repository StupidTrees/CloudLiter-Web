const http = require('http')
const querystring = require('querystring')

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