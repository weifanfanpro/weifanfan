package com.dingdong.medicine.controller;

import com.dingdong.medicine.common.result.R;
import com.dingdong.medicine.entity.Medicine;
import com.dingdong.medicine.service.MedicineService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/medicine")
@RequiredArgsConstructor
public class MedicineController {

    private final MedicineService medicineService;

    @PostMapping("/recognize")
    public R<Medicine> recognize(HttpServletRequest request, @RequestParam("file") MultipartFile file) {
        String openid = (String) request.getAttribute("openid");
        return R.ok(medicineService.recognize(openid, file));
    }

    @PostMapping("/recognize/upload")
    public R<Map<String, String>> upload(HttpServletRequest request, @RequestParam("file") MultipartFile file) {
        String openid = (String) request.getAttribute("openid");
        String url = medicineService.uploadImage(openid, file);
        Map<String, String> data = new HashMap<>();
        data.put("url", url);
        return R.ok(data);
    }

    @GetMapping("/{id}")
    public R<Medicine> getById(@PathVariable Long id) {
        return R.ok(medicineService.getById(id));
    }

    @GetMapping("/by-name")
    public R<Medicine> getByName(@RequestParam String name) {
        return R.ok(medicineService.getByName(name));
    }
}
