package com.dingdong.medicine.service;

import com.dingdong.medicine.dto.request.SaveAddressRequest;
import com.dingdong.medicine.entity.UserShippingAddress;

import java.util.List;

public interface AddressService {
    List<UserShippingAddress> list(String openid);
    UserShippingAddress getDefault(String openid);
    void save(String openid, SaveAddressRequest request);
    void setDefault(String openid, String addressId);
    void delete(String openid, String addressId);
}
