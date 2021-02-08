const tools = require("../utils/tools");
const UUID = require('uuid');
const fs = require('fs')
const jsonUtils = require('../utils/jsonUtils')
const shieldingService = require('../service/shieldingService')
const codes = require('../utils/codes').codes
const repository = require('../repository/aiRepository');
exports.testPost = async function(){
    return Promise.resolve({class:'ok'})
}
exports.aiClassify = async function (userId,  files) {
    // 手动给文件加后缀, formidable默认保存的文件是无后缀的
    let fileName = tools.getP2PId(userId, userId) + "_" + UUID.v1() + path.extname(files.upload.name)
    let newPath = path.dirname(files.upload.path) + '/' + fileName
    await fs.renameSync(files.upload.path, newPath)
    let params = {message:newPath}
    //let params = {token:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsInVzZXJuYW1lIjoic3R1cGlkdHJlZSIsImlhdCI6MTYxMjYwMzAxOSwiZXhwIjoxNjQ0MTYwNjE5fQ.b-HfcIvQVh-LNEOzKXNe1s5OrOuWQVKt24WqEMC8ILk'}
    // await repository.aiPost(function(result){
    //     console.log("OUT: "+result)
    //     fs.unlinkSync(newPath)
    //     return Promise.resolve({newPath:newPath,result:result})
    // })
    return repository.aiPost(params).then(function (result){
        console.log('value'+result)
        fs.unlinkSync(newPath)
        return Promise.resolve(result)
    })

}