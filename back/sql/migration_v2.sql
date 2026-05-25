-- ============================================================
-- 迁移脚本 V2：为管理端补充字段
-- 执行方式：mysql -u root -p dingdong_medicine < migration_v2.sql
-- 依赖：先执行 init.sql 建好 20 张基础表
-- ============================================================

USE dingdong_medicine;

-- -----------------------------------------------------------
-- 1. users 补充管理端需要的字段
-- -----------------------------------------------------------
ALTER TABLE `users`
  ADD COLUMN `phone` VARCHAR(20) DEFAULT '' COMMENT '手机号' AFTER `avatar_url`,
  ADD COLUMN `email` VARCHAR(100) DEFAULT '' COMMENT '邮箱' AFTER `phone`,
  ADD COLUMN `status` VARCHAR(10) DEFAULT 'active' COMMENT '账号状态：active/disabled' AFTER `gender`,
  ADD COLUMN `member_level` VARCHAR(20) DEFAULT '普通会员' COMMENT '会员等级：普通会员/银卡会员/金卡会员/钻石会员' AFTER `status`,
  ADD INDEX `idx_status` (`status`),
  ADD INDEX `idx_phone` (`phone`);

-- -----------------------------------------------------------
-- 2. medicine_library 补充药品管理端字段
-- -----------------------------------------------------------
ALTER TABLE `medicine_library`
  ADD COLUMN `manufacturer` VARCHAR(200) DEFAULT '' COMMENT '生产企业' AFTER `contraindications`,
  ADD COLUMN `approval_number` VARCHAR(50) DEFAULT '' COMMENT '批准文号' AFTER `manufacturer`,
  ADD COLUMN `category` VARCHAR(50) DEFAULT '' COMMENT '药品分类：处方药/OTC/保健品/中成药/西药/医疗器械' AFTER `approval_number`,
  ADD COLUMN `price` DECIMAL(10,2) DEFAULT 0.00 COMMENT '参考售价' AFTER `category`,
  ADD COLUMN `stock` INT DEFAULT 0 COMMENT '库存' AFTER `price`,
  ADD COLUMN `status` VARCHAR(10) DEFAULT 'on' COMMENT '上架状态：on/off' AFTER `stock`,
  ADD INDEX `idx_category` (`category`),
  ADD INDEX `idx_status` (`status`),
  ADD INDEX `idx_manufacturer` (`manufacturer`);

-- -----------------------------------------------------------
-- 3. mall_products 补充商品管理端字段
-- -----------------------------------------------------------
ALTER TABLE `mall_products`
  ADD COLUMN `cash_price` DECIMAL(10,2) DEFAULT 0.00 COMMENT '现金售价' AFTER `points_price`,
  ADD COLUMN `original_price` DECIMAL(10,2) DEFAULT 0.00 COMMENT '原价' AFTER `cash_price`,
  ADD COLUMN `sales_count` INT DEFAULT 0 COMMENT '销量' AFTER `stock`,
  ADD COLUMN `rating` DECIMAL(2,1) DEFAULT 5.0 COMMENT '评分' AFTER `sales_count`,
  ADD INDEX `idx_category` (`category`);

-- -----------------------------------------------------------
-- 4. user_feedbacks 补充反馈管理字段
-- -----------------------------------------------------------
ALTER TABLE `user_feedbacks`
  ADD COLUMN `type` VARCHAR(20) DEFAULT '其他' COMMENT '反馈类型：功能建议/BUG反馈/体验优化/咨询求助/投诉建议/其他' AFTER `avatar_url`,
  ADD COLUMN `priority` VARCHAR(10) DEFAULT '中' COMMENT '优先级：低/中/高/紧急' AFTER `type`,
  ADD COLUMN `status` VARCHAR(20) DEFAULT '待处理' COMMENT '处理状态：待处理/处理中/已回复/已关闭' AFTER `priority`,
  ADD COLUMN `images` JSON DEFAULT NULL COMMENT '反馈截图URL数组' AFTER `content`,
  ADD COLUMN `reply` VARCHAR(600) DEFAULT '' COMMENT '管理员回复' AFTER `status`,
  ADD COLUMN `replied_by` VARCHAR(50) DEFAULT '' COMMENT '回复人' AFTER `reply`,
  ADD COLUMN `replied_at` DATETIME DEFAULT NULL COMMENT '回复时间' AFTER `replied_by`,
  ADD INDEX `idx_status` (`status`),
  ADD INDEX `idx_type` (`type`);

