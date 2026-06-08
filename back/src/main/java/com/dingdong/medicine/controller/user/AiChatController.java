package com.dingdong.medicine.controller.user;

import com.dingdong.medicine.common.result.R;
import com.dingdong.medicine.dto.request.AiChatSendRequest;
import com.dingdong.medicine.dto.request.CheckReminderPlanRequest;
import com.dingdong.medicine.dto.response.AiChatResponse;
import com.dingdong.medicine.entity.AiChatSession;
import com.dingdong.medicine.service.AiChatService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/ai-chat")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService aiChatService;

    @GetMapping("/sessions")
    public R<List<AiChatSession>> sessions(HttpServletRequest request) {
        String openid = (String) request.getAttribute("openid");
        return R.ok(aiChatService.getSessions(openid));
    }

    @GetMapping("/sessions/{sessionId}")
    public R<AiChatSession> sessionDetail(HttpServletRequest request, @PathVariable Long sessionId) {
        String openid = (String) request.getAttribute("openid");
        log.info("sessionDetail: openid={}, sessionId={}", openid, sessionId);
        try {
            return R.ok(aiChatService.getSessionDetail(openid, sessionId));
        } catch (Exception e) {
            log.error("sessionDetail error", e);
            throw e;
        }
    }

    @DeleteMapping("/sessions/{sessionId}")
    public R<Void> deleteSession(HttpServletRequest request, @PathVariable Long sessionId) {
        String openid = (String) request.getAttribute("openid");
        log.info("deleteSession: openid={}, sessionId={}", openid, sessionId);
        try {
            aiChatService.deleteSession(openid, sessionId);
            return R.ok();
        } catch (Exception e) {
            log.error("deleteSession error", e);
            throw e;
        }
    }

    @PostMapping("/send")
    public R<AiChatResponse> send(HttpServletRequest request,
                                   @Valid @RequestBody AiChatSendRequest sendRequest) {
        String openid = (String) request.getAttribute("openid");
        return R.ok(aiChatService.send(openid, sendRequest));
    }

    @PostMapping("/check-reminder")
    public R<AiChatResponse> checkReminder(HttpServletRequest request,
                                            @RequestParam Long reminderId) {
        String openid = (String) request.getAttribute("openid");
        return R.ok(aiChatService.checkReminder(openid, reminderId));
    }

    @PostMapping("/check-reminder-plan")
    public R<AiChatResponse> checkReminderPlan(HttpServletRequest request,
                                                 @RequestBody CheckReminderPlanRequest planRequest) {
        String openid = (String) request.getAttribute("openid");
        return R.ok(aiChatService.checkReminderPlan(openid, planRequest));
    }
}
