package com.dingdong.medicine.controller.user;

import com.dingdong.medicine.common.result.R;
import com.dingdong.medicine.entity.UserPointsLog;
import com.dingdong.medicine.entity.UserPointsWallet;
import com.dingdong.medicine.service.PointsService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/points")
@RequiredArgsConstructor
public class PointsController {

    private final PointsService pointsService;

    @GetMapping("/wallet")
    public R<UserPointsWallet> wallet(HttpServletRequest request) {
        String openid = (String) request.getAttribute("openid");
        return R.ok(pointsService.getWallet(openid));
    }

    @GetMapping("/logs")
    public R<List<UserPointsLog>> logs(HttpServletRequest request) {
        String openid = (String) request.getAttribute("openid");
        return R.ok(pointsService.getLogs(openid));
    }
}
