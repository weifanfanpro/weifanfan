package com.dingdong.medicine.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SaveAddressRequest {
    private String addressId;
    @NotBlank(message = "收件人不能为空")
    private String receiver;
    @NotBlank(message = "手机号不能为空")
    private String phone;
    @NotBlank(message = "省市区不能为空")
    private String region;
    @NotBlank(message = "详细地址不能为空")
    private String detail;
    private String tag;
    private Boolean isDefault;
}
