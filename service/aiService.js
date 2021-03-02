const tools = require("../utils/tools");
const UUID = require('uuid');
const fs = require('fs')
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes
const repository = require('../repository/aiRepository');
const repositoryMessage = require('../repository/messageRepository')
const config = require('../config')
const AipSpeech = require("baidu-aip-sdk").speech;
// 设置APPID/AK/SK
const ffmpeg = require('fluent-ffmpeg');
const emotionService = require('./emotionService')
const shieldingService = require('./shieldingService')

const APP_ID = "23720221";
const API_KEY = "xQemIBbMnIGGiS6aKuYIKDMy";
const SECRET_KEY = "iPEecYnESGkK99S6MheGGaemEKs4RX5c";


//将图片路径发往ai分类进程
function sendImageDirToClassifyService(fileAbsolutePath, unlinkAfterSuccess = true) {
    let params = {message: fileAbsolutePath}
    return repository.imageClassify(params).then(result => {
        let jsonResult = eval('(' + result + ')')
        if (unlinkAfterSuccess) {
            fs.unlinkSync(fileAbsolutePath)
        }

        return Promise.resolve(jsonUtils.getResponseBody(codes.success, {
            class: jsonResult.first[1],
            class_cn: jsonResult.first[2]
        }))
    }).catch(err => {
        if (unlinkAfterSuccess) {
            fs.unlinkSync(fileAbsolutePath)
        }
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    })
}


/**
 * 语音直接转文字（不保存文件）
 * @param files
 */
exports.dirTTS = async function (files) {
    // 手动给文件加后缀, formidable默认保存的文件是无后缀的
    let fileName = 'temporary' + UUID.v1() + path.extname(files.upload.name)
    let newPath = path.dirname(files.upload.path) + '/' + fileName
    await fs.renameSync(files.upload.path, newPath)
    let catchPath = newPath + 'voice.wav'
    return new Promise((resolve, reject) => {
        let client = new AipSpeech(APP_ID, API_KEY, SECRET_KEY);
        ffmpeg(newPath)
            .on('end', function () {
                //console.log('file has been converted succesfully');
                let voice = fs.readFileSync(catchPath);
                let voiceBuffer = new Buffer(voice);
                client.recognize(voiceBuffer, 'wav', 16000).then(function (result) {
                    //console.log(': ' + JSON.stringify(result));
                    fs.unlinkSync(catchPath)
                    fs.unlinkSync(newPath)
                    resolve(jsonUtils.getResponseBody(codes.success, {result: result.result[0]}))
                }, function (err) {
                    console.log(err);
                    fs.unlinkSync(catchPath)
                    fs.unlinkSync(newPath)
                    reject(jsonUtils.getResponseBody(codes.other_error, err))
                });
            })
            .on('error', function (err) {
                console.log('an error happened: ' + err.message);
                fs.unlinkSync(catchPath)
                fs.unlinkSync(newPath)
                reject(err)
            })
            .save(catchPath);
    })
}

/**
 * 语音记录转文字
 * @param id 记录id
 */
exports.voiceToWords = async function (id) {
    let value = null
    try {
        value = await repositoryMessage.getMessageById(id)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    if (value == null) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error))
    }
    if (value.length === 0) {
        return Promise.reject(jsonUtils.getResponseBody(codes.conversation_not_exist))
    }
    if (value[0].get().ttsResult !== null) {
        console.log('from database')
        return Promise.resolve(jsonUtils.getResponseBody(codes.success, value[0].get()))
    }

    let filename = value[0].get().content
    let targetPath = path.join(__dirname, '../') + config.files.chatVoiceDir + filename
    let catchPath = path.join(__dirname, '../') + config.files.chatVoiceDir + filename + 'voice.wav'
    return new Promise((resolve, reject) => {
        let client = new AipSpeech(APP_ID, API_KEY, SECRET_KEY);
        ffmpeg(targetPath)
            .on('end', function () {
                let voice = fs.readFileSync(catchPath);
                let voiceBuffer = new Buffer(voice);
                client.recognize(voiceBuffer, 'wav', 16000).then(function (result) {
                    if (result.result === undefined || result.result === null || result.result.length === 0) {
                        reject(jsonUtils.getResponseBody(codes.other_error))
                        return
                    }
                    fs.unlinkSync(catchPath)
                    emotionService.segmentAndAnalyzeEmotion(result.result[0]).then(emotion => {
                        //console.log('value:'+value.score)
                        shieldingService.checkSensitive(result.result[0]).then(sensitive => {
                            //console.log('vv:'+value.score)
                            let res = value[0].get()
                            console.log(res)
                            res.ttsResult = result.result[0]
                            res.sensitive = sensitive
                            res.emotion = emotion.score
                            repositoryMessage.setTTSResult(id, result.result[0], emotion.score, sensitive)
                            resolve(jsonUtils.getResponseBody(codes.success, res))
                        }).catch(err => {
                            console.table(err)
                            reject(jsonUtils.getResponseBody(codes.other_error, err))
                        })
                    }).catch(err => {
                        reject(jsonUtils.getResponseBody(codes.other_error, err))
                    })

                }, function (err) {
                    //console.log(err);
                    fs.unlinkSync(catchPath)
                    reject(jsonUtils.getResponseBody(codes.other_error, err))
                });
            })
            .on('error', function (err) {
                fs.unlinkSync(catchPath)
                reject(err)
            })
            .save(catchPath);
    })
}


/**
 * 图像场景分类
 * @param files 客户端传来的图像文件
 */
exports.imageClassifyDir = async function (files) {
    let newPath = path.dirname(files.upload.path) + '/' + UUID.v1() + ".jpg"
    await fs.renameSync(files.upload.path, newPath)
    return sendImageDirToClassifyService(newPath)
}


/**
 * 图像场景分类
 * @param msgId 聊天id
 */
exports.imageClassify = async function (msgId) {
    let value = null
    try {
        value = await repositoryMessage.getMessageById(msgId)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    if (value == null || value.length === 0) {
        return Promise.reject(jsonUtils.getResponseBody(codes.conversation_not_exist))
    }
    let filename = value[0].get().content
    let targetPath = path.join(__dirname, '../') + config.files.chatImageDir + filename
    return sendImageDirToClassifyService(targetPath, false)
}