package com.dingdong.medicine.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateReminderPlanRequest {
    @NotNull(message = "userMedicineId不能为空")
    private Long userMedicineId;
    @NotNull(message = "frequency不能为空")
    private Integer frequency;
    @NotNull(message = "times不能为空")
    private List<String> times;
    private String doseValue;
    private String doseUnit;
    private String doseText;
    private String repeatMode;
    private List<String> customWeekdays;
    private String mealTiming;
}
