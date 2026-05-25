package com.dingdong.medicine.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("family_relations")
public class FamilyRelation {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String ownerOpenid;
    private String memberOpenid;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
