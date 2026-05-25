package com.dingdong.medicine.controller;

import com.dingdong.medicine.common.result.R;
import com.dingdong.medicine.dto.request.UpdateProfileRequest;
import com.dingdong.medicine.entity.User;
import com.dingdong.medicine.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PutMapping("/profile")
    public R<Void> updateProfile(HttpServletRequest request, @RequestBody UpdateProfileRequest profileRequest) {
        String openid = (String) request.getAttribute("openid");
        userService.updateProfile(openid, profileRequest);
        return R.ok();
    }

    @PostMapping("/avatar")
    public R<Map<String, String>> uploadAvatar(HttpServletRequest request, @RequestParam("file") MultipartFile file) {
        String openid = (String) request.getAttribute("openid");
        String url = userService.uploadAvatar(openid, file);
        Map<String, String> data = new HashMap<>();
        data.put("url", url);
        return R.ok(data);
    }
}
