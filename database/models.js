const con = require("./connector");
const DataTypes = con.DataTypes
exports.Op = con.Op
/**
 * 此文件用于定义所有需要用到的实体类型（即数据表对应的模型）
 */


/**
 * 用户表
 */
exports.User = con.sequelize.define(
    'user', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        gender: {
            type: DataTypes.ENUM('MALE', 'FEMALE'),
            allowNull: false
        },
        nickname: {
            type: DataTypes.STRING,
            allowNull: true
        },
        signature: {
            type: DataTypes.STRING,
            allowNull: true
        },
        avatar: {
            type: DataTypes.STRING,
            allowNull: true
        },
        type: {
            type: DataTypes.INTEGER,//
            allowNull: false,
            default:0
        },
        subType: {
            type: DataTypes.STRING,
            allowNull: true
        },
        typePermission: {
            type: DataTypes.ENUM('PRIVATE','PUBLIC','PROTECTED'),
            allowNull: false,
            default:'PUBLIC'
        },
        createdAt: {
            type: DataTypes.DATE
        },
        updatedAt: {
            type: DataTypes.DATE
        }
    },
    {
        tableName: 'user'
    }
);

//将定义好的模型同步到吧 数据表，不强制覆盖
this.User.sync({force: false}).then(r => r)
exports.Group = con.sequelize.define(
    'group', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.BIGINT
            // references:'user', //关联表名
            // referencesKey:'id' //关联表的列名
        },
        groupName: {
            type: DataTypes.STRING,
            // references:'user', //关联表名
            // referencesKey:'id' //关联表的列名
        },
        createdAt: {
            type: DataTypes.DATE
        },
        updatedAt: {
            type: DataTypes.DATE
        }
    }
)
this.Group.belongsTo(this.User, {
    foreignKey: 'userId',
    targetKey: 'id',
    as: 'user'
})
this.Group.sync({force: false}).then(r => r)

/**
 * 用户好友关系表
 */
exports.UserRelation = con.sequelize.define(
    'relation', {
        key: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        userId: {
            type: DataTypes.BIGINT,
            // references:'user', //关联表名
            // referencesKey:'id' //关联表的列名
        },
        friendId: {
            type: DataTypes.BIGINT,
            // references:'user', //关联表名
            // referencesKey:'id' //关联表的列名
        },
        remark: {
            type: DataTypes.STRING
            //备注
        },
        groupId: {
            type: DataTypes.BIGINT
        },
        createdAt: {
            type: DataTypes.DATE
        },
        updatedAt: {
            type: DataTypes.DATE
        }
    },
    {
        tableName: 'relation'
    }
);

this.User.hasMany(this.UserRelation, {
    foreignKey: 'id',
    targetKey: 'userId'
})


//将关系表的friend字段声明为外键，映射到用户表的id
this.UserRelation.belongsTo(this.User, {
    foreignKey: 'friendId',
    targetKey: 'id',
    as: 'user'
})

this.UserRelation.belongsTo(this.Group, {
    foreignKey: 'groupId',
    targetKey: 'id',
    as: 'group'
})

//将定义好的模型同步到数据表，不强制覆盖
this.UserRelation.sync({force: false}).then(r => r)

/**
 * 会话表
 */
exports.Conversation = con.sequelize.define(
    'conversation', {
        key: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        user1Id: {
            type: DataTypes.BIGINT
        },
        user2Id: {
            type: DataTypes.BIGINT
        },
        relation1Id: {
            type: DataTypes.STRING
        },
        relation2Id: {
            type: DataTypes.STRING
        },
        lastMessage: {
            type: DataTypes.STRING
        },
        createdAt: {
            type: DataTypes.DATE
        },
        updatedAt: {
            type: DataTypes.DATE
        }
    },
    {
        tableName: 'conversation'
    }
);

this.Conversation.belongsTo(this.User, {
    foreignKey: 'user1Id',
    targetKey: 'id',
    as: 'user1'
})
this.Conversation.belongsTo(this.UserRelation, {
    foreignKey: 'relation1Id',
    as: 'relation1',
    targetKey: 'key'
})
this.Conversation.belongsTo(this.UserRelation, {
    foreignKey: 'relation2Id',
    targetKey: 'key',
    as: 'relation2'
})
this.Conversation.belongsTo(this.User, {
    foreignKey: 'user2Id',
    targetKey: 'id',
    as: 'user2'
})
this.Conversation.sync({force: false}).then(r => r)

