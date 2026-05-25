package com.dingdong.medicine.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("ai_chat_sessions")
public class AiChatSession {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String openid;
    private String title;
    private String messages;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
