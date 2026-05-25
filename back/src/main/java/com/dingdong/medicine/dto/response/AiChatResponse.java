package com.dingdong.medicine.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiChatResponse {
    private Long sessionId;
    private String title;
    private String content;
    private String reasoning;
    private Boolean deepThinking;
    private Suggestion suggestion;

    @Data
    @Builder
    public static class Suggestion {
        private Boolean reasonable;
        private String summary;
        private Integer suggestedDailyFrequency;
        private java.util.List<String> suggestedTimes;
        private String suggestedDoseText;
        private String suggestedMealTiming;
        private String notes;
    }
}
