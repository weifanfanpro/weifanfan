package com.dingdong.medicine.controller.user;

import com.dingdong.medicine.common.result.R;
import com.dingdong.medicine.dto.request.CreateReminderPlanRequest;
import com.dingdong.medicine.dto.request.TakeMedicineRequest;
import com.dingdong.medicine.entity.Reminder;
import com.dingdong.medicine.service.ReminderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reminder")
@RequiredArgsConstructor
public class ReminderController {

    private final ReminderService reminderService;

    @PostMapping("/plan")
    public R<List<Reminder>> createPlan(HttpServletRequest request,
                                         @Valid @RequestBody CreateReminderPlanRequest planRequest) {
        String openid = (String) request.getAttribute("openid");
        return R.ok(reminderService.createPlan(openid, planRequest));
    }

    @GetMapping("/list")
    public R<List<Reminder>> list(HttpServletRequest request,
                                   @RequestParam(required = false) String targetOpenid) {
        String openid = (String) request.getAttribute("openid");
        return R.ok(reminderService.list(openid, targetOpenid));
    }

    @GetMapping("/{id}")
    public R<Reminder> getById(@PathVariable Long id) {
        return R.ok(reminderService.getById(id));
    }

    @DeleteMapping("/{id}")
    public R<Void> delete(HttpServletRequest request, @PathVariable Long id) {
        String openid = (String) request.getAttribute("openid");
        reminderService.delete(openid, id);
        return R.ok();
    }

    @PostMapping("/take")
    public R<Map<String, Object>> takeMedicine(HttpServletRequest request,
                                                @Valid @RequestBody TakeMedicineRequest takeRequest) {
        String openid = (String) request.getAttribute("openid");
        return R.ok(reminderService.takeMedicine(openid, takeRequest));
    }

    @GetMapping("/drug-detail-rule")
    public R<List<Reminder>> getByUserMedicineId(@RequestParam Long userMedicineId) {
        return R.ok(reminderService.getByUserMedicineId(userMedicineId));
    }

    @PostMapping("/test-push")
    public R<String> testPush(HttpServletRequest request) {
        String openid = (String) request.getAttribute("openid");
        return R.ok(reminderService.testPush(openid));
    }
}
