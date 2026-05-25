package com.dingdong.medicine.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("user_points_logs")
public class UserPointsLog {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String openid;
    private String type;
    private Integer delta;
    private String source;
    private String refId;
    private String reason;
    private LocalDateTime createdAt;
}
