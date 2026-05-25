package com.dingdong.medicine.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class MissedStatsResponse {
    private Integer riskScore;
    private Integer totalReminders;
    private Integer takenCount;
    private Integer missedCount;
    private Integer onTimeRate;
    private List<DayStat> dailyStats;

    @Data
    @Builder
    public static class DayStat {
        private String date;
        private Integer total;
        private Integer taken;
        private Integer missed;
    }
}
