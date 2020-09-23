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




