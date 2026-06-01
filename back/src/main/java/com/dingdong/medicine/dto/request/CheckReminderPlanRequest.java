package com.dingdong.medicine.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class CheckReminderPlanRequest {
    private Boolean enableThinking;
    private Boolean enableSearch;
    private PlanInfo plan;

    @Data
    public static class PlanInfo {
        private String drugName;
        private String usageMethodLabel;
        private String dailyFrequency;
        private List<String> times;
        private String doseText;
        private String mealTimingLabel;
        private String repeatWeekdaysText;
    }
}
