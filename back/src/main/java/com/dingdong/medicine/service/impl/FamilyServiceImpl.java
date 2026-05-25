package com.dingdong.medicine.service.impl;

import com.alibaba.fastjson2.JSON;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dingdong.medicine.common.exception.BizException;
import com.dingdong.medicine.dto.request.CreatePendingRequest;
import com.dingdong.medicine.entity.*;
import com.dingdong.medicine.mapper.*;
import com.dingdong.medicine.service.FamilyService;
import com.dingdong.medicine.vo.FamilyRelationVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static com.dingdong.medicine.common.constant.AppConstants.*;

@Service
@RequiredArgsConstructor
public class FamilyServiceImpl implements FamilyService {

    private final FamilyRelationMapper familyRelationMapper;
    private final FamilyPendingMedicineMapper pendingMedicineMapper;
    private final UserMapper userMapper;
    private final UserMedicineMapper userMedicineMapper;
    private final ReminderMapper reminderMapper;

    @Override
    @Transactional
    public void bind(String openid, String targetOpenid) {
        if (openid.equals(targetOpenid)) {
            throw new BizException("不能绑定自己");
        }

        User target = userMapper.selectById(targetOpenid);
        if (target == null) {
            throw new BizException("目标用户不存在");
        }

        FamilyRelation existing = familyRelationMapper.selectOne(
                new LambdaQueryWrapper<FamilyRelation>()
                        .eq(FamilyRelation::getOwnerOpenid, openid)
                        .eq(FamilyRelation::getMemberOpenid, targetOpenid));
        if (existing != null) {
            throw new BizException("已绑定该成员");
        }

        FamilyRelation relation = new FamilyRelation();
        relation.setOwnerOpenid(openid);
        relation.setMemberOpenid(targetOpenid);
        relation.setStatus(FAMILY_ACCEPTED);
        relation.setCreatedAt(LocalDateTime.now());
        relation.setUpdatedAt(LocalDateTime.now());
        familyRelationMapper.insert(relation);
    }

    @Override
    public List<FamilyRelationVO> getRelations(String openid) {
        List<FamilyRelation> asOwner = familyRelationMapper.selectList(
                new LambdaQueryWrapper<FamilyRelation>()
                        .eq(FamilyRelation::getOwnerOpenid, openid)
                        .eq(FamilyRelation::getStatus, FAMILY_ACCEPTED));

        List<FamilyRelation> asMember = familyRelationMapper.selectList(
                new LambdaQueryWrapper<FamilyRelation>()
                        .eq(FamilyRelation::getMemberOpenid, openid)
                        .eq(FamilyRelation::getStatus, FAMILY_ACCEPTED));

        List<FamilyRelation> all = new ArrayList<>(asOwner);
        for (FamilyRelation r : asMember) {
            boolean dup = false;
            for (FamilyRelation existing : all) {
                if (existing.getId().equals(r.getId())) { dup = true; break; }
            }
            if (!dup) all.add(r);
        }

        List<FamilyRelationVO> result = new ArrayList<>();
        for (FamilyRelation relation : all) {
            User other = relation.getOwnerOpenid().equals(openid)
                    ? userMapper.selectById(relation.getMemberOpenid())
                    : userMapper.selectById(relation.getOwnerOpenid());
            result.add(FamilyRelationVO.builder()
                    .id(relation.getId())
                    .ownerOpenid(relation.getOwnerOpenid())
                    .memberOpenid(relation.getMemberOpenid())
                    .status(relation.getStatus())
                    .nickName(other != null ? other.getNickName() : "")
                    .avatarUrl(other != null ? other.getAvatarUrl() : "")
                    .build());
        }
        return result;
    }

    @Override
    @Transactional
    public void unbind(String openid, Long relationId) {
        FamilyRelation relation = familyRelationMapper.selectById(relationId);
        if (relation == null) {
            throw new BizException("关系不存在");
        }
        if (!relation.getOwnerOpenid().equals(openid)) {
            throw new BizException("无权解绑");
        }
        familyRelationMapper.deleteById(relationId);
    }

    @Override
    @Transactional
    public void createPending(String openid, CreatePendingRequest request) {
        ensureAccepted(openid, request.getOwnerOpenid());

        FamilyPendingMedicine pending = new FamilyPendingMedicine();
        pending.setOwnerOpenid(request.getOwnerOpenid());
        pending.setActorOpenid(openid);
        pending.setName(request.getName());
        pending.setIsQuantifiable(request.getIsQuantifiable() != null ? request.getIsQuantifiable() : false);
        pending.setDoseText(request.getDoseText() != null ? request.getDoseText() : "");
        pending.setTotalAmountText(request.getTotalAmountText());
        pending.setRule(request.getRule() != null ? request.getRule() : "");
        if (request.getDraftPlan() != null) {
            pending.setDraftPlan(JSON.toJSONString(request.getDraftPlan()));
        }
        pending.setStatus(PENDING_STATUS);
        pending.setCreatedAt(LocalDateTime.now());
        pending.setUpdatedAt(LocalDateTime.now());
        pendingMedicineMapper.insert(pending);
    }

