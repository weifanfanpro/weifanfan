package com.dingdong.medicine.controller;

import com.dingdong.medicine.common.result.R;
import com.dingdong.medicine.service.PharmacyService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pharmacy")
@RequiredArgsConstructor
public class PharmacyController {

    private final PharmacyService pharmacyService;

    @PostMapping("/nearby")
    public R<List<Map<String, Object>>> nearby(@RequestParam double lat,
                                                @RequestParam double lng,
                                                @RequestParam(defaultValue = "3000") int radius) {
        return R.ok(pharmacyService.nearby(lat, lng, radius));
    }
}
