const fs = require('fs')
const FastScanner = require('fastscan')
const readline = require('readline')
const tf = require('@tensorflow/tfjs-node')
const nsfw = require('nsfwjs')
const config = require("../config");


const words = []

async function initScanner() {
    return new Promise((resolve) => {
        let fRead = fs.createReadStream(path.join(__dirname, '../') + 'service/dictionary/敏感词库.txt');
        let objReadline = readline.createInterface({input: fRead});
        objReadline.on('line', line => {
            words.push(line);
        });
        objReadline.on('close', () => {
            console.log('已加载敏感词库');
            const scanner = new FastScanner(words);
            resolve(scanner)
        });
    })

}

async function initFWJS() {
    let modelPath ='file://'+ path.join(__dirname, '../') + config.files.nsfwModelDir.split('/').join(path.sep)
    console.log(modelPath)
    const model = await nsfw.load(modelPath,{ size: 299 })
    console.log('已加载敏感图片识别模块');
    return Promise.resolve(model)
}

let scanner = null
initScanner().then((value => {
    scanner = value
}))
let fwjsModel = null
initFWJS().then((value => {
    fwjsModel = value
})).catch(e => {
    console.log("加载敏感图识别失败", e)
})

/**
 * 检测敏感词
 * @param sentence 句子
 * @returns {boolean} 是否包含敏感词
 */
exports.checkSensitive = async function (sentence) {
    if (scanner != null) {
        let offWords = scanner.search(sentence);
        console.log(offWords)
        return Promise.resolve(offWords.length > 0)
    }
    console.log('敏感词库尚未加载！')
    return Promise.reject()
}

/**
 * 检测敏感图
 * @param img
 */
exports.checkSensitiveImg = async function (img) {
    if (fwjsModel != null) {

        const image = await tf.node.decodeImage(img, 3)
        const predictions = await fwjsModel.classify(image)
        image.dispose() // Tensor memory must be managed explicitly (it is not sufficient to let a tf.Tensor go out of scope for its memory to be released).
        //console.log(predictions)
        let res = {}
        predictions.forEach(function (item) {
            res[item.className] = item.probability
        })
        return res
    } else {
        console.log('敏感图片检测模型尚未加载！')
        return Promise.reject()
    }

}



