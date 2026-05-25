package com.dingdong.medicine.service.impl;

import com.dingdong.medicine.common.exception.BizException;
import com.dingdong.medicine.common.util.MinioUtil;
import com.dingdong.medicine.common.util.RedisUtil;
import com.dingdong.medicine.dto.request.UpdateProfileRequest;
import com.dingdong.medicine.entity.User;
import com.dingdong.medicine.mapper.UserMapper;
import com.dingdong.medicine.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;

import static com.dingdong.medicine.common.constant.AppConstants.REDIS_USER_PROFILE;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;
    private final MinioUtil minioUtil;
    private final RedisUtil redisUtil;

    @Override
    public User getUserById(String openid) {
        User user = userMapper.selectById(openid);
        if (user == null) {
            throw new BizException("用户不存在");
        }
        return user;
    }

    @Override
    public void updateProfile(String openid, UpdateProfileRequest request) {
        User user = getUserById(openid);
        if (request.getNickName() != null) {
            user.setNickName(request.getNickName());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(user);
        redisUtil.delete(REDIS_USER_PROFILE + openid);
    }

    @Override
    public String uploadAvatar(String openid, MultipartFile file) {
        String url = minioUtil.uploadAvatar(file, openid);
        User user = getUserById(openid);
        user.setAvatarUrl(url);
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(user);
        redisUtil.delete(REDIS_USER_PROFILE + openid);
        return url;
    }
}
