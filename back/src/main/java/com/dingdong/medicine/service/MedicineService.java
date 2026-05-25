package com.dingdong.medicine.service;

import com.dingdong.medicine.entity.Medicine;
import org.springframework.web.multipart.MultipartFile;

public interface MedicineService {
    Medicine recognize(String openid, MultipartFile file);
    String uploadImage(String openid, MultipartFile file);
    Medicine getById(Long id);
    Medicine getByName(String name);
}
