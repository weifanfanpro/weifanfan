package com.dingdong.medicine.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("reminder_push_logs")
public class ReminderPushLog {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String pushKey;
    private Long reminderId;
    private String date;
    private String ownerOpenid;
    private String time;
    private String medicineName;
    private LocalDateTime sentAt;
}
