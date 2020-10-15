const Sentiment = require('sentiment')
const sentiment = new Sentiment({

})
const nodejieba = require("nodejieba");

const cnrLanguage = {
    labels: {
        '愚蠢': -2,
        '笨蛋':-1.8
    }
};
sentiment.registerLanguage('cn', cnrLanguage);
sentiment.analyze("南京长江大桥",{
    language:cnrLanguage
},function (str) {
    return nodejieba.cut(str);
},function (res) {
    console.log(res)
})