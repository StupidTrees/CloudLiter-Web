const models = require('../database/models')
const sequelize = require('../database/connector').sequelize
const Op = models.Op

/**
 * 仓库层：对话表数据读写
 */
const ImageTable = models.ImageTable
const GalleryClassTable = models.GalleryClasses
const FaceTable = models.FacesTable
const ImageFaceTable = models.ImageFaceTable

/**
 * 有长度限制的查询
 * @param userId
 * @param offset
 * @param limit
 * @param key
 */
exports.getImagesOfClass = function (userId, offset, limit, key) {
    return ImageTable.findAll({
        where: {
            [Op.and]: [
                {scene: key},
                {
                    [Op.or]: [
                        {fromId: userId},
                        {toId: userId}
                    ]
                }
            ]

        },
        offset: parseInt(offset),
        limit: parseInt(limit)
    })
}


/**
 * 获取包含朋友人脸的所有照片
 * @param userId
 * @param friendId
 * @param offset
 * @param limit
 */
exports.getImageOfFriend = function (userId, friendId, offset, limit) {
    return sequelize.query(`select distinct i.id
    from image as i,image_face as iff
    where i.id = iff.imageId
        and iff.userId = ${friendId}
        and (i.fromId = ${userId} or i.toId = ${userId})
        limit ${offset},${limit}`)
}


/**
 * 获取userId的所有image信息
 * @param userId
 */
exports.getClassesById = function (userId) {
    return GalleryClassTable.findAll({
        where: {
            userId: userId
        }
    })
}


/**
 * 获取某用户相册里的所有亲友
 * @param userId
 */
exports.getFriendFacesOfUser = function (userId) {
    return sequelize.query(`select distinct iff.userId, u.username, u.nickname,r.remark,u.avatar
    from image as i,image_face as iff, user as u, relation as r, whitelist as w
    where i.id = iff.imageId
        and iff.userId = u.id
        and w.userId = u.id
        and w.whiteId = ${userId}
        and (i.fromId = ${userId} or i.toId = ${userId})
        and r.userId = ${userId}
        and r.friendId = u.id
    `)
}

exports.deleteUserAvatar = function (userId) {
    return sequelize.query(`delete from image where id in (
    select avatar from user where id = ${userId})
    `).catch(e => {

    })
}
exports.deleteChatGroupAvatar = function (groupId) {
    return sequelize.query(`delete from image where id in (
    select avatar from group_chat where id = ${groupId})
    `).catch(e => {

    })
}
/**
 * 将图片记录保存
 */
exports.saveImage = function (fromId, toId, conversationId,filename, sensitive) {
    return ImageTable.create({
        fromId: fromId,
        toId: toId,
        conversationId:conversationId,
        fileName: filename,
        sensitive: sensitive,
    })
}

/**
 * 根据图片id获取图片对象
 */
exports.getImageById = function (imageId) {
    return ImageTable.findByPk(imageId)
}

/**
 * 根据图片id获取图片文件名
 */
exports.getImageFilenameById = function (imageId) {
    return ImageTable.findByPk(
        imageId, {
            attributes: ['fileName']
        }
    )
}


/**
 * 更新图片的分类结果
 * @param imageId
 * @param imageClass
 */
exports.updateSceneById = function (imageId, imageClass) {
    return ImageTable.update({
        "scene": imageClass
    }, {
        where: {
            "id": imageId
        }
    }).then(r => {
        ImageTable.findByPk(imageId)
            .then(value => {
                if (value == null) return
                let image = value.get()
                GalleryClassTable.create(
                    {
                        userId: image.fromId,
                        classKey: image.scene
                    }).then(_ => {
                    GalleryClassTable.create({
                        userId: image.toId,
                        classKey: image.scene
                    })
                })
            })


    })
}


exports.saveFaceInImage = function (imageId, userId, confidence) {
    return ImageFaceTable.create(
        {
            imageId: imageId,
            userId: userId,
            confidence: confidence
        }
    )
}


exports.getFaces = function (userId) {
    return FaceTable.findAll({
        attributes: ['id', 'userId'],
        where: {
            userId: userId
        }
    })
}

/**
 * 获取某人脸entity的文件名
 * @param userId
 * @param faceId
 */
exports.getFaceFilenameById = function (userId, faceId) {
    return FaceTable.findByPk(faceId, {
        attributes: ['pic_name'],
        where: {
            userId: userId
        }
    })
}


exports.deleteFace = function (userId, faceId) {
    return FaceTable.destroy({
        where: {
            [Op.and]: [
                {
                    userId: userId
                },
                {
                    id: faceId
                }
            ]
        }
    })
}
