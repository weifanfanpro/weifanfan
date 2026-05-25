package com.dingdong.medicine.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class WxLoginRequest {
    @NotBlank(message = "code不能为空")
    private String code;
    private String nickName;
    private String avatarUrl;
}
