package com.dingdong.medicine.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dingdong.medicine.common.exception.BizException;
import com.dingdong.medicine.dto.request.AddMedicineRequest;
import com.dingdong.medicine.entity.Reminder;
import com.dingdong.medicine.entity.ReminderLog;
import com.dingdong.medicine.entity.ReminderPushLog;
import com.dingdong.medicine.entity.UserMedicine;
import com.dingdong.medicine.mapper.ReminderLogMapper;
import com.dingdong.medicine.mapper.ReminderMapper;
import com.dingdong.medicine.mapper.ReminderPushLogMapper;
import com.dingdong.medicine.mapper.UserMedicineMapper;
import com.dingdong.medicine.service.FamilyService;
import com.dingdong.medicine.service.UserMedicineService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserMedicineServiceImpl implements UserMedicineService {

    private final UserMedicineMapper userMedicineMapper;
    private final ReminderMapper reminderMapper;
    private final ReminderLogMapper reminderLogMapper;
    private final ReminderPushLogMapper reminderPushLogMapper;
    private final FamilyService familyService;

    @Override
    public UserMedicine add(String openid, AddMedicineRequest request) {
        UserMedicine medicine = new UserMedicine();
        medicine.setOwnerOpenid(openid);
        medicine.setActorOpenid(openid);
        medicine.setMedicineId(request.getMedicineId());
        medicine.setName(request.getName());
        medicine.setIsQuantifiable(request.getIsQuantifiable() != null ? request.getIsQuantifiable() : false);
        medicine.setDoseText(request.getDoseText() != null ? request.getDoseText() : "");
        medicine.setTotalAmountText(request.getTotalAmountText());
        medicine.setRule(request.getRule() != null ? request.getRule() : "请根据医生建议设置详细用药规则");
        medicine.setCreatedAt(LocalDateTime.now());
        medicine.setUpdatedAt(LocalDateTime.now());
        userMedicineMapper.insert(medicine);
        return medicine;
    }

    @Override
    public List<UserMedicine> list(String openid, String targetOpenid) {
        String ownerOpenid = targetOpenid != null ? targetOpenid : openid;
        if (targetOpenid != null && !targetOpenid.equals(openid)) {
            familyService.ensureAccepted(openid, targetOpenid);
        }
        return userMedicineMapper.selectList(
                new LambdaQueryWrapper<UserMedicine>()
                        .eq(UserMedicine::getOwnerOpenid, ownerOpenid)
                        .orderByDesc(UserMedicine::getCreatedAt));
    }

    @Override
    public UserMedicine getById(Long id) {
        UserMedicine medicine = userMedicineMapper.selectById(id);
        if (medicine == null) {
            throw new BizException("药品不存在");
        }
        return medicine;
    }

    @Override
    public void update(String openid, Long id, Map<String, Object> fields) {
        UserMedicine medicine = getById(id);
        if (!medicine.getOwnerOpenid().equals(openid)) {
            throw new BizException("无权修改此药品");
        }
        if (fields.containsKey("isQuantifiable")) {
            medicine.setIsQuantifiable((Boolean) fields.get("isQuantifiable"));
        }
        if (fields.containsKey("doseText")) {
            medicine.setDoseText((String) fields.get("doseText"));
        }
        if (fields.containsKey("totalAmountText")) {
            medicine.setTotalAmountText((String) fields.get("totalAmountText"));
        }
        if (fields.containsKey("rule")) {
            medicine.setRule((String) fields.get("rule"));
        }
        medicine.setUpdatedAt(LocalDateTime.now());
        userMedicineMapper.updateById(medicine);
    }

    @Override
    @Transactional
    public void delete(String openid, Long id) {
        UserMedicine medicine = getById(id);
        if (!medicine.getOwnerOpenid().equals(openid)) {
            throw new BizException("无权删除此药品");
        }

        List<Reminder> reminders = reminderMapper.selectList(
                new LambdaQueryWrapper<Reminder>()
                        .eq(Reminder::getUserMedicineId, id));
        for (Reminder reminder : reminders) {
            reminderLogMapper.delete(
                    new LambdaQueryWrapper<ReminderLog>()
                            .eq(ReminderLog::getReminderId, reminder.getId()));
            reminderPushLogMapper.delete(
                    new LambdaQueryWrapper<ReminderPushLog>()
                            .eq(ReminderPushLog::getReminderId, reminder.getId()));
        }
        reminderMapper.delete(
                new LambdaQueryWrapper<Reminder>()
                        .eq(Reminder::getUserMedicineId, id));
        userMedicineMapper.deleteById(id);
    }
}
