package com.dingdong.medicine.service.impl;

import cn.hutool.http.HttpUtil;
import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.dingdong.medicine.common.exception.BizException;
import com.dingdong.medicine.common.util.RedisUtil;
import com.dingdong.medicine.service.PharmacyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import static com.dingdong.medicine.common.constant.AppConstants.REDIS_PHARMACY_CACHE;

@Slf4j
@Service
@RequiredArgsConstructor
public class PharmacyServiceImpl implements PharmacyService {

    private final RedisUtil redisUtil;

    @Value("${dingdong.map.baidu-ak}")
    private String baiduAk;

    @SuppressWarnings("unchecked")
    @Override
    public List<Map<String, Object>> nearby(double lat, double lng, int radius) {
        String cacheKey = REDIS_PHARMACY_CACHE + lat + ":" + lng + ":" + radius;
        String cached = redisUtil.get(cacheKey);
        if (cached != null) {
            return JSONUtil.toList(cached, Map.class).stream()
                    .map(m -> (Map<String, Object>) m)
                    .toList();
        }

        try {
            String url = String.format(
                    "https://api.map.baidu.com/place/v2/search?query=药店&location=%f,%f&radius=%d&output=json&ak=%s",
                    lat, lng, radius, baiduAk);
            String result = HttpUtil.get(url);
            JSONObject json = JSONUtil.parseObj(result);

            if (json.getInt("status") != 0) {
                throw new BizException("地图服务异常");
            }

            List<Map<String, Object>> pharmacies = new ArrayList<>();
            JSONArray results = json.getJSONArray("results");
            for (int i = 0; i < results.size(); i++) {
                JSONObject item = results.getJSONObject(i);
                Map<String, Object> pharmacy = new HashMap<>();
                pharmacy.put("name", item.getStr("name"));
                pharmacy.put("address", item.getStr("address"));
                pharmacy.put("phone", item.getStr("telephone"));
                pharmacy.put("lat", item.getJSONObject("location").getDouble("lat"));
                pharmacy.put("lng", item.getJSONObject("location").getDouble("lng"));
                pharmacy.put("distance", item.getInt("detail_info") != null ?
                        item.getJSONObject("detail_info").getInt("distance") : null);
                pharmacies.add(pharmacy);
            }

            redisUtil.set(cacheKey, JSONUtil.toJsonStr(pharmacies), 15, TimeUnit.MINUTES);
            return pharmacies;
        } catch (BizException e) {
            throw e;
        } catch (Exception e) {
            log.error("查询附近药店失败", e);
            throw new BizException("查询附近药店失败");
        }
    }
}
