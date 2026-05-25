package com.dingdong.medicine.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreatePendingRequest {
    @NotBlank(message = "ownerOpenid不能为空")
    private String ownerOpenid;
    @NotBlank(message = "name不能为空")
    private String name;
    private Boolean isQuantifiable;
    private String doseText;
    private String totalAmountText;
    private String rule;
    private DraftPlan draftPlan;

    @Data
    public static class DraftPlan {
        private Integer frequency;
        private List<String> times;
        private String doseValue;
        private String doseUnit;
        private String doseText;
        private String repeatMode;
        private List<String> customWeekdays;
        private String mealTiming;
    }
}
