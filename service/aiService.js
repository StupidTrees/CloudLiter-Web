const tools = require("../utils/tools");
const UUID = require('uuid');
const fs = require('fs')
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes
const repository = require('../repository/aiRepository');

/**
 * 图像场景分类
 * @param files 客户端传来的图像文件
 */
exports.imageClassify = async function (files) {
    let newPath = path.dirname(files.upload.path) + '/' + UUID.v1() + ".jpg"
    await fs.renameSync(files.upload.path, newPath)
    let params = {message: newPath}
    return repository.imageClassify(params).then(result => {
        let jsonResult = eval('(' + result + ')')
        fs.unlinkSync(newPath)
        return Promise.resolve(jsonUtils.getResponseBody(codes.success, {
            class: jsonResult.first[1],
            class_cn: jsonResult.first[2]
        }))
    }).catch(err => {
        fs.unlinkSync(newPath)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    })

}