const models = require('../database/models')
const Op = models.Op
const tools = require('../utils/tools')
const sequelize = require('../database/connector').sequelize
/**
 * 仓库层：对话表数据读写
 */

const GroupChatTable = models.GroupChatTable
const GroupMember = models.GroupMember

exports.createNewGroupChat = function (masterId, name) {
    return GroupChatTable.create({
        master: masterId,
        name: name
    })
}

/**
 * 批量添加群聊用户
 * @param group
 * @param userList
 */
exports.addMembers = function (group, userList) {
    let items = []
    userList.forEach((userId) => {
        items.push({
            groupId: group,
            userId: userId
        })
    })
    console.log("members", items)
    return GroupMember.bulkCreate(items)
}


exports.getGroupById = function (groupId) {
    return GroupChatTable.findByPk(groupId)
}


/**
 * 解散群聊
 * @param groupId
 * @returns {Promise<[undefined, number]>}
 */
exports.destroyGroup = function (groupId) {
    return sequelize.query(`delete from group_member 
    where groupId = ${groupId}`).then(val => {
        return sequelize.query(` delete from conversation 
        where groupId = ${groupId}`).then(val => {
            return sequelize.query(` delete from group_chat 
            where id = ${groupId}`)
        })
    })

}

exports.getAllMembers = function (groupId) {
    return sequelize.query(`
    select gm.nickname as groupNickname,u.nickname as userNickname,u.id as userId,u.avatar as userAvatar
    from group_member as gm, user as u
    where gm.userId = u.id
        and gm.groupId = ${groupId}
    `)
}


exports.renameGroup = function (groupId, name) {
    return sequelize.query(`
    update group_chat
    set name = '${name}'
    where id = ${groupId}`)
}

exports.quitGroup = function (userId, groupId) {
    return sequelize.query(`delete from group_member
    where groupId = ${groupId}
        and userId = ${userId}`)
}


exports.updateGroupAvatar = function (groupId, avatar) {
    return sequelize.query(`
    update group_chat
    set avatar = '${avatar}'
    where id = ${groupId}`)
}
