path = require('path')
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