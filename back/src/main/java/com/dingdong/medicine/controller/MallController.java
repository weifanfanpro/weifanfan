package com.dingdong.medicine.controller;

import com.dingdong.medicine.common.result.R;
import com.dingdong.medicine.dto.request.CreateOrderRequest;
import com.dingdong.medicine.entity.MallOrder;
import com.dingdong.medicine.entity.MallProduct;
import com.dingdong.medicine.service.MallService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mall")
@RequiredArgsConstructor
public class MallController {

    private final MallService mallService;

    @GetMapping("/products")
    public R<List<MallProduct>> products() {
        return R.ok(mallService.getProducts());
    }

    @GetMapping("/products/{productId}")
    public R<MallProduct> productById(@PathVariable String productId) {
        return R.ok(mallService.getProductById(productId));
    }

    @PostMapping("/orders")
    public R<MallOrder> createOrder(HttpServletRequest request,
                                     @Valid @RequestBody CreateOrderRequest orderRequest) {
        String openid = (String) request.getAttribute("openid");
        return R.ok(mallService.createOrder(openid, orderRequest));
    }

    @GetMapping("/orders")
    public R<List<MallOrder>> orders(HttpServletRequest request) {
        String openid = (String) request.getAttribute("openid");
        return R.ok(mallService.getOrders(openid));
    }

    @GetMapping("/orders/{orderId}")
    public R<MallOrder> orderById(HttpServletRequest request, @PathVariable String orderId) {
        String openid = (String) request.getAttribute("openid");
        return R.ok(mallService.getOrderById(openid, orderId));
    }

    @DeleteMapping("/orders/{orderId}")
    public R<Void> deleteOrder(HttpServletRequest request, @PathVariable String orderId) {
        String openid = (String) request.getAttribute("openid");
        mallService.deleteOrder(openid, orderId);
        return R.ok();
    }

    @PostMapping("/orders/{orderId}/advance")
    public R<Void> advanceOrder(HttpServletRequest request, @PathVariable String orderId) {
        String openid = (String) request.getAttribute("openid");
        mallService.advanceOrder(openid, orderId);
        return R.ok();
    }
}
