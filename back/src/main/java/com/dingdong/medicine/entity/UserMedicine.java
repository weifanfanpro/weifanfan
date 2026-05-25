package com.dingdong.medicine.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("user_medicines")
public class UserMedicine {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String ownerOpenid;
    private String actorOpenid;
    private Long medicineId;
    private String name;
    private String rule;
    private Boolean isQuantifiable;
    private String doseText;
    private String totalAmountText;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
