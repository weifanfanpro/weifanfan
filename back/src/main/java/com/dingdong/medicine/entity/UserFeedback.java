package com.dingdong.medicine.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("user_feedbacks")
public class UserFeedback {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String openid;
    private String nickName;
    private String avatarUrl;
    private String type;
    private String priority;
    private String content;
    private String images;
    private String status;
    private String reply;
    private String repliedBy;
    private LocalDateTime repliedAt;
    private String date;
    private LocalDateTime createdAt;
}
