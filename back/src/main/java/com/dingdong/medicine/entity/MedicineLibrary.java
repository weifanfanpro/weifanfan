package com.dingdong.medicine.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("medicine_library")
public class MedicineLibrary {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String indication;
    private String dosageSummary;
    private String ruleHint;
    private String usageMethod;
    private String mealTiming;
    private Integer dailyFrequency;
    private String warnings;
    private String contraindications;
    private String manufacturer;
    private String approvalNumber;
    private String category;
    private java.math.BigDecimal price;
    private Integer stock;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
