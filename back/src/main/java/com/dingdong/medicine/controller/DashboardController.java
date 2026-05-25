package com.dingdong.medicine.controller;

import com.dingdong.medicine.common.result.R;
import com.dingdong.medicine.dto.response.DashboardResponse;
import com.dingdong.medicine.dto.response.MissedStatsResponse;
import com.dingdong.medicine.entity.WeeklyMissedStat;
import com.dingdong.medicine.service.DashboardService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public R<DashboardResponse> dashboard(HttpServletRequest request,
                                           @RequestParam(required = false) String targetOpenid) {
        String openid = (String) request.getAttribute("openid");
        return R.ok(dashboardService.getDashboard(openid, targetOpenid));
    }

    @GetMapping("/missed-stats")
    public R<MissedStatsResponse> missedStats(HttpServletRequest request,
                                               @RequestParam(required = false) String targetOpenid) {
        String openid = (String) request.getAttribute("openid");
        return R.ok(dashboardService.getMissedStats(openid, targetOpenid));
    }

    @GetMapping("/low-stock")
    public R<List<Map<String, Object>>> lowStock(HttpServletRequest request,
                                                   @RequestParam(required = false) String targetOpenid) {
        String openid = (String) request.getAttribute("openid");
        return R.ok(dashboardService.getLowStock(openid, targetOpenid));
    }

    @GetMapping("/low-stock-summary")
    public R<Map<String, Object>> lowStockSummary(HttpServletRequest request,
                                                    @RequestParam(required = false) String targetOpenid) {
        String openid = (String) request.getAttribute("openid");
        return R.ok(dashboardService.getLowStockSummary(openid, targetOpenid));
    }

    @GetMapping("/history")
    public R<List<Map<String, Object>>> history(HttpServletRequest request,
                                                  @RequestParam(required = false) String targetOpenid,
                                                  @RequestParam(required = false) Integer days) {
        String openid = (String) request.getAttribute("openid");
        return R.ok(dashboardService.getHistory(openid, targetOpenid, days));
    }

    @GetMapping("/weekly-stats")
    public R<List<WeeklyMissedStat>> weeklyStats(HttpServletRequest request) {
        String openid = (String) request.getAttribute("openid");
        return R.ok(dashboardService.getWeeklyStats(openid));
    }

    @GetMapping("/weekly-stats/{id}")
    public R<WeeklyMissedStat> weeklyStatById(@PathVariable String id) {
        return R.ok(dashboardService.getWeeklyStatById(id));
    }
}
