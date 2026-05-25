package com.dingdong.medicine.controller.admin;

import cn.hutool.crypto.digest.DigestUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dingdong.medicine.common.exception.BizException;
import com.dingdong.medicine.common.result.R;
import com.dingdong.medicine.common.util.RedisUtil;
import com.dingdong.medicine.dto.request.AdminLoginRequest;
import com.dingdong.medicine.entity.AdminAccount;
import com.dingdong.medicine.entity.AdminSession;
import com.dingdong.medicine.mapper.AdminAccountMapper;
import com.dingdong.medicine.mapper.AdminSessionMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

import static com.dingdong.medicine.common.constant.AppConstants.*;

@RestController
@RequestMapping("/api/admin/auth")
@RequiredArgsConstructor
public class AdminAuthController {

    private final AdminAccountMapper accountMapper;
    private final AdminSessionMapper sessionMapper;
    private final RedisUtil redisUtil;

    @Value("${dingdong.jwt.expiration}")
    private long expiration;

    @PostMapping("/login")
    public R<Map<String, Object>> login(@Valid @RequestBody AdminLoginRequest request) {
        AdminAccount account = accountMapper.selectOne(
                new LambdaQueryWrapper<AdminAccount>()
                        .eq(AdminAccount::getUsername, request.getUsername()));
        if (account == null) {
            throw new BizException("用户名或密码错误");
        }
        if ("disabled".equals(account.getStatus())) {
            throw new BizException("账号已禁用");
        }
        String hash = DigestUtil.sha256Hex(request.getPassword());
        if (!hash.equals(account.getPasswordHash())) {
            throw new BizException("用户名或密码错误");
        }

        String token = UUID.randomUUID().toString().replace("-", "");
        AdminSession session = new AdminSession();
        session.setUsername(account.getUsername());
        session.setToken(token);
        session.setExpiresAt(System.currentTimeMillis() + 8 * 3600 * 1000);
        session.setCreatedAt(LocalDateTime.now());
        session.setUpdatedAt(LocalDateTime.now());
        sessionMapper.insert(session);

        redisUtil.set(REDIS_ADMIN_SESSION + token, account.getUsername(), 8, java.util.concurrent.TimeUnit.HOURS);

        account.setLastLoginAt(LocalDateTime.now());
        accountMapper.updateById(account);

        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("role", account.getRole());
        data.put("username", account.getUsername());
        return R.ok(data);
    }

    @GetMapping("/verify")
    public R<Map<String, Object>> verify(@RequestHeader("Authorization") String auth) {
        String token = auth.startsWith("Bearer ") ? auth.substring(7) : auth;
        String username = redisUtil.get(REDIS_ADMIN_SESSION + token);
        if (username == null) {
            throw new BizException("Token无效或已过期");
        }
        AdminAccount account = accountMapper.selectOne(
                new LambdaQueryWrapper<AdminAccount>()
                        .eq(AdminAccount::getUsername, username));
        Map<String, Object> data = new HashMap<>();
        data.put("username", username);
        data.put("role", account != null ? account.getRole() : ROLE_OPERATOR);
        return R.ok(data);
    }

    @PostMapping("/bootstrap")
    public R<Void> bootstrap() {
        Long count = accountMapper.selectCount(null);
        if (count > 0) {
            throw new BizException("管理员已存在");
        }
        AdminAccount admin = new AdminAccount();
        admin.setUsername("admin");
        admin.setPasswordHash(DigestUtil.sha256Hex("admin123"));
        admin.setRole(ROLE_SUPER_ADMIN);
        admin.setStatus("enabled");
        admin.setCreatedAt(LocalDateTime.now());
        admin.setUpdatedAt(LocalDateTime.now());
        accountMapper.insert(admin);
        return R.ok();
    }

    @PostMapping("/create")
    public R<Void> create(@RequestHeader("Authorization") String auth,
                           @RequestBody Map<String, String> body) {
        String token = auth.startsWith("Bearer ") ? auth.substring(7) : auth;
        String creator = redisUtil.get(REDIS_ADMIN_SESSION + token);
        if (creator == null) {
            throw new BizException("未登录");
        }
        AdminAccount creatorAccount = accountMapper.selectOne(
                new LambdaQueryWrapper<AdminAccount>()
                        .eq(AdminAccount::getUsername, creator));
        if (creatorAccount == null || !ROLE_SUPER_ADMIN.equals(creatorAccount.getRole())) {
            throw new BizException("无权创建管理员");
        }

        AdminAccount admin = new AdminAccount();
        admin.setUsername(body.get("username"));
        admin.setPasswordHash(DigestUtil.sha256Hex(body.get("password")));
        admin.setRole(body.getOrDefault("role", ROLE_OPERATOR));
        admin.setStatus("enabled");
        admin.setCreatedBy(creator);
        admin.setCreatedAt(LocalDateTime.now());
        admin.setUpdatedAt(LocalDateTime.now());
        accountMapper.insert(admin);
        return R.ok();
    }

    @GetMapping("/list")
    public R<List<AdminAccount>> list() {
        return R.ok(accountMapper.selectList(null));
    }

    @DeleteMapping("/{username}")
    public R<Void> delete(@RequestHeader("Authorization") String auth,
                           @PathVariable String username) {
        String token = auth.startsWith("Bearer ") ? auth.substring(7) : auth;
        String operator = redisUtil.get(REDIS_ADMIN_SESSION + token);
        if (operator == null) {
            throw new BizException("未登录");
        }
        AdminAccount operatorAccount = accountMapper.selectOne(
                new LambdaQueryWrapper<AdminAccount>()
                        .eq(AdminAccount::getUsername, operator));
        if (operatorAccount == null || !ROLE_SUPER_ADMIN.equals(operatorAccount.getRole())) {
            throw new BizException("无权删除管理员");
        }
        accountMapper.delete(
                new LambdaQueryWrapper<AdminAccount>()
                        .eq(AdminAccount::getUsername, username));
        return R.ok();
    }
}
