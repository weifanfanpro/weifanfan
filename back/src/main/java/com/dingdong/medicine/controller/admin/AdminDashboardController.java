package com.dingdong.medicine.controller.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dingdong.medicine.common.result.R;
import com.dingdong.medicine.entity.*;
import com.dingdong.medicine.mapper.*;
import com.dingdong.medicine.service.PointsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final UserMapper userMapper;
    private final MallOrderMapper orderMapper;
    private final MallProductMapper productMapper;
    private final UserFeedbackMapper feedbackMapper;
    private final PointsService pointsService;

    @GetMapping("/dashboard/summary")
    public R<Map<String, Object>> summary() {
        Map<String, Object> data = new HashMap<>();
        data.put("totalUsers", userMapper.selectCount(null));
        data.put("totalOrders", orderMapper.selectCount(null));
        data.put("totalProducts", productMapper.selectCount(null));
        data.put("totalFeedbacks", feedbackMapper.selectCount(null));
        return R.ok(data);
    }

    @GetMapping("/feedbacks")
    public R<List<UserFeedback>> feedbacks() {
        return R.ok(feedbackMapper.selectList(
                new LambdaQueryWrapper<UserFeedback>()
                        .orderByDesc(UserFeedback::getCreatedAt)));
    }

    @PostMapping("/points/adjust")
    public R<Void> adjustPoints(@RequestBody Map<String, Object> body) {
        String openid = (String) body.get("openid");
        Integer points = (Integer) body.get("points");
        String reason = (String) body.get("reason");
        if (points > 0) {
            pointsService.addPoints(openid, points, "admin_adjust", reason);
        } else if (points < 0) {
            pointsService.deductPoints(openid, -points, "admin_adjust", reason);
        }
        return R.ok();
    }
}
