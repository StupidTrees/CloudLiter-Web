path = require('path')

/**
 * 判断某个元素是否在列表中
 * @param search
 * @param array
 * @returns {boolean}
 */
exports.inArray = function (search,array) {
    for (let i in array) {
        if (array[i] === search) {
            return true;
        }
    }
    return false;
}

exports.inPaths = function (search,array){

    for (let i in array) {
        if (array[i].indexOf(search)>=0) {
            return true;
        }
    }
    return false;
}

/**
 * 获得id1-id2这样的id
 * 小id在前，大id在后
 * 对话用的就是这种id
 * @param id1
 * @param id2
 */
exports.getP2PIdOrdered = function(id1,id2){
    let minId = Math.min(id1,id2)
    let maxId = Math.max(id1,id2)
    return minId+'-'+maxId
}

/**
 * 获得id1-id2这样的id
 * @param from
 * @param to
 * @returns {string}
 */
exports.getP2PId = function(from,to){
    return from+'-'+to
}