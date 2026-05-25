package com.dingdong.medicine.common.constant;

public class AppConstants {
    // 积分规则
    public static final int NEW_USER_POINTS = 1000;
    public static final int TAKE_MEDICINE_POINTS = 1;

    // 服药状态
    public static final String STATUS_NOT_YET = "notYet";
    public static final String STATUS_DUE = "due";
    public static final String STATUS_OVERDUE = "overdue";
    public static final String STATUS_TAKEN = "taken";

    // 提醒重复模式
    public static final String REPEAT_EVERYDAY = "everyday";
    public static final String REPEAT_WEEKDAY = "weekday";
    public static final String REPEAT_CUSTOM = "custom";

    // 家庭关系状态
    public static final String FAMILY_ACCEPTED = "accepted";
    public static final String FAMILY_PENDING = "pending";

    // 待激活药品状态
    public static final String PENDING_STATUS = "pending";
    public static final String ACTIVATED_STATUS = "activated";
    public static final String IGNORED_STATUS = "ignored";

    // 订单状态
    public static final String ORDER_CREATED = "created";
    public static final String ORDER_PAID = "paid";
    public static final String ORDER_PACKING = "packing";
    public static final String ORDER_SHIPPING = "shipping";
    public static final String ORDER_DELIVERED = "delivered";

    // Redis Key前缀
    public static final String REDIS_TOKEN_PREFIX = "auth:token:";
    public static final String REDIS_USER_PROFILE = "user:profile:";
    public static final String REDIS_DASHBOARD = "dashboard:";
    public static final String REDIS_MISSED_STATS = "missed-stats:";
    public static final String REDIS_LOW_STOCK = "low-stock:";
    public static final String REDIS_MEDICINE_LIBRARY_LIST = "medicine-library:list:";
    public static final String REDIS_MEDICINE_LIBRARY_SEARCH = "medicine-library:search:";
    public static final String REDIS_MALL_PRODUCTS = "mall:products";
    public static final String REDIS_POINTS_BALANCE = "points:balance:";
    public static final String REDIS_RATE_RECOGNIZE = "rate:recognize:";
    public static final String REDIS_RATE_AI_CHAT = "rate:ai-chat:";
    public static final String REDIS_ADMIN_SESSION = "admin:session:";
    public static final String REDIS_PHARMACY_CACHE = "pharmacy:cache:";

    // 用法枚举
    public static final String USAGE_ORAL = "oral";
    public static final String USAGE_TOPICAL = "topical";
    public static final String USAGE_EYE = "eye";
    public static final String USAGE_NOSE = "nose";
    public static final String USAGE_INHALATION = "inhalation";
    public static final String USAGE_INJECTION = "injection";
    public static final String USAGE_OTHER = "other";

    // 餐时枚举
    public static final String MEAL_NONE = "none";
    public static final String MEAL_BEFORE = "before";
    public static final String MEAL_AFTER = "after";
    public static final String MEAL_EMPTY = "empty";

    // 时段枚举
    public static final String SLOT_MORNING = "morning";
    public static final String SLOT_NOON = "noon";
    public static final String SLOT_EVENING = "evening";

    // 管理员角色
    public static final String ROLE_SUPER_ADMIN = "super_admin";
    public static final String ROLE_OPERATOR = "operator";
}
