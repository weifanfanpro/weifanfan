package com.dingdong.medicine.config;

import com.dingdong.medicine.common.util.JwtUtil;
import com.dingdong.medicine.common.util.RedisUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import static com.dingdong.medicine.common.constant.AppConstants.REDIS_TOKEN_PREFIX;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtInterceptor implements HandlerInterceptor {

    private final JwtUtil jwtUtil;
    private final RedisUtil redisUtil;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.setStatus(401);
            return false;
        }

        String token = authHeader.substring(7);
        try {
            if (jwtUtil.isTokenExpired(token)) {
                response.setStatus(401);
                return false;
            }

            String openid = jwtUtil.getOpenidFromToken(token);
            String cachedToken = redisUtil.get(REDIS_TOKEN_PREFIX + openid);
            if (cachedToken == null || !cachedToken.equals(token)) {
                response.setStatus(401);
                return false;
            }

            request.setAttribute("openid", openid);
            return true;
        } catch (Exception e) {
            log.warn("JWT校验失败: {}", e.getMessage());
            response.setStatus(401);
            return false;
        }
    }
}
