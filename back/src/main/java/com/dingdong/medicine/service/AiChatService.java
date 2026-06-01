package com.dingdong.medicine.service;

import com.dingdong.medicine.dto.request.AiChatSendRequest;
import com.dingdong.medicine.dto.request.CheckReminderPlanRequest;
import com.dingdong.medicine.dto.response.AiChatResponse;
import com.dingdong.medicine.entity.AiChatSession;

import java.util.List;

public interface AiChatService {
    List<AiChatSession> getSessions(String openid);
    AiChatSession getSessionDetail(String openid, Long sessionId);
    void deleteSession(String openid, Long sessionId);
    AiChatResponse send(String openid, AiChatSendRequest request);
    AiChatResponse checkReminder(String openid, Long reminderId);
    AiChatResponse checkReminderPlan(String openid, CheckReminderPlanRequest request);
}
