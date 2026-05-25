package com.dingdong.medicine.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("family_pending_medicines")
public class FamilyPendingMedicine {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String ownerOpenid;
    private String actorOpenid;
    private String name;
    private String rule;
    private Boolean isQuantifiable;
    private String doseText;
    private String totalAmountText;
    private String draftPlan;
    private String status;
    private LocalDateTime activatedAt;
    private LocalDateTime ignoredAt;
    private String activatedBy;
    private Long userMedicineId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
