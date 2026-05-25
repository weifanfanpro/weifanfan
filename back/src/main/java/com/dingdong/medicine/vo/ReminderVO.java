package com.dingdong.medicine.vo;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReminderVO {
    private Long id;
    private String ownerOpenid;
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
}
