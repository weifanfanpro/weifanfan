package com.dingdong.medicine.service;

import com.dingdong.medicine.entity.UserPointsLog;
import com.dingdong.medicine.entity.UserPointsWallet;

import java.util.List;

public interface PointsService {
    UserPointsWallet getWallet(String openid);
    List<UserPointsLog> getLogs(String openid);
    void addPoints(String openid, int points, String source, String refId);
    void deductPoints(String openid, int points, String source, String refId);
}
