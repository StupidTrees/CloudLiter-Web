/**
 * 使用sequelize进行mysql连接
 * */
const Sequelize = require('sequelize');
const config = require('../config').database
exports.DataTypes = Sequelize
exports.Op = Sequelize.Op

/**
 * 构建MySQL连接
 * @type {Sequelize}
 */
exports.sequelize = new Sequelize.Sequelize(config.name,config.username,config.password, {
    host: config.host,
    dialect: 'mysql',
    port: config.port,
    pool: {
        max: 5,
        min: 0,
        idle: 10000
    },
    // define: {
    //     timestamps: true,
    //     createdAt: "created_at",  //自定义时间戳
    //     updatedAt: "updated_at", // 自定义时间戳
    // },
    // timezone: '+08:00', //东八时区
});
