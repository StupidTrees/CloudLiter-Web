// const database = require('database');
// const connection = database.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '1234',
//     database: 'bountter',
// });
//
// connection.connect();
// exports.get_connection = function () {
//     return connection
// }


const Sequelize = require('sequelize');
exports.DataTypes = Sequelize
exports.Op = Sequelize.Op


exports.sequelize = new Sequelize.Sequelize('hichat', 'root', '1234', {
    host: 'localhost',
    dialect: 'mysql',
    port: 3306,
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
