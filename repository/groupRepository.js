const models = require('../database/models')
const Op = models.Op
const tools = require('../utils/tools')

const Group = models.Group
const Relation = models.UserRelation
const User = models.User

exports.decideExistingName=function (userId,groupName){
    return Group.findAll(
        {
            where:{
                [Op.and]:[
                    {userId:userId},
                    {groupName:groupName}
                    ]
            }
        }
    )
}
exports.createNewGroup=function(userId,groupName){
    return Group.create(
        {
            userId:userId,
            groupName:groupName,
        }
    )
}
exports.changeGroupNum=function(userId,friendId,groupId){
    let key = tools.getP2PId(userId,friendId)
    return Relation.update({
        groupId:groupId
    },
        {
            where: {
                key:key
            }
        })
}
exports.deleteGroup=function(groupId){
    return Group.destroy(
        {
            where:{
                id:groupId
            }
        }
    ).then((value)=>{
        return Relation.update(
            {
                groupId:null
            },
            {
                where:
                    {
                        groupId:groupId
                    }
            }
        )
    })

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