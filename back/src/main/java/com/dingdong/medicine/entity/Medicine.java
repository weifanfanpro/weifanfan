package com.dingdong.medicine.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("medicines")
public class Medicine {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String indication;
    private String dosageSummary;
    private Boolean isQuantifiable;
    private String doseText;
    private String totalAmountText;
    private String usageMethod;
    private Integer dailyFrequency;
    private String mealTiming;
    private String suggestedSlots;
    private String warnings;
    private String contraindications;
    private LocalDateTime lastScanAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
