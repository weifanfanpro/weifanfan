package com.dingdong.medicine.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("reminder_logs")
public class ReminderLog {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long reminderId;
    private String date;
    private String ownerOpenid;
    private String actorOpenid;
    private LocalDateTime takenAt;
}
