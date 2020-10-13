/**
 * 定义返回的状态码及message
 * @type {{format_error_gender: {code: number, message: string}, format_error_empty: {code: number, message: string}, format_error_password: {code: number, message: string}, login_wrong_password: {code: number, message: string}, other_error: {code: number, message: string}, success: {code: number, message: string}, signup_other_error: {code: number, message: string}, login_wrong_username: {code: number, message: string}, signup_duplicated_username: {code: number, message: string}, format_error_username: {code: number, message: string}, invalid_token: {code: number, message: string}, other_login_error: {code: number, message: string}}}
 */
exports.codes = {
    success:{
        code:2000,
        message:'成功'
    },
    invalid_token:{
        code:7000,
        message:'token已失效！'
    },
    format_error_username:{
        code:4000,
        message:'用户名长度需大于3！'
    },
    format_error_password:{
        code:4001,
        message:'密码长度至少为8!'
    },
    format_error_gender:{
        code:4003,
        message:'性别取值格式为：MALE/FEMALE'
    },
    format_error_empty:{
        code:4002,
        message:'参数不应为空！'
    },
    login_wrong_username:{
        code:3000,
        message:'用户不存在'
    },
    login_wrong_password:{
        code:3001,
        message:'密码错误'
    },
    other_login_error:{
        code:3003,
        message:'其他登录错误'
    },
    signup_other_error:{
        code:3004,
        message:'其他注册错误'
    },
    signup_duplicated_username:{
        code:3005,
        message:'用户名已存在'
    },
    already_apply:{
        code:3006,
        message:'已发送申请'
    },
    already_friends:{
        code:3007,
        message:'已经是好友啦！'
    },
    make_friends_with_ghost:{
        code:3008,
        message:'添加好友失败，其中有无效用户'
    },
    make_friends_with_myself:{
        code:3009,
        message:'你不能和自己成为好友'
    },
    no_avatar_file:{
        code:3010,
        message:'没有找到头像文件！'
    },
    signature_empty:{
        code:3011,
        message:'修改签名不能输入空串'
    },
    conversation_exists:{
        code:3012,
        message:'会话已经存在'
    },
    conversation_not_exist:{
        code:3013,
        message:'会话不存在'
    },
    relation_not_exists:{
        code:3014,
        message:'关系不存在'
    },
    apply_not_exists:{
        code:3015,
        message:'没有这种好友申请'
    },

    format_error_color:{
        code:3016,
        message:'颜色格式不正确！'
    },
    groupname_exists_error:{
        code:3017,
        message:'组名已存在！'
    },
    not_friend_build_group_error:{
        code:3018,
        message:'不是好友不能加分组！'
    },
    group_not_existed:{
        code:3019,
        message:'小组不存在！'
    },
    not_have_group:{
        code:3020,
        message:'该用户无分组'
    },
    other_error:{
        code:5000,
        message:'其他错误'
    },

}

exports.getFormatEmptyCode = function (message) {
    return {
        code:this.codes.format_error_empty.code,
        message:message
    }
}




