package com.dingdong.medicine.controller.user;

import com.dingdong.medicine.common.result.R;
import com.dingdong.medicine.dto.request.AddMedicineRequest;
import com.dingdong.medicine.entity.UserMedicine;
import com.dingdong.medicine.service.UserMedicineService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user-medicine")
@RequiredArgsConstructor
public class UserMedicineController {

    private final UserMedicineService userMedicineService;

    @PostMapping
    public R<UserMedicine> add(HttpServletRequest request, @Valid @RequestBody AddMedicineRequest addRequest) {
        String openid = (String) request.getAttribute("openid");
        return R.ok(userMedicineService.add(openid, addRequest));
    }

    @GetMapping("/list")
    public R<List<UserMedicine>> list(HttpServletRequest request,
                                       @RequestParam(required = false) String targetOpenid) {
        String openid = (String) request.getAttribute("openid");
        return R.ok(userMedicineService.list(openid, targetOpenid));
    }

    @GetMapping("/{id}")
    public R<UserMedicine> getById(@PathVariable Long id) {
        return R.ok(userMedicineService.getById(id));
    }

    @PutMapping("/{id}")
    public R<Void> update(HttpServletRequest request, @PathVariable Long id,
                           @RequestBody Map<String, Object> fields) {
        String openid = (String) request.getAttribute("openid");
        userMedicineService.update(openid, id, fields);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    public R<Void> delete(HttpServletRequest request, @PathVariable Long id) {
        String openid = (String) request.getAttribute("openid");
        userMedicineService.delete(openid, id);
        return R.ok();
    }
}
