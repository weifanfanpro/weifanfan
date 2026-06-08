package com.dingdong.medicine.controller.user;

import com.dingdong.medicine.common.result.R;
import com.dingdong.medicine.service.FeedbackService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping
    public R<Void> submit(HttpServletRequest request, @RequestBody Map<String, String> body) {
        String openid = (String) request.getAttribute("openid");
        feedbackService.submit(openid, body.get("content"));
        return R.ok();
    }
}
