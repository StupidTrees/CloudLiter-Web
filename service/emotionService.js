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
    return new Promise((resolve, reject) => {
        if (!init) {
            reject()
        } else {
            sentiment.analyze(str, {
                language: 'cn'
            }, function (str) {
                let res = nodejieba.cut(str)
                console.log(res)
                return {segmentation: res, result: res}
            }, function (nul, res) {
                console.log(res)
                resolve({segmentation:res.segmentation, score:res.result.score})
            })
        }

    })

}



