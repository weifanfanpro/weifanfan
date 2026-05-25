package com.dingdong.medicine.service.impl;

import com.alibaba.fastjson2.JSON;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dingdong.medicine.common.exception.BizException;
import com.dingdong.medicine.common.util.ChinaTimeUtil;
import com.dingdong.medicine.dto.request.CreateReminderPlanRequest;
import com.dingdong.medicine.dto.request.TakeMedicineRequest;
import com.dingdong.medicine.entity.*;
import com.dingdong.medicine.mapper.*;
import com.dingdong.medicine.service.FamilyService;
import com.dingdong.medicine.service.PointsService;
import com.dingdong.medicine.service.ReminderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

import static com.dingdong.medicine.common.constant.AppConstants.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReminderServiceImpl implements ReminderService {

    private final ReminderMapper reminderMapper;
    private final ReminderLogMapper reminderLogMapper;
    private final ReminderPushLogMapper reminderPushLogMapper;
    private final UserMedicineMapper userMedicineMapper;
    private final UserMedicineMapper medicineMapper;
    private final FamilyService familyService;
    private final PointsService pointsService;

    @Override
    @Transactional
    public List<Reminder> createPlan(String openid, CreateReminderPlanRequest request) {
        UserMedicine userMedicine = userMedicineMapper.selectById(request.getUserMedicineId());
        if (userMedicine == null) {
            throw new BizException("药品不存在");
        }
        if (!userMedicine.getOwnerOpenid().equals(openid)) {
            throw new BizException("无权操作此药品");
        }

        reminderMapper.delete(
                new LambdaQueryWrapper<Reminder>()
                        .eq(Reminder::getUserMedicineId, request.getUserMedicineId()));

        List<Reminder> oldReminders = reminderMapper.selectList(
                new LambdaQueryWrapper<Reminder>()
                        .eq(Reminder::getUserMedicineId, request.getUserMedicineId()));
        for (Reminder old : oldReminders) {
            reminderLogMapper.delete(
                    new LambdaQueryWrapper<ReminderLog>()
                            .eq(ReminderLog::getReminderId, old.getId()));
            reminderPushLogMapper.delete(
                    new LambdaQueryWrapper<ReminderPushLog>()
                            .eq(ReminderPushLog::getReminderId, old.getId()));
        }

        String planId = "plan_" + request.getUserMedicineId() + "_" + System.currentTimeMillis();
        String today = ChinaTimeUtil.todayString();
        String nowTime = ChinaTimeUtil.currentTimeString();
        String tomorrow = ChinaTimeUtil.todayPlusDays(1);
        List<Reminder> reminders = new ArrayList<>();

        for (String time : request.getTimes()) {
            Reminder reminder = new Reminder();
            reminder.setOwnerOpenid(openid);
            reminder.setActorOpenid(openid);
            reminder.setUserMedicineId(request.getUserMedicineId());
            reminder.setMedicineName(userMedicine.getName());
            reminder.setTime(time);
            reminder.setStartDate(ChinaTimeUtil.isAfter(nowTime, time) ? tomorrow : today);
            reminder.setDoseValue(request.getDoseValue() != null ? request.getDoseValue() : "1");
            reminder.setDoseUnit(request.getDoseUnit() != null ? request.getDoseUnit() : "次");
            reminder.setDoseText(request.getDoseText() != null ? request.getDoseText() : "");
            reminder.setRepeatMode(request.getRepeatMode() != null ? request.getRepeatMode() : REPEAT_EVERYDAY);
            if (request.getCustomWeekdays() != null) {
                reminder.setCustomWeekdays(JSON.toJSONString(request.getCustomWeekdays()));
            }
            reminder.setNotifyWechat(true);
            reminder.setNotifyRing(false);
            reminder.setNotifyVibrate(true);
            reminder.setDailyFrequency(request.getFrequency());
            reminder.setMealTiming(request.getMealTiming() != null ? request.getMealTiming() : MEAL_NONE);
            reminder.setPlanId(planId);
            reminder.setCreatedAt(LocalDateTime.now());
            reminderMapper.insert(reminder);
            reminders.add(reminder);
        }

        String rule = buildRuleSummary(request);
        userMedicine.setRule(rule);
        userMedicine.setUpdatedAt(LocalDateTime.now());
        userMedicineMapper.updateById(userMedicine);

        return reminders;
    }

    @Override
    public List<Reminder> list(String openid, String targetOpenid) {
        String ownerOpenid = targetOpenid != null ? targetOpenid : openid;
        if (targetOpenid != null && !targetOpenid.equals(openid)) {
            familyService.ensureAccepted(openid, targetOpenid);
        }
        return reminderMapper.selectList(
                new LambdaQueryWrapper<Reminder>()
                        .eq(Reminder::getOwnerOpenid, ownerOpenid)
                        .orderByAsc(Reminder::getTime));
    }

    @Override
    public Reminder getById(Long id) {
        Reminder reminder = reminderMapper.selectById(id);
        if (reminder == null) {
            throw new BizException("提醒不存在");
        }
        return reminder;
    }

    @Override
    @Transactional
    public void delete(String openid, Long id) {
        Reminder reminder = getById(id);
        if (!reminder.getOwnerOpenid().equals(openid)) {
            throw new BizException("无权删除此提醒");
        }
        reminderLogMapper.delete(
                new LambdaQueryWrapper<ReminderLog>()
                        .eq(ReminderLog::getReminderId, id));
        reminderPushLogMapper.delete(
                new LambdaQueryWrapper<ReminderPushLog>()
                        .eq(ReminderPushLog::getReminderId, id));
        reminderMapper.deleteById(id);
    }

    @Override
    @Transactional
    public Map<String, Object> takeMedicine(String openid, TakeMedicineRequest request) {
        Reminder reminder = getById(request.getReminderId());
        if (!reminder.getOwnerOpenid().equals(openid)) {
            throw new BizException("无权操作此提醒");
        }

        ReminderLog existing = reminderLogMapper.selectOne(
                new LambdaQueryWrapper<ReminderLog>()
                        .eq(ReminderLog::getReminderId, request.getReminderId())
                        .eq(ReminderLog::getDate, request.getDate())
                        .eq(ReminderLog::getOwnerOpenid, openid));
        if (existing != null) {
            Map<String, Object> result = new HashMap<>();
            result.put("ok", true);
            result.put("pointsDelta", 0);
            UserPointsWallet wallet = pointsService.getWallet(openid);
            result.put("pointsBalance", wallet.getPointsBalance());
            return result;
        }

        ReminderLog reminderLog = new ReminderLog();
        reminderLog.setReminderId(request.getReminderId());
        reminderLog.setDate(request.getDate());
        reminderLog.setOwnerOpenid(openid);
        reminderLog.setActorOpenid(openid);
        reminderLog.setTakenAt(LocalDateTime.now());
        reminderLogMapper.insert(reminderLog);

        UserMedicine userMedicine = userMedicineMapper.selectById(reminder.getUserMedicineId());
        if (userMedicine != null && userMedicine.getIsQuantifiable() && userMedicine.getTotalAmountText() != null) {
            try {
                String doseText = reminder.getDoseValue();
                double dose = Double.parseDouble(doseText);
                String totalText = userMedicine.getTotalAmountText();
                double total = parseTotalAmount(totalText);
                total -= dose;
                if (total < 0) total = 0;
                userMedicine.setTotalAmountText(formatTotalAmount(total, totalText));
                userMedicine.setUpdatedAt(LocalDateTime.now());
                userMedicineMapper.updateById(userMedicine);
            } catch (Exception e) {
                log.warn("余量扣减失败: {}", e.getMessage());
            }
        }

        pointsService.addPoints(openid, TAKE_MEDICINE_POINTS, "takeMedicine", String.valueOf(request.getReminderId()));

        Map<String, Object> result = new HashMap<>();
        result.put("ok", true);
        result.put("pointsDelta", TAKE_MEDICINE_POINTS);
        UserPointsWallet wallet = pointsService.getWallet(openid);
        result.put("pointsBalance", wallet.getPointsBalance());
        return result;
    }

    @Override
    public List<Reminder> getByUserMedicineId(Long userMedicineId) {
        return reminderMapper.selectList(
                new LambdaQueryWrapper<Reminder>()
                        .eq(Reminder::getUserMedicineId, userMedicineId));
    }

    private String buildRuleSummary(CreateReminderPlanRequest request) {
        StringBuilder sb = new StringBuilder();
        sb.append("每日").append(request.getFrequency()).append("次");
        if (request.getTimes() != null) {
            sb.append("，时间：").append(String.join("/", request.getTimes()));
        }
        if (request.getDoseText() != null) {
            sb.append("，").append(request.getDoseText());
        }
        if (request.getMealTiming() != null && !MEAL_NONE.equals(request.getMealTiming())) {
            sb.append("，").append(MEAL_BEFORE.equals(request.getMealTiming()) ? "餐前" : "餐后");
        }
        return sb.toString();
    }

    private double parseTotalAmount(String totalText) {
        String numStr = totalText.replaceAll("[^0-9.]", "");
        return numStr.isEmpty() ? 0 : Double.parseDouble(numStr);
    }

    private String formatTotalAmount(double amount, String originalText) {
        String unit = originalText.replaceAll("[0-9.]", "");
        return (int) amount + unit;
    }
}
