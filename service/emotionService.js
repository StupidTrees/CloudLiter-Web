const Sentiment = require('sentiment')
const fs = require('fs')
const readline = require('readline')
const sentiment = new Sentiment({})
const nodejieba = require("nodejieba");
path = require('path')

let init = false

async function initEmotionAnalyze() {
    return new Promise((resolve, reject) => {
        nodejieba.load()
        let fRead = fs.createReadStream(path.join(__dirname, '../') + 'service/dictionary/汉语情感词极值表.txt');
        let objReadline = readline.createInterface({input: fRead});
        let dict = {}
        objReadline.on('line', line => {
            let word = line.split('\t')[0]
            dict[word] = parseFloat(line.split('\t')[1])
        });
        objReadline.on('close', () => {
            console.log('已加载情感词库');
            const cnrLanguage = {
                labels: dict
            };
            sentiment.registerLanguage('cn', cnrLanguage);
            resolve(sentiment)
        });
    })
}


initEmotionAnalyze().then((() => {
    init = true
}))

exports.analyzeEmotion = function (str) {
    str = str.replace(/\[y[0-9]*\]/g,'') //将表情去除
    return new Promise((resolve, reject) => {
        if (!init) {
            reject()
        } else {
            let tokens = nodejieba.cut(str)
            sentiment.analyze(str, {
                language: 'cn'
            }, function (str) {
                return tokens
            }, function (nul, res) {
                console.log(res)
                resolve({segmentation:tokens, score:res.score})
            })
        }

    })

}

