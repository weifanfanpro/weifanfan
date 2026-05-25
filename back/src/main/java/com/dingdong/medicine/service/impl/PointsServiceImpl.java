package com.dingdong.medicine.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dingdong.medicine.common.exception.BizException;
import com.dingdong.medicine.entity.UserPointsLog;
import com.dingdong.medicine.entity.UserPointsWallet;
import com.dingdong.medicine.mapper.UserPointsLogMapper;
import com.dingdong.medicine.mapper.UserPointsWalletMapper;
import com.dingdong.medicine.service.PointsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static com.dingdong.medicine.common.constant.AppConstants.REDIS_POINTS_BALANCE;

@Service
@RequiredArgsConstructor
public class PointsServiceImpl implements PointsService {

    private final UserPointsWalletMapper walletMapper;
    private final UserPointsLogMapper logMapper;
    private final com.dingdong.medicine.common.util.RedisUtil redisUtil;

    @Override
    public UserPointsWallet getWallet(String openid) {
        UserPointsWallet wallet = walletMapper.selectById(openid);
        if (wallet == null) {
            wallet = new UserPointsWallet();
            wallet.setOpenid(openid);
            wallet.setPointsBalance(1000);
            wallet.setCreatedAt(LocalDateTime.now());
            wallet.setUpdatedAt(LocalDateTime.now());
            walletMapper.insert(wallet);
        }
        return wallet;
    }

    @Override
    public List<UserPointsLog> getLogs(String openid) {
        return logMapper.selectList(
                new LambdaQueryWrapper<UserPointsLog>()
                        .eq(UserPointsLog::getOpenid, openid)
                        .orderByDesc(UserPointsLog::getCreatedAt));
    }

    @Override
    @Transactional
    public void addPoints(String openid, int points, String source, String refId) {
        UserPointsWallet wallet = getWallet(openid);
        wallet.setPointsBalance(wallet.getPointsBalance() + points);
        wallet.setUpdatedAt(LocalDateTime.now());
        walletMapper.updateById(wallet);

        UserPointsLog log = new UserPointsLog();
        log.setOpenid(openid);
        log.setType("earn");
        log.setDelta(points);
        log.setSource(source);
        log.setRefId(refId);
        log.setCreatedAt(LocalDateTime.now());
        logMapper.insert(log);

        redisUtil.delete(REDIS_POINTS_BALANCE + openid);
    }

    @Override
    @Transactional
    public void deductPoints(String openid, int points, String source, String refId) {
        UserPointsWallet wallet = getWallet(openid);
        if (wallet.getPointsBalance() < points) {
            throw new BizException("积分不足");
        }
        wallet.setPointsBalance(wallet.getPointsBalance() - points);
        wallet.setUpdatedAt(LocalDateTime.now());
        walletMapper.updateById(wallet);

        UserPointsLog log = new UserPointsLog();
        log.setOpenid(openid);
        log.setType("spend");
        log.setDelta(-points);
        log.setSource(source);
        log.setRefId(refId);
        log.setCreatedAt(LocalDateTime.now());
        logMapper.insert(log);

        redisUtil.delete(REDIS_POINTS_BALANCE + openid);
    }
}
