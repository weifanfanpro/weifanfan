package com.dingdong.medicine.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("user_shipping_addresses")
public class UserShippingAddress {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String addressId;
    private String openid;
    private String receiver;
    private String phone;
    private String region;
    private String detail;
    private String tag;
    private Boolean isDefault;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
