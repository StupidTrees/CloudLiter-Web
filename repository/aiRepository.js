const http = require('http')
const querystring = require('querystring')
const util = require('util')
const request = require('request')
//const jsdom = require('jsdom')
exports.aiPost = function(){
    return new Promise((resolve,reject)=> {
        let post_data = {}
        console.log('aiPost')
        let content = querystring.stringify(post_data)
        let options = {
            hostname: 'hita.store',
            port: 3000,
            path: '/ai/image/testpost',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsInVzZXJuYW1lIjoic3R1cGlkdHJlZSIsImlhdCI6MTYxMjYwMzAxOSwiZXhwIjoxNjQ0MTYwNjE5fQ.b-HfcIvQVh-LNEOzKXNe1s5OrOuWQVKt24WqEMC8ILk'
            },

        }

        let req = http.request(options, function (res) {
            let body = ""
            res.setEncoding('utf8')
            res.on('data', function (chunk) {
                console.log('BODY: ' + chunk)
                body += chunk
            })
            res.on('end', function () {
                console.log('body '+body)
                resolve(body)
            })
        })
        req.on('error', function (e) {
            console.log('problem with request: ' + e.message)
        })
        req.write(content);
        req.end();
    })
    // let temp = document.createElement('form')
    // temp.action = URL
    // temp.method = 'post'
    // temp.style.display = 'none'
    // console.log('flag')
    // for(var x in PARAMS){
    //     let opt = document.createElement('textarea')
    //     opt.name = x
    //     opt.value = PARAMS[x]
    //     temp.appendChild(opt)
    // }
    // document.body.appendChild(temp)
    //
    // console.log(temp)
    // temp.submit()
    //
    // return temp

}