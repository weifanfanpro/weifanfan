-- 叮咚吃药数据库初始化脚本
CREATE DATABASE IF NOT EXISTS dingdong_medicine DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dingdong_medicine;

-- 1. 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL COMMENT '微信openid',
  `nick_name` VARCHAR(100) DEFAULT '' COMMENT '昵称',
  `avatar_url` VARCHAR(500) DEFAULT '' COMMENT '头像URL（MinIO）',
  `gender` TINYINT DEFAULT 0 COMMENT '性别：0未知 1男 2女',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='微信用户表';

-- 2. 扫描药品记录表
CREATE TABLE IF NOT EXISTS `medicines` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL COMMENT '药品名称',
  `indication` TEXT COMMENT '适应症/功效',
  `dosage_summary` VARCHAR(500) DEFAULT '' COMMENT '用量概要',
  `is_quantifiable` TINYINT(1) DEFAULT 0 COMMENT '是否可计量',
  `dose_text` VARCHAR(200) DEFAULT '' COMMENT '每次用量文本',
  `total_amount_text` VARCHAR(200) DEFAULT NULL COMMENT '总量文本',
  `usage_method` VARCHAR(20) DEFAULT 'other' COMMENT '用法：oral/topical/eye/nose/inhalation/injection/other',
  `daily_frequency` INT DEFAULT NULL COMMENT '建议每日频次',
  `meal_timing` VARCHAR(10) DEFAULT 'none' COMMENT '餐前/餐后/空腹/无',
  `suggested_slots` JSON DEFAULT NULL COMMENT '建议时段',
  `warnings` JSON DEFAULT NULL COMMENT '注意事项数组',
  `contraindications` TEXT COMMENT '禁忌',
  `last_scan_at` DATETIME DEFAULT NULL COMMENT '最后扫描时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='扫描药品记录表';

-- 3. 用户药品列表
CREATE TABLE IF NOT EXISTS `user_medicines` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `owner_openid` VARCHAR(64) NOT NULL COMMENT '药品归属用户',
  `actor_openid` VARCHAR(64) NOT NULL COMMENT '添加者',
  `medicine_id` BIGINT DEFAULT NULL COMMENT '关联medicines表',
  `name` VARCHAR(200) NOT NULL COMMENT '药品名称',
  `rule` VARCHAR(500) DEFAULT '请根据医生建议设置详细用药规则' COMMENT '用药规则摘要',
  `is_quantifiable` TINYINT(1) DEFAULT 0 COMMENT '是否可计量',
  `dose_text` VARCHAR(200) DEFAULT '' COMMENT '用量文本',
  `total_amount_text` VARCHAR(200) DEFAULT NULL COMMENT '剩余总量',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_owner` (`owner_openid`),
  INDEX `idx_owner_medicine` (`owner_openid`, `name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户药品列表';

