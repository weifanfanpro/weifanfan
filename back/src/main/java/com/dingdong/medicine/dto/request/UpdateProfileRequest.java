package com.dingdong.medicine.dto.request;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String nickName;
    private String avatarUrl;
    private Integer gender;
}
