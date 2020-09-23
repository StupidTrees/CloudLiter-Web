const con = require("./connector");
const Op = con.Op
const DataTypes = con.DataTypes

const User = con.sequelize.define(
    'user', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique:true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        gender:{
            type:DataTypes.ENUM('MALE','FEMALE'),
            allowNull:false
        },
        nickname:{
            type:DataTypes.STRING,
            allowNull:true
        },
        signature:{
            type:DataTypes.STRING,
            allowNull:true
        },
        createdAt:{
            type:DataTypes.DATE
        },
        updatedAt:{
            type:DataTypes.DATE
        }
    },
    {
        tableName:'user'
    }
);
User.sync({force: false}).then(r=>r)



exports.getUserById = async function (id) {
    return await User.findAll({
        where: {
            id: {
                [Op.eq]: id
            }
        }
    })
}

/**
 * 插入用户
 * @param username
 * @param password
 * @param gender
 * @param nickname
 * @returns {Promise<Model<any, any>>}
 */
exports.createUser = function (username, password, gender, nickname) {
    return User.create(
        {
            username:username,
            password:password,
            gender:gender,
            nickname:nickname,
        }
    )
}

/**
 * 根据用户名获取用户对象
 * @param username
 * @returns {Promise<Model<TModelAttributes, TCreationAttributes>[]>}
 */
exports.getUserByUsername = function(username){
    return User.findAll({
        where:{
            username:{
                [Op.eq]:username
            }
        }
    })
}
