const models = require('../database/models')
const Op = models.Op
const tools = require('../utils/tools')
/**
 * 仓库层：对话表数据读写
 */

const GroupChatTable = models.GroupChatTable
const GroupMember = models.GroupMember

exports.createNewGroupChat = function (masterId,name){
    return GroupChatTable.create({
        master: masterId,
        name: name
    })
}

/**
 * 批量添加群聊用户
 * @param userList
 * @returns {Promise<Model[]>}
 */
exports.addMembers = function (userList){
    return GroupMember.bulkCreate(userList)
}