package com.dingdong.medicine.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("mall_orders")
public class MallOrder {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String orderId;
    private String openid;
    private String status;
    private Integer pointsCost;
    private Integer pointsBalanceAfter;
    private String addressSnapshot;
    private String statusTimeline;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
