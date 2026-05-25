package com.dingdong.medicine.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("mall_products")
public class MallProduct {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String productId;
    private String name;
    private String description;
    private String coverUrl;
    private Integer pointsPrice;
    private java.math.BigDecimal cashPrice;
    private java.math.BigDecimal originalPrice;
    private Integer stock;
    private Integer salesCount;
    private java.math.BigDecimal rating;
    private String category;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
