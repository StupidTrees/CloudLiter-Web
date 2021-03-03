/**
 * 存放配置信息
 */

module.exports = {
    port: 3000,
    database:{
        name:'hichat',
        username:'cloudliter',
        password:'CloudLight2,',
        host:'localhost',
        port:3306
    },
    files:{
        avatarDir:'files/img/avatar/',
        chatImageDir:'files/img/chat/',
        chatVoiceDir:'files/voice/chat/',
        nsfwModelDir:'service/model/',
        cacheDir:'files/img/cache'
    }
}