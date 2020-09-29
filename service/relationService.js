const repository = require('../database/userRelationRepository');
const jsonUtils = require('../utils/jsonUtils')
const codes = require('../utils/codes').codes

/**
 * 服务层：关系操作
 */

/**
 * 获取某用户的所有朋友
 * @param id
 * @returns {Promise<{code: *, data: null, message: *}|{code: *, message: *}>}
 */
exports.getFriends = async function (id) {
    return await repository.getFriendsWithId(id).then((value) => {
        let res = []
        value.forEach(function (item, index) {
            let usr = item.get().user.get()
            res.push({
                group: item.get().group,
                user: {
                    username:usr.username,
                    nickname:usr.nickname,
                    id:usr.id,
                    gender:usr.gender,
                    avatar:usr.avatar
                }
            })
        })
        console.log("result", res)
        return Promise.resolve(jsonUtils.getResponseBody(codes.success,res));

    }, (err) => {
        console.log('err', err)
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error,err))
    })
}


/**
 * 建立好友关系
 * @param user1
 * @param user2
 * @returns {Promise<T>}
 */
exports.makeFriends = async function(user1,user2){
    if(user1===user2){
        return Promise.reject(jsonUtils.getResponseBody(codes.make_friends_with_myself))
    }
    return await repository.makeFriends(user1,user2).then((value)=>{
        return Promise.resolve(jsonUtils.getResponseBody(codes.success))
    }).catch((err)=>{
        if(err.original.code==='ER_DUP_ENTRY'){
            return Promise.reject(jsonUtils.getResponseBody(codes.already_friends))
        }else if(err.original.code==='ER_NO_REFERENCED_ROW_2'){
            return Promise.reject(jsonUtils.getResponseBody(codes.make_friends_with_ghost))
        }
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error,err))
    })
}



exports.isFriend = async function(user1,user2){
    return await repository.isFriend(user1,user2).then((count)=>{
        return Promise.resolve(jsonUtils.getResponseBody(codes.success,count>0))
    }).catch((err)=>{
        return Promise.reject(jsonUtils.getResponseBody(codes.other_error,err))
    })
}