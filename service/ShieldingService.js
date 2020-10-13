const fs = require('fs')
const FastScanner  = require('fastscan')
const readline = require('readline')

const words = []

async function initScanner(){
    return new Promise((resolve)=>{
        let fRead = fs.createReadStream('service/dictionary/敏感词库.txt');
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

let scanner = null
initScanner().then((value=>{
    scanner = value
}))

/**
 * 检测敏感词
 * @param sentence 句子
 * @returns {boolean} 是否包含敏感词
 */
exports.checkSensitive = function(sentence){
    if(scanner!=null){
        let offWords = scanner.search(sentence);
        console.log(offWords)
        return offWords.length>0
    }
    console.log('敏感词库尚未加载！')
    return false
}



