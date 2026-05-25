package com.dingdong.medicine.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateOrderRequest {
    @NotBlank(message = "addressId不能为空")
    private String addressId;
    @NotEmpty(message = "商品列表不能为空")
    private List<OrderItem> items;

    @Data
    public static class OrderItem {
        @NotBlank(message = "productId不能为空")
        private String productId;
        @NotNull(message = "quantity不能为空")
        private Integer quantity;
    }
}
