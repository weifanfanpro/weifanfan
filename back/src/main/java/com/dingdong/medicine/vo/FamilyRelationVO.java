package com.dingdong.medicine.vo;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FamilyRelationVO {
    private Long id;
    private String ownerOpenid;
    private String memberOpenid;
    private String status;
    private String nickName;
    private String avatarUrl;
}
