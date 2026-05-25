package com.dingdong.medicine.service.impl;

import com.dingdong.medicine.common.util.ChinaTimeUtil;
import com.dingdong.medicine.entity.User;
import com.dingdong.medicine.entity.UserFeedback;
import com.dingdong.medicine.mapper.UserFeedbackMapper;
import com.dingdong.medicine.mapper.UserMapper;
import com.dingdong.medicine.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class FeedbackServiceImpl implements FeedbackService {

    private final UserFeedbackMapper feedbackMapper;
    private final UserMapper userMapper;

    @Override
    public void submit(String openid, String content) {
        User user = userMapper.selectById(openid);
        UserFeedback feedback = new UserFeedback();
        feedback.setOpenid(openid);
        feedback.setNickName(user != null ? user.getNickName() : "");
        feedback.setAvatarUrl(user != null ? user.getAvatarUrl() : "");
        feedback.setContent(content);
        feedback.setDate(ChinaTimeUtil.todayString());
        feedback.setCreatedAt(LocalDateTime.now());
        feedbackMapper.insert(feedback);
    }
}
