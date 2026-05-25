package com.dingdong.medicine.service;

import com.dingdong.medicine.dto.request.CreatePendingRequest;
import com.dingdong.medicine.entity.FamilyPendingMedicine;
import com.dingdong.medicine.entity.FamilyRelation;
import com.dingdong.medicine.vo.FamilyRelationVO;

import java.util.List;

public interface FamilyService {
    void bind(String openid, String targetOpenid);
    List<FamilyRelationVO> getRelations(String openid);
    void unbind(String openid, Long relationId);
    void createPending(String openid, CreatePendingRequest request);
    List<FamilyPendingMedicine> getInbox(String openid);
    List<FamilyPendingMedicine> getSent(String openid);
    void activatePending(String openid, Long id);
    void ignorePending(String openid, Long id);
    void ensureAccepted(String actorOpenid, String ownerOpenid);
}
