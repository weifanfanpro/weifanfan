package com.dingdong.medicine.scheduler;

import cn.hutool.http.HttpUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dingdong.medicine.common.util.RedisUtil;
import com.dingdong.medicine.entity.Reminder;
import com.dingdong.medicine.entity.ReminderLog;
import com.dingdong.medicine.entity.ReminderPushLog;
import com.dingdong.medicine.entity.User;
import com.dingdong.medicine.mapper.ReminderLogMapper;
import com.dingdong.medicine.mapper.ReminderMapper;
import com.dingdong.medicine.mapper.ReminderPushLogMapper;
import com.dingdong.medicine.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReminderPushScheduler {

    private final ReminderMapper reminderMapper;
    private final ReminderLogMapper reminderLogMapper;
    private final ReminderPushLogMapper pushLogMapper;
    private final UserMapper userMapper;
    private final RedisUtil redisUtil;

    @Value("${dingdong.wechat.app-id}")
    private String appId;

    @Value("${dingdong.wechat.app-secret}")
    private String appSecret;

    @Value("${dingdong.subscribe.template-id}")
    private String templateId;

    private static final String ACCESS_TOKEN_KEY = "wechat:access_token";
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter TIME_FULL_FMT = DateTimeFormatter.ofPattern("HH:mm:ss");

    @Scheduled(fixedRate = 15000)
    public void pushReminders() {
        String today = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        String nowTimeFull = LocalTime.now().format(TIME_FULL_FMT);
        int dayOfWeek = LocalDate.now().getDayOfWeek().getValue();

        List<Reminder> reminders = reminderMapper.selectList(
                new LambdaQueryWrapper<Reminder>()
                        .le(Reminder::getStartDate, today)
                        .eq(Reminder::getNotifyWechat, true));

        log.info("[推送] 本轮检查 {} 条提醒, now={}, dayOfWeek={}", reminders.size(), nowTimeFull, dayOfWeek);

        for (Reminder reminder : reminders) {
            try {
                if (!shouldRemindToday(reminder, dayOfWeek)) {
                    log.debug("[推送] 跳过(非今日): id={}", reminder.getId());
                    continue;
                }
                if (!isInPushWindow(reminder.getTime(), nowTimeFull)) {
                    log.debug("[推送] 跳过(不在窗口): id={} target={} now={}", reminder.getId(), reminder.getTime(), nowTimeFull);
                    continue;
                }
                if (isAlreadyTaken(reminder.getId(), today)) {
                    log.debug("[推送] 跳过(已服药): id={}", reminder.getId());
                    continue;
                }
                if (isAlreadyPushed(reminder.getId(), today)) {
                    log.debug("[推送] 跳过(已推送): id={}", reminder.getId());
                    continue;
                }

                User user = userMapper.selectById(reminder.getOwnerOpenid());
                if (user == null) {
                    log.debug("[推送] 跳过(用户不存在): id={} openid={}", reminder.getId(), reminder.getOwnerOpenid());
                    continue;
                }

                log.info("[推送] 发送订阅消息: id={}, to={}, medicine={}", reminder.getId(), user.getId(), reminder.getMedicineName());
                boolean sent = sendSubscribeMessage(user.getId(), reminder.getMedicineName(),
                        reminder.getTime(), reminder.getDoseText());
                log.info("[推送] 发送结果: id={}, sent={}", reminder.getId(), sent);
                if (sent) {
                    recordPush(reminder, today);
                }
            } catch (Exception e) {
                log.warn("[推送] 推送失败, id={}: {}", reminder.getId(), e.getMessage(), e);
            }
        }
    }

    private boolean shouldRemindToday(Reminder reminder, int dayOfWeek) {
        return switch (reminder.getRepeatMode()) {
            case "everyday" -> true;
            case "weekday" -> dayOfWeek <= 5;
            case "custom" -> {
                if (reminder.getCustomWeekdays() != null) {
                    List<String> days = JSONUtil.parseArray(reminder.getCustomWeekdays()).toList(String.class);
                    yield days.contains(String.valueOf(dayOfWeek));
                }
                yield false;
            }
            default -> false;
        };
    }

    private boolean isInPushWindow(String reminderTime, String nowTimeFull) {
        LocalTime target = LocalTime.parse(reminderTime, TIME_FMT);
        LocalTime now = LocalTime.parse(nowTimeFull, TIME_FULL_FMT);
        long diffSeconds = java.time.Duration.between(target, now).getSeconds();
        // 15 秒轮询，窗口 -10s ~ +20s，确保到点附近至少命中一次
        return diffSeconds >= -10 && diffSeconds <= 20;
    }

    private boolean isAlreadyTaken(Long reminderId, String date) {
        return reminderLogMapper.selectCount(
                new LambdaQueryWrapper<ReminderLog>()
                        .eq(ReminderLog::getReminderId, reminderId)
                        .eq(ReminderLog::getDate, date)) > 0;
    }

    private boolean isAlreadyPushed(Long reminderId, String date) {
        return pushLogMapper.selectCount(
                new LambdaQueryWrapper<ReminderPushLog>()
                        .eq(ReminderPushLog::getReminderId, reminderId)
                        .eq(ReminderPushLog::getDate, date)) > 0;
    }

    private boolean sendSubscribeMessage(String openid, String medicineName, String time, String doseText) {
        String accessToken = getAccessToken();
        if (accessToken == null) {
            log.warn("[推送] 获取 access_token 失败, 无法发送");
            return false;
        }

        // thing 类型字段限制 20 字符，超长会被微信 API 静默拒绝
        String safeName = truncateField(medicineName, 20);
        String safeDose = truncateField(doseText, 20);
        if (safeDose == null || safeDose.isEmpty()) safeDose = "请按时服药";

        JSONObject body = JSONUtil.createObj();
        body.set("touser", openid);
        body.set("template_id", templateId);
        body.set("page", "pages/tab-shell/index");

        JSONObject data = JSONUtil.createObj();
        data.set("thing1", JSONUtil.createObj().set("value", safeName));
        data.set("time2", JSONUtil.createObj().set("value", time));
        data.set("thing3", JSONUtil.createObj().set("value", safeDose));
        body.set("data", data);

        String url = "https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=" + accessToken;
        String result = HttpUtil.createPost(url)
                .body(body.toString())
                .execute()
                .body();

        JSONObject resp = JSONUtil.parseObj(result);
        int errcode = resp.getInt("errcode", -1);
        if (errcode != 0) {
            log.warn("微信订阅消息发送失败: {}", resp.getStr("errmsg"));
        }
        return errcode == 0;
    }

    private String truncateField(String value, int maxLen) {
        if (value == null) return null;
        return value.length() > maxLen ? value.substring(0, maxLen - 1) + "…" : value;
    }

    private void recordPush(Reminder reminder, String date) {
        ReminderPushLog pushLog = new ReminderPushLog();
        pushLog.setPushKey(reminder.getOwnerOpenid() + ":" + reminder.getId() + ":" + date);
        pushLog.setReminderId(reminder.getId());
        pushLog.setDate(date);
        pushLog.setOwnerOpenid(reminder.getOwnerOpenid());
        pushLog.setTime(reminder.getTime());
        pushLog.setMedicineName(reminder.getMedicineName());
        pushLog.setSentAt(LocalDateTime.now());
        pushLogMapper.insert(pushLog);
    }

    private String getAccessToken() {
        String cached = redisUtil.get(ACCESS_TOKEN_KEY);
        if (cached != null) return cached;

        String url = String.format("https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=%s&secret=%s",
                appId, appSecret);
        String result = HttpUtil.get(url);
        JSONObject json = JSONUtil.parseObj(result);

        String token = json.getStr("access_token");
        if (token != null) {
            int expiresIn = json.getInt("expires_in", 7200);
            redisUtil.set(ACCESS_TOKEN_KEY, token, expiresIn - 300, TimeUnit.SECONDS);
        } else {
            log.error("获取access_token失败: {}", json.getStr("errmsg"));
        }
        return token;
    }
}
