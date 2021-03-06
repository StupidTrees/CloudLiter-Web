const jsonUtils = require("./jsonUtils");
const fs = require("fs");
const {codes} = require("./codes");
/**
 * 读取某文件作为response返回
 * @param path
 */

exports.getFileToResponse = async function (path) {
    try {
        let file = await new Promise((resolve, reject) => {
                //直接生成路径
                //读取文件
                fs.readFile(path, 'binary', function (err, file) {
                    if (err) {
                        reject(err)
                    } else if (file === null) {
                        reject(jsonUtils.getResponseBody(codes.no_chat_image_file))
                    } else {
                        //读取成功
                        resolve(file)
                    }
                })
            }
        ).then((file) => {
            return file
        });
        return Promise.resolve(file)

    } catch
        (e) {
        console.log("error", e)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
}
