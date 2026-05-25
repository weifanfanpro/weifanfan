package com.dingdong.medicine.service;

import com.dingdong.medicine.dto.request.WxLoginRequest;
import com.dingdong.medicine.dto.response.LoginResponse;

public interface AuthService {
    LoginResponse wxLogin(WxLoginRequest request);
    String refreshToken(String openid);
}
