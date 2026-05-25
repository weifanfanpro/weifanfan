package com.dingdong.medicine.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dingdong.medicine.common.exception.BizException;
import com.dingdong.medicine.dto.request.SaveAddressRequest;
import com.dingdong.medicine.entity.UserShippingAddress;
import com.dingdong.medicine.mapper.UserShippingAddressMapper;
import com.dingdong.medicine.service.AddressService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AddressServiceImpl implements AddressService {

    private final UserShippingAddressMapper addressMapper;

    @Override
    public List<UserShippingAddress> list(String openid) {
        return addressMapper.selectList(
                new LambdaQueryWrapper<UserShippingAddress>()
                        .eq(UserShippingAddress::getOpenid, openid)
                        .orderByDesc(UserShippingAddress::getIsDefault)
                        .orderByDesc(UserShippingAddress::getUpdatedAt));
    }

    @Override
    public UserShippingAddress getDefault(String openid) {
        return addressMapper.selectOne(
                new LambdaQueryWrapper<UserShippingAddress>()
                        .eq(UserShippingAddress::getOpenid, openid)
                        .eq(UserShippingAddress::getIsDefault, true));
    }

    @Override
    @Transactional
    public void save(String openid, SaveAddressRequest request) {
        if (request.getAddressId() != null) {
            UserShippingAddress address = addressMapper.selectOne(
                    new LambdaQueryWrapper<UserShippingAddress>()
                            .eq(UserShippingAddress::getAddressId, request.getAddressId())
                            .eq(UserShippingAddress::getOpenid, openid));
            if (address == null) {
                throw new BizException("地址不存在");
            }
            address.setReceiver(request.getReceiver());
            address.setPhone(request.getPhone());
            address.setRegion(request.getRegion());
            address.setDetail(request.getDetail());
            address.setTag(request.getTag());
            if (request.getIsDefault() != null) {
                address.setIsDefault(request.getIsDefault());
            }
            address.setUpdatedAt(LocalDateTime.now());
            addressMapper.updateById(address);
        } else {
            UserShippingAddress address = new UserShippingAddress();
            address.setAddressId("AD" + System.currentTimeMillis() + String.format("%04d", new java.util.Random().nextInt(10000)));
            address.setOpenid(openid);
            address.setReceiver(request.getReceiver());
            address.setPhone(request.getPhone());
            address.setRegion(request.getRegion());
            address.setDetail(request.getDetail());
            address.setTag(request.getTag());
            address.setIsDefault(request.getIsDefault() != null ? request.getIsDefault() : false);
            address.setCreatedAt(LocalDateTime.now());
            address.setUpdatedAt(LocalDateTime.now());
            addressMapper.insert(address);

            if (Boolean.TRUE.equals(address.getIsDefault())) {
                clearOtherDefault(openid, address.getAddressId());
            }
        }
    }

    @Override
    @Transactional
    public void setDefault(String openid, String addressId) {
        UserShippingAddress address = addressMapper.selectOne(
                new LambdaQueryWrapper<UserShippingAddress>()
                        .eq(UserShippingAddress::getAddressId, addressId)
                        .eq(UserShippingAddress::getOpenid, openid));
        if (address == null) {
            throw new BizException("地址不存在");
        }
        address.setIsDefault(true);
        address.setUpdatedAt(LocalDateTime.now());
        addressMapper.updateById(address);
        clearOtherDefault(openid, addressId);
    }

    @Override
    public void delete(String openid, String addressId) {
        addressMapper.delete(
                new LambdaQueryWrapper<UserShippingAddress>()
                        .eq(UserShippingAddress::getAddressId, addressId)
                        .eq(UserShippingAddress::getOpenid, openid));
    }

    private void clearOtherDefault(String openid, String excludeAddressId) {
        List<UserShippingAddress> addresses = list(openid);
        for (UserShippingAddress addr : addresses) {
            if (!addr.getAddressId().equals(excludeAddressId) && Boolean.TRUE.equals(addr.getIsDefault())) {
                addr.setIsDefault(false);
                addr.setUpdatedAt(LocalDateTime.now());
                addressMapper.updateById(addr);
            }
        }
    }
}
