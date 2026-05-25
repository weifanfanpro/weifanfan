package com.dingdong.medicine.service;

import com.dingdong.medicine.dto.request.AddMedicineRequest;
import com.dingdong.medicine.entity.UserMedicine;

import java.util.List;

public interface UserMedicineService {
    UserMedicine add(String openid, AddMedicineRequest request);
    List<UserMedicine> list(String openid, String targetOpenid);
    UserMedicine getById(Long id);
    void update(String openid, Long id, java.util.Map<String, Object> fields);
    void delete(String openid, Long id);
}
