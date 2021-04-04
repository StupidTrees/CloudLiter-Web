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

/**
 * 分析文本情感
 * @param str 文本
 */
exports.segmentAndAnalyzeEmotion = async function (str) {
    str = str.replace(/\[y[0-9]*\]/g, '') //将表情去除
    return new Promise((resolve, reject) => {
        if (!init) {
            reject()
        } else {
            let analysis = nodejieba.tag(str)
            let tokens = []
            let toWordCloud = []

            analysis.forEach((value) => {
                tokens.push(value.word)
                //如果为名词、动词、形容词，则加入词云
                if (value.word.length >= 3 || value.word.length > 1 && (value.tag.startsWith('n') || value.tag === 'v' || value.tag === 'a' || value.tag === 'x')) {
                    toWordCloud.push(value.word)
                }
            })
            sentiment.analyze(str, {
                language: 'cn'
            }, function (str) {
                return tokens
            }, function (nul, res) {
                resolve({segmentation: tokens, score: res.score, toWordCloud: toWordCloud})
            })
        }

    })

}

