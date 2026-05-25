package com.dingdong.medicine.service;

import java.util.List;
import java.util.Map;

public interface PharmacyService {
    List<Map<String, Object>> nearby(double lat, double lng, int radius);
}
