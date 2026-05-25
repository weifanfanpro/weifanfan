package com.dingdong.medicine.service;

import com.dingdong.medicine.dto.request.CreateOrderRequest;
import com.dingdong.medicine.entity.MallOrder;
import com.dingdong.medicine.entity.MallProduct;

import java.util.List;

public interface MallService {
    List<MallProduct> getProducts();
    MallProduct getProductById(String productId);
    MallOrder createOrder(String openid, CreateOrderRequest request);
    List<MallOrder> getOrders(String openid);
    MallOrder getOrderById(String openid, String orderId);
    void deleteOrder(String openid, String orderId);
    void advanceOrder(String openid, String orderId);
}
