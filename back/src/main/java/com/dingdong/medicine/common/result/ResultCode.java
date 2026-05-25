package com.dingdong.medicine.common.result;

import lombok.Getter;

@Getter
public enum ResultCode {
    SUCCESS(0, "ok"),
    UNAUTHORIZED(1001, "未登录"),
    TOKEN_EXPIRED(1002, "Token过期"),
    PARAM_ERROR(2001, "参数错误"),
    BIZ_ERROR(3001, "业务异常"),
    SYSTEM_ERROR(500, "系统繁忙，请稍后再试");

    private final int code;
    private final String message;

    ResultCode(int code, String message) {
        this.code = code;
        this.message = message;
    }
}
