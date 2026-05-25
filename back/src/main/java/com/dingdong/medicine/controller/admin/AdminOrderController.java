package com.dingdong.medicine.controller.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dingdong.medicine.common.result.R;
import com.dingdong.medicine.entity.MallOrder;
import com.dingdong.medicine.mapper.MallOrderMapper;
import com.dingdong.medicine.service.MallService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final MallOrderMapper orderMapper;
    private final MallService mallService;

    @GetMapping
    public R<List<MallOrder>> list() {
        return R.ok(orderMapper.selectList(
                new LambdaQueryWrapper<MallOrder>()
                        .orderByDesc(MallOrder::getCreatedAt)));
    }

    @PostMapping("/{orderId}/advance")
    public R<Void> advance(@PathVariable String orderId) {
        MallOrder order = orderMapper.selectOne(
                new LambdaQueryWrapper<MallOrder>()
                        .eq(MallOrder::getOrderId, orderId));
        if (order != null) {
            mallService.advanceOrder(order.getOpenid(), orderId);
        }
        return R.ok();
    }
}
