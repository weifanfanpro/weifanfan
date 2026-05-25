package com.dingdong.medicine.controller;

import com.dingdong.medicine.common.result.R;
import com.dingdong.medicine.dto.request.SaveAddressRequest;
import com.dingdong.medicine.entity.UserShippingAddress;
import com.dingdong.medicine.service.AddressService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/address")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;

    @GetMapping("/list")
    public R<List<UserShippingAddress>> list(HttpServletRequest request) {
        String openid = (String) request.getAttribute("openid");
        return R.ok(addressService.list(openid));
    }

    @GetMapping("/default")
    public R<UserShippingAddress> getDefault(HttpServletRequest request) {
        String openid = (String) request.getAttribute("openid");
        return R.ok(addressService.getDefault(openid));
    }

    @PostMapping
    public R<Void> save(HttpServletRequest request, @Valid @RequestBody SaveAddressRequest addressRequest) {
        String openid = (String) request.getAttribute("openid");
        addressService.save(openid, addressRequest);
        return R.ok();
    }

    @PutMapping("/{addressId}/default")
    public R<Void> setDefault(HttpServletRequest request, @PathVariable String addressId) {
        String openid = (String) request.getAttribute("openid");
        addressService.setDefault(openid, addressId);
        return R.ok();
    }

    @DeleteMapping("/{addressId}")
    public R<Void> delete(HttpServletRequest request, @PathVariable String addressId) {
        String openid = (String) request.getAttribute("openid");
        addressService.delete(openid, addressId);
        return R.ok();
    }
}
