package com.dingdong.medicine.service;

import com.dingdong.medicine.dto.request.CreateReminderPlanRequest;
import com.dingdong.medicine.dto.request.TakeMedicineRequest;
import com.dingdong.medicine.entity.Reminder;

import java.util.List;
import java.util.Map;

public interface ReminderService {
    List<Reminder> createPlan(String openid, CreateReminderPlanRequest request);
    List<Reminder> list(String openid, String targetOpenid);
    Reminder getById(Long id);
    void delete(String openid, Long id);
    Map<String, Object> takeMedicine(String openid, TakeMedicineRequest request);
    List<Reminder> getByUserMedicineId(Long userMedicineId);
}
