package com.dingdong.medicine.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("weekly_missed_stats")
public class WeeklyMissedStat {
    @TableId(type = IdType.INPUT)
    private String id;
    private String ownerOpenid;
    private String weekStart;
    private String weekEnd;
    private Integer statsTotal;
    private Integer statsOk;
    private Integer statsMissed;
    private Integer statsRate;
    private String weeklyData;
    private LocalDateTime createdAt;
}
