package com.dingdong.medicine.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DashboardResponse {
    private List<ReminderItem> reminders;
    private List<LogItem> logs;
    private Integer totalReminders;
    private Integer takenCount;
    private Integer overdueCount;

    @Data
    @Builder
    public static class ReminderItem {
        private Long id;
        private String medicineName;
        private String time;
        private String doseText;
        private String status;
        private String mealTiming;
    }

    @Data
    @Builder
    public static class LogItem {
        private Long reminderId;
        private String date;
        private String takenAt;
    }
}