-- 4. 提醒计划表
CREATE TABLE IF NOT EXISTS `reminders` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `owner_openid` VARCHAR(64) NOT NULL COMMENT '提醒归属用户',
  `actor_openid` VARCHAR(64) NOT NULL COMMENT '创建者',
  `user_medicine_id` BIGINT NOT NULL COMMENT '关联user_medicines',
  `medicine_name` VARCHAR(200) DEFAULT '' COMMENT '药品名称快照',
  `time` VARCHAR(5) NOT NULL COMMENT '提醒时间 HH:mm',
  `start_date` VARCHAR(10) DEFAULT NULL COMMENT '生效起始日 YYYY-MM-DD',
  `dose_value` VARCHAR(20) DEFAULT '1' COMMENT '剂量数值',
  `dose_unit` VARCHAR(20) DEFAULT '次' COMMENT '剂量单位',
  `dose_text` VARCHAR(200) DEFAULT '' COMMENT '完整剂量描述',
  `repeat_mode` VARCHAR(20) DEFAULT 'everyday' COMMENT '重复模式：everyday/weekday/custom',
  `custom_weekdays` JSON DEFAULT NULL COMMENT '自定义星期',
  `notify_wechat` TINYINT(1) DEFAULT 1 COMMENT '微信通知',
  `notify_ring` TINYINT(1) DEFAULT 0 COMMENT '铃声',
  `notify_vibrate` TINYINT(1) DEFAULT 1 COMMENT '震动',
  `daily_frequency` INT DEFAULT 1 COMMENT '日频次',
  `meal_timing` VARCHAR(10) DEFAULT 'none' COMMENT '餐前/餐后',
  `plan_id` VARCHAR(100) DEFAULT '' COMMENT '计划组ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_owner` (`owner_openid`),
  INDEX `idx_user_medicine` (`user_medicine_id`),
  INDEX `idx_plan_id` (`plan_id`),
  INDEX `idx_owner_date` (`owner_openid`, `start_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提醒计划表';

-- 5. 服药记录表
CREATE TABLE IF NOT EXISTS `reminder_logs` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `reminder_id` BIGINT NOT NULL COMMENT '关联reminders',
  `date` VARCHAR(10) NOT NULL COMMENT '日期 YYYY-MM-DD',
  `owner_openid` VARCHAR(64) NOT NULL COMMENT '服药人',
  `actor_openid` VARCHAR(64) NOT NULL COMMENT '记录操作人',
  `taken_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '服药时间',
  UNIQUE KEY `uk_reminder_date_owner` (`reminder_id`, `date`, `owner_openid`),
  INDEX `idx_owner_date` (`owner_openid`, `date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='服药记录表';

-- 6. 推送去重表
CREATE TABLE IF NOT EXISTS `reminder_push_logs` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `push_key` VARCHAR(200) NOT NULL COMMENT '去重键',
  `reminder_id` BIGINT NOT NULL COMMENT '关联reminders',
  `date` VARCHAR(10) NOT NULL COMMENT '日期',
  `owner_openid` VARCHAR(64) NOT NULL COMMENT '用户',
  `time` VARCHAR(5) DEFAULT '' COMMENT '提醒时间',
  `medicine_name` VARCHAR(200) DEFAULT '' COMMENT '药品名称',
  `sent_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
  UNIQUE KEY `uk_push_key` (`push_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='推送去重表';

-- 7. 家庭绑定关系表
CREATE TABLE IF NOT EXISTS `family_relations` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `owner_openid` VARCHAR(64) NOT NULL COMMENT '被照护者',
  `member_openid` VARCHAR(64) NOT NULL COMMENT '照护者/成员',
  `status` VARCHAR(20) DEFAULT 'accepted' COMMENT '状态：accepted/pending',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_owner_member` (`owner_openid`, `member_openid`),
  INDEX `idx_member` (`member_openid`),
  INDEX `idx_owner` (`owner_openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='家庭绑定关系表';

-- 8. 家庭待激活药品表
CREATE TABLE IF NOT EXISTS `family_pending_medicines` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `owner_openid` VARCHAR(64) NOT NULL COMMENT '目标用户',
  `actor_openid` VARCHAR(64) NOT NULL COMMENT '提交者',
  `name` VARCHAR(200) NOT NULL COMMENT '药品名称',
  `rule` VARCHAR(500) DEFAULT '' COMMENT '用药规则',
  `is_quantifiable` TINYINT(1) DEFAULT 0 COMMENT '是否可计量',
  `dose_text` VARCHAR(200) DEFAULT '' COMMENT '用量',
  `total_amount_text` VARCHAR(200) DEFAULT NULL COMMENT '总量',
  `draft_plan` JSON DEFAULT NULL COMMENT '草稿提醒计划',
  `status` VARCHAR(20) DEFAULT 'pending' COMMENT 'pending/activated/ignored',
  `activated_at` DATETIME DEFAULT NULL COMMENT '激活时间',
  `ignored_at` DATETIME DEFAULT NULL COMMENT '忽略时间',
  `activated_by` VARCHAR(64) DEFAULT NULL COMMENT '激活操作人',
  `user_medicine_id` BIGINT DEFAULT NULL COMMENT '激活后创建的user_medicine ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_owner` (`owner_openid`),
  INDEX `idx_actor` (`actor_openid`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='家庭待激活药品表';

-- 9. 周漏服统计快照表
CREATE TABLE IF NOT EXISTS `weekly_missed_stats` (
  `id` VARCHAR(100) NOT NULL COMMENT '格式：openid_weekStart',
  `owner_openid` VARCHAR(64) NOT NULL COMMENT '用户',
  `week_start` VARCHAR(10) NOT NULL COMMENT '周一日期',
  `week_end` VARCHAR(10) NOT NULL COMMENT '周日日期',
  `stats_total` INT DEFAULT 0 COMMENT '总提醒数',
  `stats_ok` INT DEFAULT 0 COMMENT '按时服药数',
  `stats_missed` INT DEFAULT 0 COMMENT '漏服数',
  `stats_rate` INT DEFAULT 0 COMMENT '按时率(百分比)',
  `weekly_data` JSON DEFAULT NULL COMMENT '每日详细数据',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_owner_week` (`owner_openid`, `week_start`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='周漏服统计快照表';

-- 10. 全局药品库
CREATE TABLE IF NOT EXISTS `medicine_library` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL COMMENT '药品名称',
  `indication` TEXT COMMENT '适应症',
  `dosage_summary` VARCHAR(500) DEFAULT '' COMMENT '用量概要',
  `rule_hint` VARCHAR(500) DEFAULT '' COMMENT '用药提示',
  `usage_method` VARCHAR(20) DEFAULT 'other' COMMENT '用法',
  `meal_timing` VARCHAR(10) DEFAULT 'none' COMMENT '餐前/餐后',
  `daily_frequency` INT DEFAULT NULL COMMENT '建议频次',
  `warnings` JSON DEFAULT NULL COMMENT '注意事项',
  `contraindications` TEXT COMMENT '禁忌',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_name` (`name`),
  FULLTEXT INDEX `ft_search` (`name`, `indication`, `dosage_summary`, `rule_hint`, `contraindications`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='全局药品库';

-- 11. AI对话会话表
CREATE TABLE IF NOT EXISTS `ai_chat_sessions` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `openid` VARCHAR(64) NOT NULL COMMENT '用户',
  `title` VARCHAR(100) DEFAULT '新对话' COMMENT '会话标题',
  `messages` JSON DEFAULT NULL COMMENT '消息数组',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_openid` (`openid`),
  INDEX `idx_updated` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI对话会话表';

-- 12. 积分钱包表
CREATE TABLE IF NOT EXISTS `user_points_wallet` (
  `openid` VARCHAR(64) NOT NULL COMMENT '用户',
  `points_balance` INT DEFAULT 1000 COMMENT '积分余额',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分钱包表';

-- 13. 积分流水表
CREATE TABLE IF NOT EXISTS `user_points_logs` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `openid` VARCHAR(64) NOT NULL COMMENT '用户',
  `type` VARCHAR(10) NOT NULL COMMENT 'earn/spend',
  `delta` INT NOT NULL COMMENT '变动数',
  `source` VARCHAR(50) NOT NULL COMMENT '来源',
  `ref_id` VARCHAR(100) DEFAULT '' COMMENT '关联ID',
  `reason` VARCHAR(200) DEFAULT '' COMMENT '调整原因',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_openid` (`openid`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分流水表';

-- 14. 商城商品表
CREATE TABLE IF NOT EXISTS `mall_products` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `product_id` VARCHAR(20) NOT NULL COMMENT '商品编号',
  `name` VARCHAR(200) NOT NULL COMMENT '商品名称',
  `description` TEXT COMMENT '商品描述',
  `cover_url` VARCHAR(500) DEFAULT '' COMMENT '封面图',
  `points_price` INT DEFAULT 0 COMMENT '积分价格',
  `stock` INT DEFAULT 0 COMMENT '库存',
  `category` VARCHAR(50) DEFAULT '' COMMENT '分类',
  `status` VARCHAR(10) DEFAULT 'on' COMMENT 'on/off',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_product_id` (`product_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商城商品表';

-- 15. 商城订单表
CREATE TABLE IF NOT EXISTS `mall_orders` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `order_id` VARCHAR(50) NOT NULL COMMENT '订单号',
  `openid` VARCHAR(64) NOT NULL COMMENT '下单用户',
  `status` VARCHAR(20) DEFAULT 'created' COMMENT '订单状态',
  `points_cost` INT DEFAULT 0 COMMENT '消耗积分',
  `points_balance_after` INT DEFAULT 0 COMMENT '下单后积分余额',
  `address_snapshot` JSON DEFAULT NULL COMMENT '收货地址快照',
  `status_timeline` JSON DEFAULT NULL COMMENT '状态变更历史',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_order_id` (`order_id`),
  INDEX `idx_openid` (`openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商城订单表';

-- 16. 订单商品明细表
CREATE TABLE IF NOT EXISTS `mall_order_items` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `order_id` VARCHAR(50) NOT NULL COMMENT '订单号',
  `product_id` VARCHAR(20) NOT NULL COMMENT '商品编号',
  `product_name` VARCHAR(200) DEFAULT '' COMMENT '商品名称',
  `cover_url` VARCHAR(500) DEFAULT '' COMMENT '封面图',
  `points_price` INT DEFAULT 0 COMMENT '积分价格',
  `quantity` INT DEFAULT 1 COMMENT '数量',
  INDEX `idx_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单商品明细表';

-- 17. 收货地址表
CREATE TABLE IF NOT EXISTS `user_shipping_addresses` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `address_id` VARCHAR(50) NOT NULL COMMENT '地址编号',
  `openid` VARCHAR(64) NOT NULL COMMENT '用户',
  `receiver` VARCHAR(50) NOT NULL COMMENT '收件人',
  `phone` VARCHAR(20) NOT NULL COMMENT '手机号',
  `region` VARCHAR(100) NOT NULL COMMENT '省市区',
  `detail` VARCHAR(200) NOT NULL COMMENT '详细地址',
  `tag` VARCHAR(20) DEFAULT '' COMMENT '标签',
  `is_default` TINYINT(1) DEFAULT 0 COMMENT '是否默认',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_address_id` (`address_id`),
  INDEX `idx_openid` (`openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收货地址表';

-- 18. 管理员账号表
CREATE TABLE IF NOT EXISTS `admin_accounts` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `password_hash` VARCHAR(128) NOT NULL COMMENT '密码哈希',
  `role` VARCHAR(20) DEFAULT 'operator' COMMENT 'super_admin/operator',
  `status` VARCHAR(10) DEFAULT 'enabled' COMMENT 'enabled/disabled',
  `created_by` VARCHAR(50) DEFAULT '' COMMENT '创建者',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login_at` DATETIME DEFAULT NULL,
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员账号表';

-- 19. 管理员会话表
CREATE TABLE IF NOT EXISTS `admin_sessions` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL COMMENT '管理员',
  `token` VARCHAR(64) NOT NULL COMMENT '会话Token',
  `expires_at` BIGINT NOT NULL COMMENT '过期时间戳(ms)',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_token` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员会话表';

-- 20. 用户反馈表
CREATE TABLE IF NOT EXISTS `user_feedbacks` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `openid` VARCHAR(64) NOT NULL COMMENT '用户',
  `nick_name` VARCHAR(100) DEFAULT '' COMMENT '昵称',
  `avatar_url` VARCHAR(500) DEFAULT '' COMMENT '头像',
  `content` VARCHAR(600) NOT NULL COMMENT '反馈内容',
  `date` VARCHAR(10) NOT NULL COMMENT '日期',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_openid` (`openid`),
  INDEX `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户反馈表';

-- 插入示例商品数据
INSERT INTO `mall_products` (`product_id`, `name`, `description`, `cover_url`, `points_price`, `stock`, `category`) VALUES
('p001', '医用口罩（50只装）', '三层防护，透气舒适', '', 500, 100, '健康防护'),
('p002', '电子体温计', '高精度快速测温', '', 800, 50, '健康器械'),
('p003', '维生素C泡腾片', '补充维C，增强免疫力', '', 300, 200, '保健品'),
('p004', '便携药盒', '七格分装，方便携带', '', 200, 150, '生活用品'),
('p005', '血压测量仪', '家用臂式血压计', '', 1500, 30, '健康器械');