/**
 * 好友事件表
 */
exports.RelationEvent = con.sequelize.define(
    'relationEvent', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true
            //userId-friendId
        },
        userId: {
            type: DataTypes.BIGINT
        },
        friendId: {
            type: DataTypes.BIGINT
        },
        state: {
            type: DataTypes.ENUM('REQUESTING', 'ACCEPTED', 'REJECTED', 'DELETE','DIRECT'),
            allowNull: false
        },
        read: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        responseRead: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        },
        createdAt: {
            type: DataTypes.DATE
        },
        updatedAt: {
            type: DataTypes.DATE
        }
    },
    {
        tableName: 'relationEvent'
    }
)

this.RelationEvent.belongsTo(this.User, {
    foreignKey: 'userId',
    targetKey: 'id',
    as: 'user1'
})
this.RelationEvent.belongsTo(this.User, {
    foreignKey: 'friendId',
    targetKey: 'id',
    as: 'user2'
})
this.RelationEvent.sync({force: false}).then(r => r)


/**
 * 聊天记录表
 */
exports.Message = con.sequelize.define(
    'message', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },
        fromId: {
            type: DataTypes.BIGINT
        },
        toId: {
            type: DataTypes.BIGINT
        },
        content: {
            type: DataTypes.STRING
        },
        conversationId: {
            type: DataTypes.STRING
        },
        relationId: {
            type: DataTypes.STRING
        },
        read: {
            type: DataTypes.BOOLEAN
        },
        sensitive: {
            type: DataTypes.BOOLEAN
        },
        type:{
            type:DataTypes.ENUM('TXT','IMG','VOICE'),
            default: 'TXT'
        },
        emotion: {
            type: DataTypes.FLOAT
        },
        extra:{
          type:DataTypes.STRING
        },
        ttsResult:{
            type:DataTypes.STRING
        },
        createdAt: {
            type: DataTypes.DATE
        },
        updatedAt: {
            type: DataTypes.DATE
        }
    },
    {
        tableName: 'message'
    }
);


this.Message.belongsTo(this.User, {
    foreignKey: 'fromId',
    targetKey: 'id',
    as: 'fromUser'
})

this.Message.belongsTo(this.User, {
    foreignKey: 'toId',
    targetKey: 'id',
    as: 'toUser'
})

this.Message.belongsTo(this.Conversation, {
    foreignKey: 'conversationId',
    targetKey: 'key',
    as: 'conversation'
})

this.Message.belongsTo(this.UserRelation, {
    foreignKey: 'relationId',
    targetKey: 'key',
    as: 'relation'
})

this.Message.sync({force: false}).then(r => r)


exports.wordCloudBin = con.sequelize.define(
    'wordCloudBin',{
        type: {
            type: DataTypes.ENUM('USER','CONVERSATION')
        },
        key:{
            type:DataTypes.STRING
        },
        word: {
            type: DataTypes.STRING
        },
        num: {
            type: DataTypes.BIGINT
        }
    }
)
this.wordCloudBin.sync({force: false}).then( r => r)

exports.wordTop10 = con.sequelize.define(
    'wordTop10',{
        type:{
            type:DataTypes.ENUM('CONV','USER')
        },
        cloudId:{
            type:DataTypes.STRING,
            primaryKey: true
        },
        Top1:{
            type:DataTypes.STRING
        },
        Top2:{
            type:DataTypes.STRING
        },
        Top3:{
            type:DataTypes.STRING
        },
        Top4:{
            type:DataTypes.STRING
        },
        Top5:{
            type:DataTypes.STRING
        },
        Top6:{
            type:DataTypes.STRING
        },
        Top7:{
            type:DataTypes.STRING
        },
        Top8:{
            type:DataTypes.STRING
        },
        Top9:{
            type:DataTypes.STRING
        },
        Top10:{
            type:DataTypes.STRING
        },
        flag:{
            type:DataTypes.INTEGER
        },
        private:{
            type:DataTypes.BOOLEAN,
            default:false
        }
    }
)
this.wordTop10.sync({force: false}).then( r => r)