    @Override
    public List<FamilyPendingMedicine> getInbox(String openid) {
        return pendingMedicineMapper.selectList(
                new LambdaQueryWrapper<FamilyPendingMedicine>()
                        .eq(FamilyPendingMedicine::getOwnerOpenid, openid)
                        .orderByDesc(FamilyPendingMedicine::getCreatedAt));
    }

    @Override
    public List<FamilyPendingMedicine> getSent(String openid) {
        return pendingMedicineMapper.selectList(
                new LambdaQueryWrapper<FamilyPendingMedicine>()
                        .eq(FamilyPendingMedicine::getActorOpenid, openid)
                        .orderByDesc(FamilyPendingMedicine::getCreatedAt));
    }

    @Override
    @Transactional
    public void activatePending(String openid, Long id) {
        FamilyPendingMedicine pending = pendingMedicineMapper.selectById(id);
        if (pending == null) {
            throw new BizException("待激活药品不存在");
        }
        if (!pending.getOwnerOpenid().equals(openid)) {
            throw new BizException("无权操作");
        }
        if (!PENDING_STATUS.equals(pending.getStatus())) {
            throw new BizException("药品已处理");
        }

        UserMedicine userMedicine = new UserMedicine();
        userMedicine.setOwnerOpenid(openid);
        userMedicine.setActorOpenid(pending.getActorOpenid());
        userMedicine.setName(pending.getName());
        userMedicine.setIsQuantifiable(pending.getIsQuantifiable());
        userMedicine.setDoseText(pending.getDoseText());
        userMedicine.setTotalAmountText(pending.getTotalAmountText());
        userMedicine.setRule(pending.getRule());
        userMedicine.setCreatedAt(LocalDateTime.now());
        userMedicine.setUpdatedAt(LocalDateTime.now());
        userMedicineMapper.insert(userMedicine);

        if (pending.getDraftPlan() != null) {
            CreatePendingRequest.DraftPlan plan = JSON.parseObject(pending.getDraftPlan(), CreatePendingRequest.DraftPlan.class);
            if (plan.getTimes() != null) {
                String planId = "plan_" + userMedicine.getId() + "_" + System.currentTimeMillis();
                String today = com.dingdong.medicine.common.util.ChinaTimeUtil.todayString();
                for (String time : plan.getTimes()) {
                    Reminder reminder = new Reminder();
                    reminder.setOwnerOpenid(openid);
                    reminder.setActorOpenid(pending.getActorOpenid());
                    reminder.setUserMedicineId(userMedicine.getId());
                    reminder.setMedicineName(pending.getName());
                    reminder.setTime(time);
                    reminder.setStartDate(today);
                    reminder.setDoseValue(plan.getDoseValue() != null ? plan.getDoseValue() : "1");
                    reminder.setDoseUnit(plan.getDoseUnit() != null ? plan.getDoseUnit() : "次");
                    reminder.setDoseText(plan.getDoseText() != null ? plan.getDoseText() : "");
                    reminder.setRepeatMode(plan.getRepeatMode() != null ? plan.getRepeatMode() : REPEAT_EVERYDAY);
                    if (plan.getCustomWeekdays() != null) {
                        reminder.setCustomWeekdays(JSON.toJSONString(plan.getCustomWeekdays()));
                    }
                    reminder.setNotifyWechat(true);
                    reminder.setNotifyVibrate(true);
                    reminder.setDailyFrequency(plan.getFrequency() != null ? plan.getFrequency() : 1);
                    reminder.setMealTiming(plan.getMealTiming() != null ? plan.getMealTiming() : MEAL_NONE);
                    reminder.setPlanId(planId);
                    reminder.setCreatedAt(LocalDateTime.now());
                    reminderMapper.insert(reminder);
                }
            }
        }

        pending.setStatus(ACTIVATED_STATUS);
        pending.setActivatedAt(LocalDateTime.now());
        pending.setActivatedBy(openid);
        pending.setUserMedicineId(userMedicine.getId());
        pending.setUpdatedAt(LocalDateTime.now());
        pendingMedicineMapper.updateById(pending);
    }

    @Override
    @Transactional
    public void ignorePending(String openid, Long id) {
        FamilyPendingMedicine pending = pendingMedicineMapper.selectById(id);
        if (pending == null) {
            throw new BizException("待激活药品不存在");
        }
        if (!pending.getOwnerOpenid().equals(openid)) {
            throw new BizException("无权操作");
        }
        if (!PENDING_STATUS.equals(pending.getStatus())) {
            throw new BizException("药品已处理");
        }

        pending.setStatus(IGNORED_STATUS);
        pending.setIgnoredAt(LocalDateTime.now());
        pending.setUpdatedAt(LocalDateTime.now());
        pendingMedicineMapper.updateById(pending);
    }

    @Override
    public void ensureAccepted(String actorOpenid, String ownerOpenid) {
        if (actorOpenid.equals(ownerOpenid)) {
            return;
        }
        FamilyRelation relation = familyRelationMapper.selectOne(
                new LambdaQueryWrapper<FamilyRelation>()
                        .eq(FamilyRelation::getOwnerOpenid, ownerOpenid)
                        .eq(FamilyRelation::getMemberOpenid, actorOpenid)
                        .eq(FamilyRelation::getStatus, FAMILY_ACCEPTED));
        if (relation == null) {
            throw new BizException("无权访问该用户数据，请先绑定家庭关系");
        }
    }
}
