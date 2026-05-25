package com.dingdong.medicine.service.impl;

import cn.hutool.http.HttpUtil;
import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dingdong.medicine.common.exception.BizException;
import com.dingdong.medicine.common.util.RedisUtil;
import com.dingdong.medicine.dto.request.AiChatSendRequest;
import com.dingdong.medicine.dto.response.AiChatResponse;
import com.dingdong.medicine.entity.AiChatSession;
import com.dingdong.medicine.entity.Medicine;
import com.dingdong.medicine.entity.Reminder;
import com.dingdong.medicine.mapper.AiChatSessionMapper;
import com.dingdong.medicine.mapper.MedicineMapper;
import com.dingdong.medicine.mapper.ReminderMapper;
import com.dingdong.medicine.service.AiChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.dingdong.medicine.common.constant.AppConstants.REDIS_RATE_AI_CHAT;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiChatServiceImpl implements AiChatService {

    private final AiChatSessionMapper sessionMapper;
    private final MedicineMapper medicineMapper;
    private final ReminderMapper reminderMapper;
    private final RedisUtil redisUtil;

    @Value("${dingdong.ai.dashscope-api-key}")
    private String apiKey;

    @Value("${dingdong.ai.dashscope-model}")
    private String model;

    private static final String SYSTEM_PROMPT = "你是叮咚吃药的AI健康咨询助手。你的职责是提供专业的用药指导、药物相互作用查询和健康科普。请注意：1) 你不替代医嘱，对于严重症状建议用户及时就医；2) 基于提供的药品信息给出针对性建议；3) 回答要简洁明了，适合手机阅读。";

    @Override
    public List<AiChatSession> getSessions(String openid) {
        return sessionMapper.selectList(
                new LambdaQueryWrapper<AiChatSession>()
                        .eq(AiChatSession::getOpenid, openid)
                        .orderByDesc(AiChatSession::getUpdatedAt));
    }

    @Override
    public AiChatSession getSessionDetail(String openid, Long sessionId) {
        AiChatSession session = sessionMapper.selectById(sessionId);
        if (session == null || !session.getOpenid().equals(openid)) {
            throw new BizException("会话不存在");
        }
        return session;
    }

    @Override
    public void deleteSession(String openid, Long sessionId) {
        AiChatSession session = sessionMapper.selectById(sessionId);
        if (session == null || !session.getOpenid().equals(openid)) {
            throw new BizException("会话不存在");
        }
        sessionMapper.deleteById(sessionId);
    }

    @Override
    public AiChatResponse send(String openid, AiChatSendRequest request) {
        String rateKey = REDIS_RATE_AI_CHAT + openid;
        String count = redisUtil.get(rateKey);
        if (count != null && Integer.parseInt(count) >= 30) {
            throw new BizException("请求过于频繁，请稍后再试");
        }

        AiChatSession session;
        if (request.getSessionId() != null) {
            session = sessionMapper.selectById(request.getSessionId());
            if (session == null || !session.getOpenid().equals(openid)) {
                throw new BizException("会话不存在");
            }
        } else {
            session = new AiChatSession();
            session.setOpenid(openid);
            session.setTitle(request.getMessage().substring(0, Math.min(request.getMessage().length(), 20)));
            session.setMessages("[]");
            session.setCreatedAt(LocalDateTime.now());
            session.setUpdatedAt(LocalDateTime.now());
            sessionMapper.insert(session);
        }

        List<JSONObject> messages = new ArrayList<>();
        JSONObject systemMsg = JSONUtil.createObj().set("role", "system").set("content", SYSTEM_PROMPT);
        messages.add(systemMsg);

        if (session.getMessages() != null) {
            JSONArray existing = JSONUtil.parseArray(session.getMessages());
            for (int i = 0; i < existing.size(); i++) {
                messages.add(existing.getJSONObject(i));
            }
        }

        if (request.getConsultMedicineId() != null) {
            Medicine medicine = medicineMapper.selectById(request.getConsultMedicineId());
            if (medicine != null) {
                String context = String.format("用户正在咨询药品：%s\n适应症：%s\n用量：%s\n禁忌：%s",
                        medicine.getName(), medicine.getIndication(), medicine.getDosageSummary(), medicine.getContraindications());
                JSONObject contextMsg = JSONUtil.createObj().set("role", "system").set("content", context);
                messages.add(contextMsg);
            }
        }

        JSONObject userMsg = JSONUtil.createObj().set("role", "user").set("content", request.getMessage());
        messages.add(userMsg);

        JSONObject body = JSONUtil.createObj();
        body.set("model", model);
        body.set("messages", messages);
        body.set("temperature", 0.7);

        if (Boolean.TRUE.equals(request.getWebSearch())) {
            body.set("enable_search", true);
        }

        String result = HttpUtil.createPost("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions")
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .body(body.toString())
                .execute()
                .body();

        JSONObject json = JSONUtil.parseObj(result);
        JSONObject choice = json.getJSONArray("choices").getJSONObject(0);
        String content = choice.getJSONObject("message").getStr("content");
        String reasoning = choice.getJSONObject("message").getStr("reasoning_content");

        messages.add(userMsg);
        JSONObject assistantMsg = JSONUtil.createObj().set("role", "assistant").set("content", content);
        messages.add(assistantMsg);

        JSONArray msgArray = JSONUtil.createArray();
        for (JSONObject msg : messages) {
            if (!"system".equals(msg.getStr("role"))) {
                msgArray.add(msg);
            }
        }
        session.setMessages(msgArray.toString());
        session.setUpdatedAt(LocalDateTime.now());
        sessionMapper.updateById(session);

        redisUtil.increment(rateKey);
        if (count == null) {
            redisUtil.expire(rateKey, 1, TimeUnit.MINUTES);
        }

        return AiChatResponse.builder()
                .sessionId(session.getId())
                .title(session.getTitle())
                .content(content)
                .reasoning(reasoning)
                .deepThinking(Boolean.TRUE.equals(request.getDeepThinking()))
                .build();
    }

    @Override
    public AiChatResponse checkReminder(String openid, Long reminderId) {
        Reminder reminder = reminderMapper.selectById(reminderId);
        if (reminder == null) {
            throw new BizException("提醒不存在");
        }

        String prompt = String.format("""
                请评估以下用药提醒计划的合理性，并返回JSON格式的建议。

                药品：%s
                提醒时间：%s
                剂量：%s
                重复模式：%s
                餐时：%s

                请严格按以下JSON格式返回（不要包含其他文字）：
                {
                  "reasonable": true或false,
                  "summary": "一句话总结",
                  "suggestedDailyFrequency": 数字,
                  "suggestedTimes": ["HH:mm", ...],
                  "suggestedDoseText": "建议剂量文本",
                  "suggestedMealTiming": "none/before/after/empty",
                  "notes": "补充说明"
                }
                """,
                reminder.getMedicineName(), reminder.getTime(), reminder.getDoseText(),
                reminder.getRepeatMode(), reminder.getMealTiming());

        AiChatSendRequest request = new AiChatSendRequest();
        request.setMessage(prompt);
        AiChatResponse response = send(openid, request);

        AiChatResponse.Suggestion suggestion = parseSuggestion(response.getContent());
        return AiChatResponse.builder()
                .sessionId(response.getSessionId())
                .title(response.getTitle())
                .content(response.getContent())
                .reasoning(response.getReasoning())
                .deepThinking(response.getDeepThinking())
                .suggestion(suggestion)
                .build();
    }

    private AiChatResponse.Suggestion parseSuggestion(String content) {
        try {
            Pattern pattern = Pattern.compile("\\{[\\s\\S]*\"reasonable\"[\\s\\S]*\\}");
            Matcher matcher = pattern.matcher(content);
            if (matcher.find()) {
                JSONObject json = JSONUtil.parseObj(matcher.group());
                AiChatResponse.Suggestion.SuggestionBuilder builder = AiChatResponse.Suggestion.builder()
                        .reasonable(json.getBool("reasonable"))
                        .summary(json.getStr("summary"))
                        .suggestedDailyFrequency(json.getInt("suggestedDailyFrequency"))
                        .suggestedDoseText(json.getStr("suggestedDoseText"))
                        .suggestedMealTiming(json.getStr("suggestedMealTiming"))
                        .notes(json.getStr("notes"));
                JSONArray times = json.getJSONArray("suggestedTimes");
                if (times != null) {
                    List<String> timeList = new ArrayList<>();
                    for (int i = 0; i < times.size(); i++) {
                        timeList.add(times.getStr(i));
                    }
                    builder.suggestedTimes(timeList);
                }
                return builder.build();
            }
        } catch (Exception e) {
            log.warn("解析AI建议JSON失败: {}", e.getMessage());
        }
        return null;
    }
}
