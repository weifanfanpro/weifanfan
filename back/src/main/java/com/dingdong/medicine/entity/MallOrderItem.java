package com.dingdong.medicine.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("mall_order_items")
public class MallOrderItem {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String orderId;
    private String productId;
    private String productName;
    private String coverUrl;
    private Integer pointsPrice;
    private Integer quantity;
}
