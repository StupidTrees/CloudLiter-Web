let AipSpeech = require("baidu-aip-sdk").speech;
// 设置APPID/AK/SK
let APP_ID = "23720221";
let API_KEY = "xQemIBbMnIGGiS6aKuYIKDMy";
let SECRET_KEY = "iPEecYnESGkK99S6MheGGaemEKs4RX5c";

let client = new AipSpeech(APP_ID,API_KEY,SECRET_KEY);
let fs = require('fs');
//let voice = fs.readFileSync('/home/webapp/hichat/routes/16k_10.pcm');
//let voiceBuffer = new Buffer(voice);
let ffmpeg = require('fluent-ffmpeg');
ffmpeg('/home/webapp/hichat/routes/test2.m4a')
    .on('end', function() {
        console.log('file has been converted succesfully');
    })
    .on('error', function(err) {
        console.log('an error happened: ' + err.message);
    })
    .save('/home/webapp/hichat/routes/test3.wav');
let voice = fs.readFileSync('/home/webapp/hichat/routes/test2.wav');
let voiceBuffer = new Buffer(voice);
client.recognize(voiceBuffer,'pcm',16000).then(function (result) {
    console.log(': ' + JSON.stringify(result));
},function (err) {
    console.log(err);
});
