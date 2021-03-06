const tools = require("../utils/tools");
const UUID = require('uuid');
const fs = require('fs')
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes
const repository = require('../repository/aiRepository');
const imageRepo = require('../repository/imageRepository');
const repositoryMessage = require('../repository/messageRepository')
const relationRepository = require('../repository/userRelationRepository')
const userRepository = require('../repository/userRepository')
const config = require('../config')
const AipSpeech = require("baidu-aip-sdk").speech;
// 设置APPID/AK/SK
const ffmpeg = require('fluent-ffmpeg');
const emotionService = require('./emotionService')
const shieldingService = require('./shieldingService')
const textUtils = require('../utils/textUtils')
const APP_ID = "23720221";
const API_KEY = "xQemIBbMnIGGiS6aKuYIKDMy";
const SECRET_KEY = "iPEecYnESGkK99S6MheGGaemEKs4RX5c";


/**
 * 人脸识别
 * @param userId
 * @param imageId
 * @param rects
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.faceRecognize = async function (userId, imageId, rects) {
    let filename = null
    try {
        let tmp = await imageRepo.getImageFilenameById(imageId)
        filename = tmp.get().fileName
    } catch (err) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    }

    let targetPath = path.join(__dirname, '../') + config.files.chatImageDir + filename
    let params = {userId: userId, imagePath: targetPath, rects: rects}
    return repository.faceRecognizeR(params).then(result => {
        return fillRecognitionInfo(imageId, userId, result)
    }).catch(err => {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    })
}

async function fillRecognitionInfo(imageId, userId, result) {
    let jsonResult = JSON.parse(result)
    let finalResult = []
    for (let i = 0; i < jsonResult.length; i++) {
        try {
            let item = jsonResult[i]
            let cache = {}
            let itemResult = item.result[0]
            cache.imageId = imageId
            cache.rectId = item.id
            cache.userId = itemResult.uid
            cache.confidence = 1.0 - itemResult.distance
            //if (cache.confidence < 0.4) continue
            if (userId.toString() === cache.userId) {
                let data = userRepository.getUserById(userId)
                if (textUtils.isEmpty(data[0].get().nickname)) {
                    cache.userName = data[0].get().username
                } else {
                    cache.userName = data[0].get().nickname
                }
            } else {
                await imageRepo.saveFaceInImage(imageId, cache.userId, cache.confidence)
                let rel = await relationRepository.queryRemarkWithId(userId, cache.userId)
                cache.userName = rel[0].get().remark
                let userData = rel[0].get().user
                if (textUtils.isEmpty(rel[0].get().remark)) {
                    if (textUtils.isEmpty(userData.get().nickname)) {
                        cache.userName = userData.get().username
                    }
                    cache.userName = userData.get().nickname
                }
            }
            finalResult.push(cache)
        } catch (err) {
            console.log(err)
        }
    }
    return Promise.resolve(jsonUtils.getResponseBody(codes.success, finalResult))
}

/**
 * 将图片路径发往ai分类进程
 * @param fileAbsolutePath
 * @param imageId
 * @param unlinkAfterSuccess
 * @returns {Promise<{code: *, data: null, message: *} | {code: *, message: *}>}
 */
function sendImageDirToClassifyService(fileAbsolutePath, imageId = null, unlinkAfterSuccess = true) {
    let params = {message: fileAbsolutePath}
    return repository.imageClassify(params).then(result => {
        let jsonResult = eval('(' + result + ')')
        if (unlinkAfterSuccess) {
            fs.unlinkSync(fileAbsolutePath)
        }
        let data = {
            class: jsonResult.first[1],
            class_cn: jsonResult.first[2]
        }
        if (imageId !== null) {
            imageRepo.updateSceneById(imageId, JSON.stringify(data)).then()
        }
        return Promise.resolve(jsonUtils.getResponseBody(codes.success, data))
    }).catch(err => {
        if (unlinkAfterSuccess) {
            fs.unlinkSync(fileAbsolutePath)
        }
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, err))
    })
}

/**
 * 人脸上传
 * @param userId
 * @param files
 */
exports.faceUpload = async function (userId, files) {
    // 手动给文件加后缀, formidable默认保存的文件是无后缀的
    let fileName = "face_userId_" + UUID.v1() + path.extname(files.upload.name)
    let newPath = path.dirname(files.upload.path) + '/' + fileName
    await fs.renameSync(files.upload.path, newPath)
    let params = {userId: userId, imagePath: newPath}
    return repository.faceUploadR(params).then(result => {
        let res = JSON.parse(result)
        fs.unlinkSync(newPath)
        if(res['state']==='no_face'){
            return Promise.reject(jsonUtils.getResponseBody(codes.face_not_found))
        } else{
            return Promise.resolve(jsonUtils.getResponseBody(codes.success))
        }
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
                    //console.log(err);
                    fs.unlinkSync(catchPath)
                    fs.unlinkSync(newPath)
                    reject(jsonUtils.getResponseBody(codes.other_error, err))
                });
            })
            .on('error', function (err) {
                //console.log('an error happened: ' + err.message);
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
        //console.log('from database')
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
                            //console.log(res)
                            res.ttsResult = result.result[0]
                            res.sensitive = sensitive
                            res.emotion = emotion.score
                            repositoryMessage.setTTSResult(id, result.result[0], emotion.score, sensitive)
                            resolve(jsonUtils.getResponseBody(codes.success, res))
                        }).catch(err => {
                            //console.table(err)
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
    return sendImageDirToClassifyService(newPath, null, true)
}


/**
 * 图像场景分类
 * @param imageId
 */
exports.imageClassify = async function (imageId) {
    let value = null
    try {
        value = await imageRepo.getImageById(imageId)
    } catch (e) {
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error, e))
    }
    if (!value) {
        return Promise.reject(jsonUtils.getResponseBody(codes.conversation_not_exist))
    }
    //直接返回永久缓存
    if (!textUtils.isEmpty(value.get().scene)) {
        return Promise.resolve(jsonUtils.getResponseBody(codes.success, JSON.parse(value.get().scene)))
    }
    let filename = value.get().fileName
    let targetPath = path.join(__dirname, '../') + config.files.chatImageDir + filename
    return sendImageDirToClassifyService(targetPath, imageId, false)
}