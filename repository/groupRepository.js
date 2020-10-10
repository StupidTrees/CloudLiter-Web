const models = require('../database/models')
const Op = models.Op
const tools = require('../utils/tools')

const Group = models.Group
const Relation = models.UserRelation
const User = models.User

exports.createNewGroup=function(userId,groupName){
    return Group.create(
        {
            userId:userId,
            groupName:groupName,
        }
    )
}
exports.changeGroupNum=function(userId,friendId,groupId){
    return Relation.update({
        groupId:groupId
    },
        {
            where: {
                [Op.and]:[
                    {
                        userId:userId
                    },
                    {
                        friendId:friendId
                    }
                ]
            }
        })
}
exports.deleteGroup=function(id){
    return Group.destroy(
        {
            where:
                {
                    id:id
                }
        }
    )
}
exports.findAllGroup=function(userId){
    return Group.findAll(
        {
            where:{
                userId:userId
            }
        }
    )
}