package com.dingdong.medicine.controller.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dingdong.medicine.common.result.R;
import com.dingdong.medicine.entity.MallProduct;
import com.dingdong.medicine.mapper.MallProductMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
public class AdminProductController {

    private final MallProductMapper productMapper;

    @GetMapping
    public R<List<MallProduct>> list() {
        return R.ok(productMapper.selectList(null));
    }

    @PostMapping
    public R<Void> save(@RequestBody Map<String, Object> body) {
        String productId = (String) body.get("productId");
        MallProduct product;
        if (productId != null) {
            product = productMapper.selectOne(
                    new LambdaQueryWrapper<MallProduct>()
                            .eq(MallProduct::getProductId, productId));
            if (product != null) {
                product.setName((String) body.get("name"));
                product.setDescription((String) body.get("description"));
                product.setCoverUrl((String) body.get("coverUrl"));
                product.setPointsPrice((Integer) body.get("pointsPrice"));
                product.setStock((Integer) body.get("stock"));
                product.setCategory((String) body.get("category"));
                product.setStatus((String) body.get("status"));
                product.setUpdatedAt(LocalDateTime.now());
                productMapper.updateById(product);
                return R.ok();
            }
        }

        product = new MallProduct();
        product.setProductId("p" + System.currentTimeMillis());
        product.setName((String) body.get("name"));
        product.setDescription((String) body.get("description"));
        product.setCoverUrl((String) body.get("coverUrl"));
        product.setPointsPrice((Integer) body.get("pointsPrice"));
        product.setStock((Integer) body.get("stock"));
        product.setCategory((String) body.get("category"));
        product.setStatus("on");
        product.setCreatedAt(LocalDateTime.now());
        product.setUpdatedAt(LocalDateTime.now());
        productMapper.insert(product);
        return R.ok();
    }

    @DeleteMapping("/{productId}")
    public R<Void> delete(@PathVariable String productId) {
        productMapper.delete(
                new LambdaQueryWrapper<MallProduct>()
                        .eq(MallProduct::getProductId, productId));
        return R.ok();
    }
}
