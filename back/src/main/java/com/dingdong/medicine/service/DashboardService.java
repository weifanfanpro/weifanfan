package com.dingdong.medicine.service;

import com.dingdong.medicine.dto.response.DashboardResponse;
import com.dingdong.medicine.dto.response.MissedStatsResponse;
import com.dingdong.medicine.entity.WeeklyMissedStat;

import java.util.List;
import java.util.Map;

public interface DashboardService {
    DashboardResponse getDashboard(String openid, String targetOpenid);
    MissedStatsResponse getMissedStats(String openid, String targetOpenid);
    List<Map<String, Object>> getLowStock(String openid, String targetOpenid);
    Map<String, Object> getLowStockSummary(String openid, String targetOpenid);
    List<Map<String, Object>> getHistory(String openid, String targetOpenid, Integer days);
    List<WeeklyMissedStat> getWeeklyStats(String openid);
    WeeklyMissedStat getWeeklyStatById(String id);
}
