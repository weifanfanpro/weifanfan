package com.dingdong.medicine.controller;

import com.dingdong.medicine.common.result.R;
import com.dingdong.medicine.dto.request.WxLoginRequest;
import com.dingdong.medicine.dto.response.LoginResponse;
import com.dingdong.medicine.entity.User;
import com.dingdong.medicine.service.AuthService;
import com.dingdong.medicine.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/wx-login")
    public R<LoginResponse> wxLogin(@Valid @RequestBody WxLoginRequest request) {
        return R.ok(authService.wxLogin(request));
    }

    @PostMapping("/refresh")
    public R<Map<String, Object>> refresh(HttpServletRequest request) {
        String openid = (String) request.getAttribute("openid");
        String token = authService.refreshToken(openid);
        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("expiresIn", 604800L);
        return R.ok(data);
    }

    @GetMapping("/me")
    public R<User> me(HttpServletRequest request) {
        String openid = (String) request.getAttribute("openid");
        return R.ok(userService.getUserById(openid));
    }
}