-- -----------------------------------------------------------
-- 5. admin_accounts 补充管理端展示字段
-- -----------------------------------------------------------
ALTER TABLE `admin_accounts`
  ADD COLUMN `display_name` VARCHAR(50) DEFAULT '' COMMENT '显示名称' AFTER `username`,
  ADD COLUMN `email` VARCHAR(100) DEFAULT '' COMMENT '邮箱' AFTER `password_hash`,
  ADD COLUMN `phone` VARCHAR(20) DEFAULT '' COMMENT '手机号' AFTER `email`,
  ADD COLUMN `permissions` JSON DEFAULT NULL COMMENT '权限列表' AFTER `role`;

-- -----------------------------------------------------------
-- 6. admin_sessions 补充 IP 记录
-- -----------------------------------------------------------
ALTER TABLE `admin_sessions`
  ADD COLUMN `ip` VARCHAR(50) DEFAULT '' COMMENT '登录IP' AFTER `token`;

-- -----------------------------------------------------------
-- 7. 积分规则配置表（管理端-积分管理-规则配置）
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `points_rules` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `rule_key` VARCHAR(50) NOT NULL COMMENT '规则标识：daily_signin/shopping_ratio/invite/evaluate/share/consecutive_bonus',
  `rule_name` VARCHAR(100) NOT NULL COMMENT '规则名称',
  `points_value` INT DEFAULT 0 COMMENT '积分值',
  `description` VARCHAR(200) DEFAULT '' COMMENT '规则说明',
  `enabled` TINYINT(1) DEFAULT 1 COMMENT '是否启用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_rule_key` (`rule_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分规则配置表';

-- -----------------------------------------------------------
-- 8. 积分全局配置表（管理端-积分管理-参数配置）
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `points_config` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `config_key` VARCHAR(50) NOT NULL COMMENT '配置项',
  `config_value` VARCHAR(100) NOT NULL COMMENT '配置值',
  `description` VARCHAR(200) DEFAULT '' COMMENT '说明',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分全局配置表';

-- -----------------------------------------------------------
-- 9. 操作日志表（可选，管理端审计用）
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin_operation_logs` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL COMMENT '操作人',
  `action` VARCHAR(50) NOT NULL COMMENT '操作类型',
  `target_type` VARCHAR(50) DEFAULT '' COMMENT '操作对象类型',
  `target_id` VARCHAR(100) DEFAULT '' COMMENT '操作对象ID',
  `detail` JSON DEFAULT NULL COMMENT '操作详情',
  `ip` VARCHAR(50) DEFAULT '' COMMENT 'IP地址',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_username` (`username`),
  INDEX `idx_action` (`action`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员操作日志表';

-- ============================================================
-- 初始化数据
-- ============================================================

-- 积分规则
INSERT INTO `points_rules` (`rule_key`, `rule_name`, `points_value`, `description`, `enabled`) VALUES
('daily_signin',     '每日签到',     10,  '用户每日签到获得积分',           1),
('shopping_ratio',   '购物返积分',   1,   '每消费1元获得1积分',            1),
('consecutive_bonus', '连续签到奖励', 50,  '连续签到7天额外奖励',           1),
('invite',           '邀请好友',     100, '成功邀请新用户注册',            1),
('evaluate',         '评价奖励',     20,  '完成订单评价获得积分',          0),
('share',            '分享商品',     5,   '分享商品到社交平台',            1)
ON DUPLICATE KEY UPDATE `points_value` = VALUES(`points_value`);

-- 积分配置
INSERT INTO `points_config` (`config_key`, `config_value`, `description`) VALUES
('validity_days',      '365', '积分有效期（天）'),
('min_exchange',       '100', '最低兑换积分数'),
('signin_points',      '10',  '每日签到积分'),
('consecutive_points', '50',  '连续签到7天额外奖励'),
('shopping_ratio',     '1',   '购物返积分比例(%)'),
('vip_multiplier',     '2',   'VIP积分倍率')
ON DUPLICATE KEY UPDATE `config_value` = VALUES(`config_value`);

-- 管理员默认账号（密码: admin123，BCrypt 哈希）
INSERT INTO `admin_accounts` (`username`, `display_name`, `password_hash`, `email`, `phone`, `role`, `permissions`, `status`) VALUES
('admin', '超级管理员', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', 'admin@dingdong.com', '13800000001', 'super_admin', '["全部权限"]', 'enabled'),
('operator', '运营管理员', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', 'ops@dingdong.com', '13800000002', 'operator', '["商品管理","订单管理","用户管理"]', 'enabled')
ON DUPLICATE KEY UPDATE `display_name` = VALUES(`display_name`);

-- 反馈类型补充（给已有反馈数据补上类型）
UPDATE `user_feedbacks` SET `type` = '其他', `priority` = '中', `status` = '待处理' WHERE `type` = '其他' AND `status` = '待处理';
