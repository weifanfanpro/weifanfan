package com.dingdong.medicine.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dingdong.medicine.dto.response.DashboardResponse;
import com.dingdong.medicine.dto.response.MissedStatsResponse;
import com.dingdong.medicine.entity.*;
import com.dingdong.medicine.mapper.*;
import com.dingdong.medicine.service.DashboardService;
import com.dingdong.medicine.service.FamilyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

import static com.dingdong.medicine.common.constant.AppConstants.*;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final ReminderMapper reminderMapper;
    private final ReminderLogMapper reminderLogMapper;
    private final UserMedicineMapper userMedicineMapper;
    private final WeeklyMissedStatMapper weeklyMissedStatMapper;
    private final FamilyService familyService;

    @Override
    public DashboardResponse getDashboard(String openid, String targetOpenid) {
        String ownerOpenid = targetOpenid != null ? targetOpenid : openid;
        if (targetOpenid != null && !targetOpenid.equals(openid)) {
            familyService.ensureAccepted(openid, targetOpenid);
        }

        String today = com.dingdong.medicine.common.util.ChinaTimeUtil.todayString();
        String nowTime = com.dingdong.medicine.common.util.ChinaTimeUtil.currentTimeString();

        List<Reminder> reminders = reminderMapper.selectList(
                new LambdaQueryWrapper<Reminder>()
                        .eq(Reminder::getOwnerOpenid, ownerOpenid)
                        .le(Reminder::getStartDate, today)
                        .orderByAsc(Reminder::getTime));

        List<ReminderLog> logs = reminderLogMapper.selectList(
                new LambdaQueryWrapper<ReminderLog>()
                        .eq(ReminderLog::getOwnerOpenid, ownerOpenid)
                        .eq(ReminderLog::getDate, today));

        Set<Long> takenReminderIds = logs.stream()
                .map(ReminderLog::getReminderId)
                .collect(Collectors.toSet());

        List<DashboardResponse.ReminderItem> reminderItems = new ArrayList<>();
        int overdueCount = 0;

        for (Reminder reminder : reminders) {
            String status;
            if (takenReminderIds.contains(reminder.getId())) {
                status = STATUS_TAKEN;
            } else if (com.dingdong.medicine.common.util.ChinaTimeUtil.isAfter(nowTime, reminder.getTime())) {
                long minutes = com.dingdong.medicine.common.util.ChinaTimeUtil.minutesBetween(reminder.getTime(), nowTime);
                if (minutes > 30) {
                    status = STATUS_OVERDUE;
                    overdueCount++;
                } else {
                    status = STATUS_DUE;
                }
            } else {
                status = STATUS_NOT_YET;
            }

            reminderItems.add(DashboardResponse.ReminderItem.builder()
                    .id(reminder.getId())
                    .medicineName(reminder.getMedicineName())
                    .time(reminder.getTime())
                    .doseText(reminder.getDoseText())
                    .status(status)
                    .mealTiming(reminder.getMealTiming())
                    .build());
        }

        List<DashboardResponse.LogItem> logItems = logs.stream()
                .map(log -> DashboardResponse.LogItem.builder()
                        .reminderId(log.getReminderId())
                        .date(log.getDate())
                        .takenAt(log.getTakenAt() != null ? log.getTakenAt().toString() : null)
                        .build())
                .collect(Collectors.toList());

        return DashboardResponse.builder()
                .reminders(reminderItems)
                .logs(logItems)
                .totalReminders(reminders.size())
                .takenCount(takenReminderIds.size())
                .overdueCount(overdueCount)
                .build();
    }

    @Override
    public MissedStatsResponse getMissedStats(String openid, String targetOpenid) {
        String ownerOpenid = targetOpenid != null ? targetOpenid : openid;
        if (targetOpenid != null && !targetOpenid.equals(openid)) {
            familyService.ensureAccepted(openid, targetOpenid);
        }

        String weekStart = com.dingdong.medicine.common.util.ChinaTimeUtil.weekStartString();
        String today = com.dingdong.medicine.common.util.ChinaTimeUtil.todayString();

        List<Reminder> reminders = reminderMapper.selectList(
                new LambdaQueryWrapper<Reminder>()
                        .eq(Reminder::getOwnerOpenid, ownerOpenid)
                        .le(Reminder::getStartDate, today));

        List<ReminderLog> logs = reminderLogMapper.selectList(
                new LambdaQueryWrapper<ReminderLog>()
                        .eq(ReminderLog::getOwnerOpenid, ownerOpenid)
                        .ge(ReminderLog::getDate, weekStart)
                        .le(ReminderLog::getDate, today));

        int totalReminders = 0;
        int takenCount = 0;
        List<MissedStatsResponse.DayStat> dailyStats = new ArrayList<>();

        for (int i = 0; i < 7; i++) {
            String date = com.dingdong.medicine.common.util.ChinaTimeUtil.todayPlusDays(i - 6);
            if (date.compareTo(weekStart) < 0) continue;

            int dayTotal = 0;
            for (Reminder reminder : reminders) {
                if (reminder.getStartDate().compareTo(date) <= 0) {
                    if (shouldRemindOnDate(reminder, date)) {
                        dayTotal++;
                    }
                }
            }

            long dayTaken = logs.stream()
                    .filter(log -> log.getDate().equals(date))
                    .count();

            totalReminders += dayTotal;
            takenCount += (int) dayTaken;

            dailyStats.add(MissedStatsResponse.DayStat.builder()
                    .date(date)
                    .total(dayTotal)
                    .taken((int) dayTaken)
                    .missed(dayTotal - (int) dayTaken)
                    .build());
        }

        int missedCount = totalReminders - takenCount;
        int onTimeRate = totalReminders > 0 ? (int) ((double) takenCount / totalReminders * 100) : 100;
        int riskScore = calculateRiskScore(missedCount, dailyStats);

        return MissedStatsResponse.builder()
                .riskScore(riskScore)
                .totalReminders(totalReminders)
                .takenCount(takenCount)
                .missedCount(missedCount)
                .onTimeRate(onTimeRate)
                .dailyStats(dailyStats)
                .build();
    }

    @Override
    public Map<String, Object> getLowStockSummary(String openid, String targetOpenid) {
        List<Map<String, Object>> lowStock = getLowStock(openid, targetOpenid);
        Map<String, Object> summary = new HashMap<>();
        summary.put("thresholdDays", 3);
        summary.put("count", lowStock.size());
        summary.put("top", lowStock.stream().limit(5).collect(Collectors.toList()));
        return summary;
    }

    @Override
    public List<Map<String, Object>> getLowStock(String openid, String targetOpenid) {
        String ownerOpenid = targetOpenid != null ? targetOpenid : openid;
        if (targetOpenid != null && !targetOpenid.equals(openid)) {
            familyService.ensureAccepted(openid, targetOpenid);
        }

        List<UserMedicine> medicines = userMedicineMapper.selectList(
                new LambdaQueryWrapper<UserMedicine>()
                        .eq(UserMedicine::getOwnerOpenid, ownerOpenid)
                        .eq(UserMedicine::getIsQuantifiable, true));

        List<Map<String, Object>> lowStock = new ArrayList<>();
        for (UserMedicine medicine : medicines) {
            if (medicine.getTotalAmountText() == null) continue;
            double total = parseTotalAmount(medicine.getTotalAmountText());
            List<Reminder> reminders = reminderMapper.selectList(
                    new LambdaQueryWrapper<Reminder>()
                            .eq(Reminder::getUserMedicineId, medicine.getId()));

            double dailyUse = 0;
            for (Reminder r : reminders) {
                try {
                    double dose = Double.parseDouble(r.getDoseValue());
                    double weight = getFrequencyWeight(r);
                    dailyUse += dose * weight;
                } catch (Exception ignored) {}
            }

            if (dailyUse > 0) {
                int daysLeft = (int) (total / dailyUse);
                if (daysLeft <= 3) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", medicine.getId());
                    item.put("name", medicine.getName());
                    item.put("totalAmountText", medicine.getTotalAmountText());
                    item.put("daysLeft", daysLeft);
                    lowStock.add(item);
                }
            }
        }
        return lowStock;
    }

    @Override
    public List<Map<String, Object>> getHistory(String openid, String targetOpenid, Integer days) {
        String ownerOpenid = targetOpenid != null ? targetOpenid : openid;
        if (targetOpenid != null && !targetOpenid.equals(openid)) {
            familyService.ensureAccepted(openid, targetOpenid);
        }

        int d = days != null ? days : 7;
        String fromDate = com.dingdong.medicine.common.util.ChinaTimeUtil.todayPlusDays(-d);
        String today = com.dingdong.medicine.common.util.ChinaTimeUtil.todayString();

        List<ReminderLog> logs = reminderLogMapper.selectList(
                new LambdaQueryWrapper<ReminderLog>()
                        .eq(ReminderLog::getOwnerOpenid, ownerOpenid)
                        .ge(ReminderLog::getDate, fromDate)
                        .le(ReminderLog::getDate, today)
                        .orderByDesc(ReminderLog::getTakenAt));

        List<Map<String, Object>> result = new ArrayList<>();
        for (ReminderLog log : logs) {
            Reminder reminder = reminderMapper.selectById(log.getReminderId());
            Map<String, Object> item = new HashMap<>();
            item.put("id", log.getId());
            item.put("reminderId", log.getReminderId());
            item.put("medicineName", reminder != null ? reminder.getMedicineName() : "");
            item.put("date", log.getDate());
            item.put("takenAt", log.getTakenAt() != null ? log.getTakenAt().toString() : null);
            result.add(item);
        }
        return result;
    }

    @Override
    public List<WeeklyMissedStat> getWeeklyStats(String openid) {
        return weeklyMissedStatMapper.selectList(
                new LambdaQueryWrapper<WeeklyMissedStat>()
                        .eq(WeeklyMissedStat::getOwnerOpenid, openid)
                        .orderByDesc(WeeklyMissedStat::getWeekStart));
    }

    @Override
    public WeeklyMissedStat getWeeklyStatById(String id) {
        return weeklyMissedStatMapper.selectById(id);
    }

    private boolean shouldRemindOnDate(Reminder reminder, String date) {
        int dayOfWeek = com.dingdong.medicine.common.util.ChinaTimeUtil.parseDate(date).getDayOfWeek().getValue();
        return switch (reminder.getRepeatMode()) {
            case REPEAT_EVERYDAY -> true;
            case REPEAT_WEEKDAY -> dayOfWeek <= 5;
            case REPEAT_CUSTOM -> {
                if (reminder.getCustomWeekdays() != null) {
                    List<String> days = com.alibaba.fastjson2.JSON.parseArray(reminder.getCustomWeekdays(), String.class);
                    yield days.contains(String.valueOf(dayOfWeek));
                }
                yield false;
            }
            default -> false;
        };
    }

    private double getFrequencyWeight(Reminder reminder) {
        return switch (reminder.getRepeatMode()) {
            case REPEAT_EVERYDAY -> 1.0;
            case REPEAT_WEEKDAY -> 5.0 / 7;
            case REPEAT_CUSTOM -> {
                if (reminder.getCustomWeekdays() != null) {
                    List<String> days = com.alibaba.fastjson2.JSON.parseArray(reminder.getCustomWeekdays(), String.class);
                    yield days.size() / 7.0;
                }
                yield 0;
            }
            default -> 0;
        };
    }

    private int calculateRiskScore(int missedCount, List<MissedStatsResponse.DayStat> dailyStats) {
        int riskByMissed = Math.min(40, missedCount * 8);

        int consecutiveMissed = 0;
        for (int i = dailyStats.size() - 1; i >= 0; i--) {
            if (dailyStats.get(i).getMissed() > 0) {
                consecutiveMissed++;
            } else {
                break;
            }
        }
        int riskByStreak = Math.min(24, consecutiveMissed * 8);

        int riskByTrend = 0;
        if (dailyStats.size() >= 3) {
            int recent3 = 0;
            for (int i = dailyStats.size() - 3; i < dailyStats.size(); i++) {
                recent3 += dailyStats.get(i).getMissed();
            }
            riskByTrend = Math.min(12, recent3 * 4);
        }

        return 100 - riskByMissed - riskByStreak - riskByTrend;
    }

    private double parseTotalAmount(String totalText) {
        String numStr = totalText.replaceAll("[^0-9.]", "");
        return numStr.isEmpty() ? 0 : Double.parseDouble(numStr);
    }
}
