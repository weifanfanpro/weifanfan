package com.dingdong.medicine.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("user_points_wallet")
public class UserPointsWallet {
    @TableId(type = IdType.INPUT)
    private String openid;
    private Integer pointsBalance;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
