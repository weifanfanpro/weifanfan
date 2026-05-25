package com.dingdong.medicine.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("reminders")
public class Reminder {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String ownerOpenid;
    private String actorOpenid;
    private Long userMedicineId;
    private String medicineName;
    private String time;
    private String startDate;
    private String doseValue;
    private String doseUnit;
    private String doseText;
    private String repeatMode;
    private String customWeekdays;
    private Boolean notifyWechat;
    private Boolean notifyRing;
    private Boolean notifyVibrate;
    private Integer dailyFrequency;
    private String mealTiming;
    private String planId;
    private LocalDateTime createdAt;
}
