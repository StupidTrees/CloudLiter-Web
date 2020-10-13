const models = require('../database/models')
const Op = models.Op
const tools = require('../utils/tools')

const Group = models.Group
const Relation = models.UserRelation
const User = models.User

/**
 * 判断该用户是否使用了groupName这个组名，防止重复
 * @param userId
 * @param groupName
 * @returns {Promise<Model<TModelAttributes, TCreationAttributes>[]>}
 */
exports.isExistingName = function (userId, groupName) {
    return Group.findAll(
        {
            where: {
                [Op.and]: [
                    {userId: userId},
                    {groupName: groupName}
                ]
            }
        }
    )
}

/**
 * 根据给的组名创建新的group
 * @param userId
 * @param groupName
 * @returns {Promise<Model<TModelAttributes, TCreationAttributes>>}
 */
exports.createNewGroup = function (userId, groupName) {
    return Group.create(
        {
            userId: userId,
            groupName: groupName,
        }
    )
}

/**
 * 判断某个人是否为好友，不是好友不能指定分组
 * @param userId
 * @param friendId
 * @returns {Promise<Model<TModelAttributes, TCreationAttributes>[]>}
 */
exports.isFriend = function (userId, friendId) {
    let key = tools.getP2PId(userId, friendId)
    return Relation.findAll(
        {
            where: {
                key:key
            }
        }
    )
}

/**
 * 给用户的某个好友分配一个groupId，用于指定分组
 * @param userId
 * @param friendId
 * @param groupId
 * @returns {Promise<[number, Model<TModelAttributes, TCreationAttributes>[]]>}
 */
exports.changeGroupNum = function (userId, friendId, groupId) {
    let key = tools.getP2PId(userId, friendId)
    return Relation.update({
            group: groupId
        },
        {
            where: {
                key: key
            }
        })
}

/**
 * 判断某个分组是否存在
 * @param groupId
 * @returns {Promise<Model<TModelAttributes, TCreationAttributes>[]>}
 */
exports.isGroupExisted = function (groupId) {
    return Group.findAll(
        {
            where: {
                id: groupId
            }
        }
    )
}

/**
 * 根据给出的组号删除分组
 * @param groupId
 * @returns {Promise<number>}
 */
exports.deleteGroup = function (groupId) {
    return Group.destroy(
        {
            where: {
                id: groupId
            }
        }
    ).then((value) => {
        return Relation.update(
            {
                group: null
            },
            {
                where:
                    {
                        group: groupId
                    }
            }
        )
    })

}

/**
 * 找到该用户的所有分组信息
 * @param userId
 * @returns {Promise<Model<TModelAttributes, TCreationAttributes>[]>}
 */
exports.findAllGroup = function (userId) {
    return Group.findAll(
        {
            where: {
                userId: userId
            }
        }
    )
}