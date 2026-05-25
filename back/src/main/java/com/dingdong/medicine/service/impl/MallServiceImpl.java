package com.dingdong.medicine.service.impl;

import com.alibaba.fastjson2.JSON;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dingdong.medicine.common.exception.BizException;
import com.dingdong.medicine.dto.request.CreateOrderRequest;
import com.dingdong.medicine.entity.*;
import com.dingdong.medicine.mapper.*;
import com.dingdong.medicine.service.MallService;
import com.dingdong.medicine.service.PointsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

import static com.dingdong.medicine.common.constant.AppConstants.*;

@Service
@RequiredArgsConstructor
public class MallServiceImpl implements MallService {

    private final MallProductMapper productMapper;
    private final MallOrderMapper orderMapper;
    private final MallOrderItemMapper orderItemMapper;
    private final UserShippingAddressMapper addressMapper;
    private final PointsService pointsService;

    @Override
    public List<MallProduct> getProducts() {
        return productMapper.selectList(
                new LambdaQueryWrapper<MallProduct>()
                        .eq(MallProduct::getStatus, "on")
                        .orderByAsc(MallProduct::getId));
    }

    @Override
    public MallProduct getProductById(String productId) {
        MallProduct product = productMapper.selectOne(
                new LambdaQueryWrapper<MallProduct>()
                        .eq(MallProduct::getProductId, productId));
        if (product == null) {
            throw new BizException("商品不存在");
        }
        return product;
    }

    @Override
    @Transactional
    public MallOrder createOrder(String openid, CreateOrderRequest request) {
        UserShippingAddress address = addressMapper.selectOne(
                new LambdaQueryWrapper<UserShippingAddress>()
                        .eq(UserShippingAddress::getAddressId, request.getAddressId())
                        .eq(UserShippingAddress::getOpenid, openid));
        if (address == null) {
            throw new BizException("收货地址不存在");
        }

        int totalPoints = 0;
        List<MallOrderItem> items = new ArrayList<>();
        for (CreateOrderRequest.OrderItem reqItem : request.getItems()) {
            MallProduct product = productMapper.selectOne(
                    new LambdaQueryWrapper<MallProduct>()
                            .eq(MallProduct::getProductId, reqItem.getProductId())
                            .eq(MallProduct::getStatus, "on"));
            if (product == null) {
                throw new BizException("商品不存在: " + reqItem.getProductId());
            }
            if (product.getStock() < reqItem.getQuantity()) {
                throw new BizException("库存不足: " + product.getName());
            }
            totalPoints += product.getPointsPrice() * reqItem.getQuantity();

            MallOrderItem item = new MallOrderItem();
            item.setProductId(product.getProductId());
            item.setProductName(product.getName());
            item.setCoverUrl(product.getCoverUrl());
            item.setPointsPrice(product.getPointsPrice());
            item.setQuantity(reqItem.getQuantity());
            items.add(item);
        }

        pointsService.deductPoints(openid, totalPoints, "mallOrder", "");
        UserPointsWallet wallet = pointsService.getWallet(openid);

        String orderId = "MO" + System.currentTimeMillis() + String.format("%04d", new Random().nextInt(10000));
        Map<String, Object> addressSnapshot = new HashMap<>();
        addressSnapshot.put("receiver", address.getReceiver());
        addressSnapshot.put("phone", address.getPhone());
        addressSnapshot.put("region", address.getRegion());
        addressSnapshot.put("detail", address.getDetail());

        List<Map<String, Object>> timeline = new ArrayList<>();
        Map<String, Object> entry = new HashMap<>();
        entry.put("status", ORDER_CREATED);
        entry.put("time", LocalDateTime.now().toString());
        timeline.add(entry);

        MallOrder order = new MallOrder();
        order.setOrderId(orderId);
        order.setOpenid(openid);
        order.setStatus(ORDER_CREATED);
        order.setPointsCost(totalPoints);
        order.setPointsBalanceAfter(wallet.getPointsBalance());
        order.setAddressSnapshot(JSON.toJSONString(addressSnapshot));
        order.setStatusTimeline(JSON.toJSONString(timeline));
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        orderMapper.insert(order);

        for (MallOrderItem item : items) {
            item.setOrderId(orderId);
            orderItemMapper.insert(item);

            MallProduct product = productMapper.selectOne(
                    new LambdaQueryWrapper<MallProduct>()
                            .eq(MallProduct::getProductId, item.getProductId()));
            product.setStock(product.getStock() - item.getQuantity());
            product.setUpdatedAt(LocalDateTime.now());
            productMapper.updateById(product);
        }

        return order;
    }

    @Override
    public List<MallOrder> getOrders(String openid) {
        return orderMapper.selectList(
                new LambdaQueryWrapper<MallOrder>()
                        .eq(MallOrder::getOpenid, openid)
                        .orderByDesc(MallOrder::getCreatedAt));
    }

    @Override
    public MallOrder getOrderById(String openid, String orderId) {
        MallOrder order = orderMapper.selectOne(
                new LambdaQueryWrapper<MallOrder>()
                        .eq(MallOrder::getOrderId, orderId)
                        .eq(MallOrder::getOpenid, openid));
        if (order == null) {
            throw new BizException("订单不存在");
        }
        return order;
    }

    @Override
    public void deleteOrder(String openid, String orderId) {
        MallOrder order = getOrderById(openid, orderId);
        orderMapper.delete(
                new LambdaQueryWrapper<MallOrder>()
                        .eq(MallOrder::getOrderId, orderId));
        orderItemMapper.delete(
                new LambdaQueryWrapper<MallOrderItem>()
                        .eq(MallOrderItem::getOrderId, orderId));
    }

    @Override
    @Transactional
    public void advanceOrder(String openid, String orderId) {
        MallOrder order = getOrderById(openid, orderId);
        String nextStatus = getNextStatus(order.getStatus());
        if (nextStatus == null) {
            throw new BizException("订单已完成，无法继续推进");
        }

        List<Map<String, Object>> timeline = JSON.parseObject(order.getStatusTimeline(), List.class);
        Map<String, Object> entry = new HashMap<>();
        entry.put("status", nextStatus);
        entry.put("time", LocalDateTime.now().toString());
        timeline.add(entry);

        order.setStatus(nextStatus);
        order.setStatusTimeline(JSON.toJSONString(timeline));
        order.setUpdatedAt(LocalDateTime.now());
        orderMapper.updateById(order);
    }

    private String getNextStatus(String current) {
        return switch (current) {
            case ORDER_CREATED -> ORDER_PAID;
            case ORDER_PAID -> ORDER_PACKING;
            case ORDER_PACKING -> ORDER_SHIPPING;
            case ORDER_SHIPPING -> ORDER_DELIVERED;
            default -> null;
        };
    }
}
