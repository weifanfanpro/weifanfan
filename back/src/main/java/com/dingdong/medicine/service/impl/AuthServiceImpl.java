package com.dingdong.medicine.service.impl;

import cn.hutool.http.HttpUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dingdong.medicine.common.exception.BizException;
import com.dingdong.medicine.common.util.ChinaTimeUtil;
import com.dingdong.medicine.common.util.JwtUtil;
import com.dingdong.medicine.common.util.RedisUtil;
import com.dingdong.medicine.dto.request.WxLoginRequest;
import com.dingdong.medicine.dto.response.LoginResponse;
import com.dingdong.medicine.entity.User;
import com.dingdong.medicine.entity.UserPointsWallet;
import com.dingdong.medicine.mapper.UserMapper;
import com.dingdong.medicine.mapper.UserPointsWalletMapper;
import com.dingdong.medicine.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

import static com.dingdong.medicine.common.constant.AppConstants.NEW_USER_POINTS;
import static com.dingdong.medicine.common.constant.AppConstants.REDIS_TOKEN_PREFIX;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserMapper userMapper;
    private final UserPointsWalletMapper pointsWalletMapper;
    private final JwtUtil jwtUtil;
    private final RedisUtil redisUtil;

    @Value("${dingdong.wechat.app-id}")
    private String appId;

    @Value("${dingdong.wechat.app-secret}")
    private String appSecret;

    @Value("${dingdong.jwt.expiration}")
    private long expiration;

    @Override
    @Transactional
    public LoginResponse wxLogin(WxLoginRequest request) {
        String openid = code2Session(request.getCode());
        if (openid == null) {
            throw new BizException("微信登录失败");
        }

        User user = userMapper.selectById(openid);
        if (user == null) {
            user = new User();
            user.setId(openid);
            user.setNickName(request.getNickName() != null ? request.getNickName() : "微信用户");
            user.setAvatarUrl(request.getAvatarUrl() != null ? request.getAvatarUrl() : "");
            user.setGender(0);
            user.setCreatedAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            user.setLastLoginAt(LocalDateTime.now());
            userMapper.insert(user);

            UserPointsWallet wallet = new UserPointsWallet();
            wallet.setOpenid(openid);
            wallet.setPointsBalance(NEW_USER_POINTS);
            wallet.setCreatedAt(LocalDateTime.now());
            wallet.setUpdatedAt(LocalDateTime.now());
            pointsWalletMapper.insert(wallet);
        } else {
            if (request.getNickName() != null) {
                user.setNickName(request.getNickName());
            }
            if (request.getAvatarUrl() != null) {
                user.setAvatarUrl(request.getAvatarUrl());
            }
            user.setLastLoginAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            userMapper.updateById(user);
        }

        String token = jwtUtil.generateToken(openid);
        redisUtil.set(REDIS_TOKEN_PREFIX + openid, token, expiration, TimeUnit.SECONDS);

        return LoginResponse.builder()
                .token(token)
                .expiresIn(expiration)
                .user(LoginResponse.UserInfo.builder()
                        .id(user.getId())
                        .nickName(user.getNickName())
                        .avatarUrl(user.getAvatarUrl())
                        .gender(user.getGender())
                        .build())
                .build();
    }

    @Override
    public String refreshToken(String openid) {
        String token = jwtUtil.generateToken(openid);
        redisUtil.set(REDIS_TOKEN_PREFIX + openid, token, expiration, TimeUnit.SECONDS);
        return token;
    }

    private String code2Session(String code) {
        String url = String.format(
                "https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code",
                appId, appSecret, code);
        try {
            String result = HttpUtil.get(url);
            JSONObject json = JSONUtil.parseObj(result);
            if (json.containsKey("openid")) {
                return json.getStr("openid");
            }
            log.error("微信code2session失败: {}", result);
            return null;
        } catch (Exception e) {
            log.error("微信code2session异常", e);
            return null;
        }
    }
}
