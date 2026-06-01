package com.dingdong.medicine.controller.admin;

import com.dingdong.medicine.common.exception.BizException;
import com.dingdong.medicine.common.result.R;
import com.dingdong.medicine.entity.User;
import com.dingdong.medicine.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserMapper userMapper;

    @GetMapping("/list")
    public R<List<User>> list() {
        return R.ok(userMapper.selectList(null));
    }

    @PostMapping("/{id}/status")
    public R<Void> updateStatus(@PathVariable String id,
                                @RequestBody java.util.Map<String, String> body) {
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new BizException("用户不存在");
        }
        String newStatus = body.get("status");
        if (!"enabled".equals(newStatus) && !"disabled".equals(newStatus)) {
            throw new BizException("无效的状态值");
        }
        user.setStatus(newStatus);
        user.setUpdatedAt(java.time.LocalDateTime.now());
        userMapper.updateById(user);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable String id) {
        userMapper.deleteById(id);
        return R.ok();
    }
}
