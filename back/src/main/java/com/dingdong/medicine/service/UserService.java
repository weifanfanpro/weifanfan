package com.dingdong.medicine.service;

import com.dingdong.medicine.dto.request.UpdateProfileRequest;
import com.dingdong.medicine.entity.User;
import org.springframework.web.multipart.MultipartFile;

public interface UserService {
    User getUserById(String openid);
    void updateProfile(String openid, UpdateProfileRequest request);
    String uploadAvatar(String openid, MultipartFile file);
}
