package com.dingdong.medicine.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("admin_sessions")
public class AdminSession {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String username;
    private String token;
    private String ip;
    private Long expiresAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
