# API 接口文档：云开发 -> Spring Boot 迁移映射

> 本文档是小程序前端与 Spring Boot 后端之间的接口映射唯一参考。
> 后端所有接口统一返回格式：`{ code: 0, message: "ok", data: T }`（`R<T>` 包装）
> 认证方式：`Authorization: Bearer <token>`（JWT），openid 由拦截器注入 `request.getAttribute("openid")`

---

## 一、认证模块

### 1.1 微信登录

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `login` | `POST /api/auth/wx-login` |
| 参数 | 无（openid 由 `cloud.getWXContext()` 获取） | `{ code: string, nickName?: string, avatarUrl?: string }` |
| 返回 | `{ openid, appid, unionid, user: {_id, nickName, avatarUrl, gender, ...} }` | `{ token, expiresIn, user: { id, nickName, avatarUrl, gender } }` |
| 说明 | 自动创建用户记录 | 后端调用 `jscode2session` 换取 openid，首次登录自动创建用户+积分钱包 |

**前端改造要点**：
- `app.ts` 中 `wx.cloud.callFunction({name: "login"})` 替换为 `wx.login()` 获取 code，再 `POST /api/auth/wx-login`
- 存储 `token`、`openid`（从 `data.user.id` 获取）、用户信息
- `onShow` 中的 openid 变更检测改为比较本地存储的 token 是否有效

### 1.2 更新用户资料

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `updateUserProfile` | `PUT /api/user/profile` |
| 参数 | `{ nickName, avatarUrl, gender? }` | `{ nickName?, avatarUrl?, gender? }` |
| 返回 | `{ code:0, data:{ openid, nickName, avatarUrl, gender }, user:{...} }` | `{ code:0, message:"ok", data: null }` |

### 1.3 上传头像

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 操作 | `wx.cloud.uploadFile({ cloudPath, filePath })` | `POST /api/user/avatar` (multipart) |
| 参数 | cloud 文件路径 | `file: MultipartFile` |
| 返回 | `{ fileID }` (云存储 ID) | `{ url: "https://minio..." }` (MinIO 公开URL) |

**前端改造要点**：
- 用 `wx.uploadFile` 替代 `wx.cloud.uploadFile`，header 中注入 Authorization
- 返回的 `url` 直接作为 `avatarUrl` 使用

### 1.4 刷新 Token

| 项目 | Spring Boot（新增） |
|------|---------------------|
| 接口 | `POST /api/auth/refresh` |
| 返回 | `{ token, expiresIn: 604800 }` |

### 1.5 获取当前用户

| 项目 | Spring Boot（新增） |
|------|---------------------|
| 接口 | `GET /api/auth/me` |
| 返回 | `User` 对象 |

---

## 二、药品识别模块

### 2.1 识别药品

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `recognizeMedicine` | `POST /api/medicine/recognize` (multipart) |
| 参数 | `{ fileID }` (云存储 ID) | `file: MultipartFile` |
| 返回 | `{ code:0, data:{ medicineId, name, indication, dosage, isQuantifiable, doseText, totalAmountText, usageMethod, dailyFrequency, mealTiming, suggestedSlots, warnings, contraindications } }` | `{ code:0, data: Medicine }` (字段名相同，`id` 为 Long 类型) |

**前端改造要点**：
- 原来：先 `wx.cloud.uploadFile` 上传图片，再调用 `recognizeMedicine` 云函数传 fileID
- 现在：直接 `wx.uploadFile` 到 `/api/medicine/recognize`，一步完成
- 返回的 `medicineId` (string) 改为 `id` (number)

### 2.2 按 ID 查药品

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 操作 | `db.collection("medicines").doc(id).get()` | `GET /api/medicine/{id}` |
| 返回 | `{ _id, name, indication, ... }` | `Medicine` 对象（`id` 为 Long） |

### 2.3 按名称查药品（需新增）

| 项目 | Spring Boot |
|------|-------------|
| 接口 | `GET /api/medicine/by-name?name=xxx`（需新增） |
| 返回 | `Medicine` 或 null |

**原云开发操作**：`db.collection("medicines").where({ name }).limit(1).get()`

---

## 三、用户药品管理模块

### 3.1 添加药品到药单

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `addMedicineToList` | `POST /api/user-medicine` |
| 参数 | `{ medicineId?, name, rule?, targetOpenid?, isQuantifiable?, doseText?, totalAmountText? }` | `{ medicineId?, name, isQuantifiable?, doseText?, totalAmountText?, rule? }` |
| 返回 | `{ code:0, duplicated:false, userMedicineId, data:{ ownerOpenid, actorOpenid } }` | `{ code:0, data: UserMedicine }` |
| 返回(重复) | `{ code:0, duplicated:true, userMedicineId }` | 需后端处理去重，返回已有记录 |

**前端改造要点**：
- `targetOpenid` 参数不再需要（后端从 token 获取 openid）
- 去重逻辑需后端实现（检查 `owner_openid + medicine_id` 或 `owner_openid + name`）

### 3.2 获取药品列表

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `familyData({ action: "getMedicineList", targetOpenid })` | `GET /api/user-medicine/list?targetOpenid=xxx` |
| 返回 | `{ code:0, data:{ list: [{ _id, name, rule, doseText, isQuantifiable, totalAmountText, medicineId, active }] } }` | `{ code:0, data: [UserMedicine] }`（直接返回数组，非 `{list:[]}` 包装） |

**前端改造要点**：
- 云函数返回 `{ data: { list: [...] } }`，后端返回 `{ data: [...] }`
- 字段 `_id` 改为 `id`

### 3.3 获取单个用户药品

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 操作 | `db.collection("user_medicines").doc(id).get()` | `GET /api/user-medicine/{id}` |
| 返回 | `{ _id, name, rule, ... }` | `UserMedicine` 对象 |

### 3.4 更新用户药品（需新增）

| 项目 | Spring Boot |
|------|-------------|
| 接口 | `PUT /api/user-medicine/{id}`（需新增） |
| 参数 | `{ isQuantifiable?, doseText?, totalAmountText?, usageMethodText? }` |
| 返回 | `{ code:0, data: null }` |

**原云开发操作**：`db.collection("user_medicines").doc(id).update({...})`

### 3.5 删除用户药品

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `deleteUserMedicine` | `DELETE /api/user-medicine/{id}` |
| 参数 | `{ userMedicineId, targetOpenid? }` | 路径参数 `{id}` |
| 返回 | `{ code:0, data:{ removedUserMedicine, deletedReminders, deletedLogs, deletedPushLogs } }` | `{ code:0, data: null }` |

---

## 四、提醒模块

### 4.1 创建提醒计划

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `createReminderPlan` | `POST /api/reminder/plan` |
| 参数 | `{ userMedicineId, medicineId?, medicineName?, targetOpenid?, dailyFrequency, perDoseAmount?, perDoseUnit?, doseText?, times:[], repeatMode?, customWeekdays?, notify?, mealTiming? }` | `{ userMedicineId, frequency, times:[], doseValue?, doseUnit?, doseText?, repeatMode?, customWeekdays?:[], mealTiming? }` |
| 返回 | `{ code:0, data:{ planId, reminderIds:[...], count } }` | `{ code:0, data: [Reminder] }` |

**前端改造要点**：
- 参数名映射：`dailyFrequency` -> `frequency`，`perDoseAmount` -> `doseValue`，`perDoseUnit` -> `doseUnit`
- `notify` 参数后端暂不支持（云开发的微信订阅消息推送需在后端定时任务中实现）
- `medicineId`、`medicineName`、`targetOpenid` 后端不需要（从 token 和关联表获取）

### 4.2 获取提醒列表

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 操作 | `db.collection("reminders").where({ userMedicineId }).get()` | `GET /api/reminder/drug-detail-rule?userMedicineId=xxx` |
| 返回 | `[{ _id, time, repeatMode, customWeekdays, ... }]` | `{ code:0, data: [Reminder] }` |

### 4.3 获取全部提醒

| 项目 | Spring Boot |
|------|-------------|
| 接口 | `GET /api/reminder/list?targetOpenid=xxx` |
| 返回 | `{ code:0, data: [Reminder] }` |

### 4.4 删除提醒

| 项目 | Spring Boot |
|------|-------------|
| 接口 | `DELETE /api/reminder/{id}` |
| 返回 | `{ code:0, data: null }` |

### 4.5 服药打卡

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `takeMedicine` | `POST /api/reminder/take` |
| 参数 | `{ reminderId, date, targetOpenid? }` | `{ reminderId, date }` |
| 返回(成功) | `{ code:0, duplicated:false, totalAmountText, pointsDelta, pointsBalance, pointsReason, pointsReasonText }` | `{ code:0, data: { duplicated, totalAmountText, pointsDelta, pointsBalance, pointsReason, pointsReasonText } }` |
| 返回(重复) | `{ code:0, duplicated:true, ... }` | 同上，`duplicated: true` |
| 返回(无权限) | `{ code:403, message:"当前不是本人，不能代替服用" }` | 后端通过 `ensureAccepted` 检查 |

**前端改造要点**：
- `targetOpenid` 参数后端不需要（通过 family 关系表验证权限）
- 返回结构从顶层字段变为 `data` 内嵌套

---

## 五、仪表盘模块

### 5.1 获取首页仪表盘

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `familyData({ action: "getDashboard", targetOpenid })` | `GET /api/dashboard?targetOpenid=xxx` |
| 返回 | `{ code:0, data:{ reminders:[{...}], logs:[{...}], todayStr } }` | `{ code:0, data: DashboardResponse }` |

**DashboardResponse 结构**：
```
{
  reminders: [{ id, medicineName, time, doseText, status, mealTiming }],
  logs: [{ reminderId, date, takenAt }],
  totalReminders: number,
  takenCount: number,
  overdueCount: number
}
```

**前端改造要点**：
- 云函数返回的 `reminders` 每项包含 `_id`，后端返回 `id`
- 后端额外提供 `totalReminders`、`takenCount`、`overdueCount` 统计字段

### 5.2 获取漏服统计

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `familyData({ action: "getMissedStats", targetOpenid })` | `GET /api/dashboard/missed-stats?targetOpenid=xxx` |
| 返回 | `{ code:0, data:{ stats:{ total, ok, missed, rate }, weekly:[{ day, date, desc, missed, isToday, isFuture }], riskScore, streakMissedDays, highRiskSlots, suggestions, weeklyBrief, lastWeek } }` | `{ code:0, data: MissedStatsResponse }` |

**MissedStatsResponse 结构**：
```
{
  riskScore: number,
  totalReminders: number,
  takenCount: number,
  missedCount: number,
  onTimeRate: number,
  dailyStats: [{ date, total, taken, missed }]
}
```

**前端改造要点**：
- 云函数返回的字段名与后端不同，需要前端适配映射
- 云函数有 `weekly`、`streakMissedDays`、`highRiskSlots`、`suggestions`、`weeklyBrief`、`lastWeek` 字段，后端需确认是否已实现

### 5.3 获取低库存摘要（需新增）

| 项目 | Spring Boot |
|------|-------------|
| 接口 | `GET /api/dashboard/low-stock-summary?targetOpenid=xxx`（需新增） |
| 返回 | `{ code:0, data: { count: number, top: [{ userMedicineId, name, daysLeft }] } }` |

**原云开发**：`familyData({ action: "getLowStockSummary", targetOpenid })` 返回 `{ thresholdDays:3, count, top:[...] }`

### 5.4 获取服药历史

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `familyData({ action: "getHistory", targetOpenid })` | `GET /api/dashboard/history?targetOpenid=xxx&days=xxx` |
| 返回 | `{ code:0, data:{ list:[{ id, name, time, status:"ok" }] } }` | `{ code:0, data: [{...}] }`（直接返回数组） |

### 5.5 获取周统计列表

| 项目 | Spring Boot |
|------|-------------|
| 接口 | `GET /api/dashboard/weekly-stats` |
| 返回 | `{ code:0, data: [WeeklyMissedStat] }` |

### 5.6 获取周统计详情

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `familyData({ action: "getWeeklyMissedStatsDetail", snapshotId })` | `GET /api/dashboard/weekly-stats/{id}` |
| 返回 | `{ code:0, data:{ id, ownerOpenid, weekStart, weekEnd, stats, weekly:[...], createdAtText } }` | `{ code:0, data: WeeklyMissedStat }` |

---

## 六、家庭模块

### 6.1 绑定家庭关系

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `familyData({ action: "bindAccept", ownerOpenid?/memberOpenid? })` | `POST /api/family/bind` |
| 参数 | `{ ownerOpenid }` 或 `{ memberOpenid }`（传哪个就表示对方角色） | `{ targetOpenid }` |
| 返回 | `{ code:0, data:{ relationId } }` | `{ code:0, data: null }` |

**前端改造要点**：
- 云函数通过传 `ownerOpenid` 或 `memberOpenid` 来决定绑定方向
- 后端统一用 `targetOpenid`，后端自行判断绑定方向

### 6.2 获取家庭关系列表

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `familyData({ action: "listRelations" })` | `GET /api/family/relations` |
| 返回 | `{ code:0, data:{ asMember:[{ id, ownerOpenid, owner }], asOwner:[{ id, memberOpenid, member }] } }` | `{ code:0, data: [FamilyRelationVO] }` |

**FamilyRelationVO 结构**：`{ id, ownerOpenid, memberOpenid, status, nickName, avatarUrl }`

**前端改造要点**：
- 云函数返回 `asMember` 和 `asOwner` 两个分组，后端返回扁平列表
- 前端需自行根据 `ownerOpenid === currentOpenid` 分组

### 6.3 解除绑定

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `familyData({ action: "unbind", relationId })` | `DELETE /api/family/unbind/{relationId}` |
| 返回 | `{ code:0 }` | `{ code:0, data: null }` |

### 6.4 创建待处理药品（家人代添加）

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `familyData({ action: "createPending", targetOpenid, payload: { name, medicineId?, rule?, isQuantifiable?, doseText?, totalAmountText?, draftPlan? } })` | `POST /api/family/pending` |
| 参数 | `payload.draftPlan` 为完整计划对象 | `{ ownerOpenid, name, isQuantifiable?, doseText?, totalAmountText?, rule?, draftPlan?: { frequency, times, doseValue, doseUnit, doseText, repeatMode, customWeekdays, mealTiming } }` |
| 返回 | `{ code:0, data:{ pendingId, ownerOpenid } }` | `{ code:0, data: null }` |

**前端改造要点**：
- `targetOpenid` 改为 `ownerOpenid`
- `payload` 内的字段提升到顶层

### 6.5 获取收件箱（待处理列表）

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `familyData({ action: "listPending" })` | `GET /api/family/pending/inbox` |
| 返回 | `{ code:0, data:{ list:[...], byStatus:{ pending:[], activated:[], ignored:[] } } }` | `{ code:0, data: [FamilyPendingMedicine] }` |

### 6.6 获取已发送列表

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `familyData({ action: "listSentPending" })` | `GET /api/family/pending/sent` |
| 返回 | `{ code:0, data:{ list:[...] } }` | `{ code:0, data: [FamilyPendingMedicine] }` |

### 6.7 激活待处理药品

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `familyData({ action: "activatePending", pendingId })` | `POST /api/family/pending/{id}/activate` |
| 返回 | `{ code:0, data:{ userMedicineId } }` | `{ code:0, data: null }` |

### 6.8 忽略待处理药品

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `familyData({ action: "ignorePending", pendingId })` | `POST /api/family/pending/{id}/ignore` |
| 返回 | `{ code:0 }` | `{ code:0, data: null }` |

---

## 七、AI 聊天模块

### 7.1 获取会话列表

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `deepseekChat({ action: "listSessions" })` | `GET /api/ai-chat/sessions` |
| 返回 | `{ ok:true, list:[{ sessionId, title, updatedAt }] }` | `{ code:0, data: [AiChatSession] }` |

**前端改造要点**：
- 云函数返回 `{ ok:true, list:[] }`，后端返回 `{ code:0, data:[] }`
- 检查方式从 `r.ok` 改为 `r.code === 0`

### 7.2 获取会话详情

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `deepseekChat({ action: "getSession", sessionId })` | `GET /api/ai-chat/sessions/{sessionId}` |
| 返回 | `{ ok:true, session:{ sessionId, title, messages:[...] } }` | `{ code:0, data: AiChatSession }` |

### 7.3 删除会话

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `deepseekChat({ action: "deleteSession", sessionId })` | `DELETE /api/ai-chat/sessions/{sessionId}` |
| 返回 | `{ ok:true }` | `{ code:0, data: null }` |

### 7.4 发送消息（AI 对话）

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `deepseekChat({ action: "chat", userContent, sessionId?, userDisplayContent?, consultAttach?, enableThinking?, enableSearch? })` | `POST /api/ai-chat/send` |
| 参数 | 见右侧 | `{ sessionId?, message, deepThinking?, webSearch?, consultMedicineId? }` |
| 返回 | `{ ok:true, sessionId, message:{ role:"assistant", content, reasoning? }, usage }` | `{ code:0, data: AiChatResponse }` |

**AiChatResponse 结构**：`{ sessionId, title, content, reasoning?, deepThinking? }`

**前端改造要点**：
- `userContent` 改为 `message`
- `enableThinking` 改为 `deepThinking`
- `enableSearch` 改为 `webSearch`
- `consultAttach` 改为 `consultMedicineId`（后端自行拼接药品信息）
- `userDisplayContent` 后端不需要（前端自行处理显示内容）
- 返回从 `{ ok:true, message:{ content } }` 改为 `{ code:0, data:{ content } }`

### 7.5 AI 检查提醒计划

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `deepseekChat({ action: "checkReminderPlan", plan:{ drugName, usageMethodLabel, dailyFrequency, times, doseText, mealTimingLabel, repeatWeekdaysText }, enableThinking?, enableSearch? })` | `POST /api/ai-chat/check-reminder?reminderId=xxx` |
| 参数 | `plan` 对象（完整计划信息） | `reminderId`（后端自行查询计划详情） |
| 返回 | `{ ok:true, message:{ content, reasoning }, suggestion:{ reasonable, summary, suggestedDailyFrequency, suggestedTimes, suggestedDoseText, suggestedMealTiming, notes }, usage }` | `{ code:0, data: AiChatResponse }` |

**前端改造要点**：
- 不再需要前端拼装 `plan` 对象，只需传 `reminderId`
- `suggestion` 字段需后端在 `AiChatResponse` 中增加（当前缺失）
- 后端需解析 AI 返回的 JSON 提取结构化建议

---

## 八、积分模块

### 8.1 获取积分钱包

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `familyData({ action: "getPointsWallet" })` | `GET /api/points/wallet` |
| 返回 | `{ code:0, data:{ pointsBalance } }` | `{ code:0, data: UserPointsWallet }` |

### 8.2 获取积分记录

| 项目 | Spring Boot |
|------|-------------|
| 接口 | `GET /api/points/logs` |
| 返回 | `{ code:0, data: [UserPointsLog] }` |

---

## 九、商城模块

### 9.1 获取商品列表

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `familyData({ action: "getMallProducts" })` | `GET /api/mall/products` |
| 返回 | `{ code:0, data:{ list:[{ productId, name, desc, cover, coverUrl, pointsPrice, stockMock, category, status }] } }` | `{ code:0, data: [MallProduct] }` |

### 9.2 创建订单

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `familyData({ action: "createMallOrderMock", payload:{ productId, quantity?, addressId?, address? } })` | `POST /api/mall/orders` |
| 参数 | `payload` 内字段 | `{ addressId, items: [{ productId, quantity }] }` |
| 返回 | `{ code:0, data:{ orderId, pointsCost, pointsBalance } }` | `{ code:0, data: MallOrder }` |

**前端改造要点**：
- 后端用 `items` 数组支持多商品下单（云函数只支持单商品）

### 9.3 获取订单列表

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `familyData({ action: "listMallOrdersMock" })` | `GET /api/mall/orders` |
| 返回 | `{ code:0, data:{ list:[{ orderId, status, pointsCost, createdAtText, updatedAtText, firstItem }] } }` | `{ code:0, data: [MallOrder] }` |

### 9.4 获取订单详情

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `familyData({ action: "getMallOrderMockDetail", orderId })` | `GET /api/mall/orders/{orderId}` |
| 返回 | `{ code:0, data:{ orderId, status, items, pointsCost, pointsBalanceAfter, addressMock, statusTimeline, createdAtText, updatedAtText } }` | `{ code:0, data: MallOrder }` |

### 9.5 支付订单

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `familyData({ action: "payMallOrderMock", orderId })` | `POST /api/mall/orders/{orderId}/advance` |
| 返回 | `{ code:0, data:{ orderId, status:"paid" } }` | `{ code:0, data: null }` |

### 9.6 推进订单状态

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `familyData({ action: "advanceMallOrderStatusMock", orderId })` | `POST /api/mall/orders/{orderId}/advance` |
| 返回 | `{ code:0, data:{ orderId, status } }` | `{ code:0, data: null }` |

### 9.7 删除订单

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `familyData({ action: "deleteMallOrderMock", orderId })` | `DELETE /api/mall/orders/{orderId}` |
| 返回 | `{ code:0, data:{ orderId } }` | `{ code:0, data: null }` |

---

## 十、地址模块

### 10.1 获取地址列表

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `familyData({ action: "listShippingAddresses" })` | `GET /api/address/list` |
| 返回 | `{ code:0, data:{ list:[{ addressId, receiver, phone, region, detail, tag, isDefault }], defaultAddress:{...} } }` | `{ code:0, data: [UserShippingAddress] }` |

### 10.2 获取默认地址

| 项目 | Spring Boot |
|------|-------------|
| 接口 | `GET /api/address/default` |
| 返回 | `{ code:0, data: UserShippingAddress }` |

### 10.3 保存地址（新增/编辑）

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `familyData({ action: "saveShippingAddress", payload:{ addressId?, receiver, phone, region, detail, tag?, isDefault? } })` | `POST /api/address` |
| 参数 | `payload` 内字段 | `{ addressId?, receiver, phone, region, detail, tag?, isDefault? }` |
| 返回 | `{ code:0, data:{ address:{...} } }` | `{ code:0, data: null }` |

### 10.4 设置默认地址

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `familyData({ action: "setDefaultShippingAddress", addressId })` | `PUT /api/address/{addressId}/default` |
| 返回 | `{ code:0 }` | `{ code:0, data: null }` |

### 10.5 删除地址

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `familyData({ action: "deleteShippingAddress", addressId })` | `DELETE /api/address/{addressId}` |
| 返回 | `{ code:0 }` | `{ code:0, data: null }` |

---

## 十一、药品库模块

### 11.1 搜索药品库

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `medicineLibrary({ action: "search", q, from?, size?, usageMethod?, mealTiming?, hasMedicineId? })` | `GET /api/medicine-library/search?keyword=xxx&page=1&size=20` |
| 返回 | `{ code:0, data:{ list:[{ _id, medicineId, name, titleHtml, fragHtml, dosageSummary, indication, ruleHint, usageMethod, mealTiming }], hasMore } }` | `{ code:0, data: Page<MedicineLibrary> }` |

**前端改造要点**：
- 参数 `q` 改为 `keyword`
- 分页从 `from/size` 改为 `page/size`
- 返回从 `{ list, hasMore }` 改为 Spring Boot Page 格式

### 11.2 获取药品库列表

| 项目 | Spring Boot |
|------|-------------|
| 接口 | `GET /api/medicine-library/list?page=1&size=20` |
| 返回 | `{ code:0, data: Page<MedicineLibrary> }` |

### 11.3 获取药品库详情

| 项目 | Spring Boot |
|------|-------------|
| 接口 | `GET /api/medicine-library/{id}` |
| 返回 | `{ code:0, data: MedicineLibrary }` |

---

## 十二、附近药店模块

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `nearbyPharmacy` | `POST /api/pharmacy/nearby` |
| 参数 | `{ latitude, longitude, radius?, keyword?, pageNum?, pageSize? }` | `?lat=xxx&lng=xxx&radius=3000`（query params） |
| 返回 | `{ code:0, data:{ list:[{ name, address, province, city, area, telephone, distanceM, latitude, longitude }], pageNum, pageSize, total, hasMore, radiusM, keyword } }` | `{ code:0, data: [{...}] }` |

**前端改造要点**：
- 参数从 request body 改为 query params
- 返回从分页包装改为直接数组
- 坐标转换（BD-09 -> GCJ-02）在后端完成

---

## 十三、反馈模块

| 项目 | 云开发 | Spring Boot |
|------|--------|-------------|
| 云函数 | `familyData({ action: "submitUserFeedback", content })` | `POST /api/feedback` |
| 参数 | `{ content }` | `{ content: "..." }` |
| 返回 | `{ code:0 }` | `{ code:0, data: null }` |

---

## 十四、直接数据库读写替换汇总

以下操作在前端页面中直接使用 `db.collection()`，需全部替换为 API 调用：

| 页面文件 | 原操作 | 替换接口 |
|----------|--------|----------|
| `pages/drug-detail/index.ts` | `db.collection("medicines").doc(id).get()` | `GET /api/medicine/{id}` |
| `pages/drug-detail/index.ts` | `db.collection("medicines").where({name}).limit(1).get()` | `GET /api/medicine/by-name?name=xxx`（需新增） |
| `pages/reminder-setting/index.ts` | `db.collection("medicines").doc(medicineId).get()` | `GET /api/medicine/{id}` |
| `pages/reminder-setting/index.ts` | `db.collection("medicines").where({name}).limit(1).get()` | `GET /api/medicine/by-name?name=xxx` |
| `pages/reminder-setting/index.ts` | `db.collection("user_medicines").doc(id).get()` | `GET /api/user-medicine/{id}` |
| `pages/reminder-setting/index.ts` | `db.collection("user_medicines").doc(id).update()` | `PUT /api/user-medicine/{id}`（需新增） |
| `pages/reminder-setting/index.ts` | `db.collection("reminders").where({userMedicineId}).get()` | `GET /api/reminder/drug-detail-rule?userMedicineId=xxx` |
| `pages/ai-chat-pick-medicine/index.ts` | `db.collection("medicines").doc(mid).get()` | `GET /api/medicine/{id}` |
| `components/tab-panel-home/index.ts` | `db.collection("reminder_logs").where({}).get()` | 由 `GET /api/dashboard` 返回数据中包含 |
| `components/tab-panel-chat/index.ts` | `db.collection("ai_chat_sessions").doc(id).get()` | `GET /api/ai-chat/sessions/{id}` |

---

## 十五、后端需新增/修改的接口汇总

| 编号 | 类型 | 接口 | 说明 |
|------|------|------|------|
| 1 | 新增 | `GET /api/medicine/by-name?name=xxx` | 按精确名称查药品 |
| 2 | 新增 | `PUT /api/user-medicine/{id}` | 更新用户药品信息 |
| 3 | 新增 | `GET /api/dashboard/low-stock-summary` | 低库存摘要（返回 `{count, top}`) |
| 4 | 修改 | `AiChatServiceImpl.checkReminder()` | 增加 `suggestion` 结构化解析 |
| 5 | 修改 | `AiChatSendRequest` | 增加 `enableThinking`、`enableSearch` 字段 |
| 6 | 修改 | `FamilyServiceImpl.getRelations()` | 双向查询（owner + member） |
| 7 | 修改 | `ReminderServiceImpl.createPlan()` | 提醒时间已过则设 startDate=tomorrow |
| 8 | 新增 | `ReminderPushScheduler` | 定时推送微信订阅消息（替代 `sendReminderMessage` 云函数） |

---

## 十六、前端改造关键文件清单

| 文件 | 改动类型 | 说明 |
|------|----------|------|
| `miniprogram/utils/request.ts` | 新建 | HTTP 请求封装（wx.request + JWT + 错误处理） |
| `miniprogram/app.ts` | 重写登录 | 去掉 wx.cloud.init，改用 HTTP 登录 |
| `miniprogram/pages/login/index.ts` | 重写 | 云函数登录改为 HTTP |
| `miniprogram/pages/profile-edit/index.ts` | 修改 | wx.cloud.uploadFile -> wx.uploadFile |
| `miniprogram/api/address.ts` | 重写 | 云函数 -> HTTP |
| `miniprogram/api/ai-chat.ts` | 重写 | 云函数 -> HTTP |
| `miniprogram/api/family.ts` | 重写 | 云函数 -> HTTP |
| `miniprogram/api/mall.ts` | 重写 | 云函数 -> HTTP |
| `miniprogram/api/points.ts` | 重写 | 云函数 -> HTTP |
| `miniprogram/api/auth.ts` | 新建 | 登录/刷新/获取用户 |
| `miniprogram/api/dashboard.ts` | 新建 | 仪表盘相关接口 |
| `miniprogram/api/reminder.ts` | 新建 | 提醒相关接口 |
| `miniprogram/api/user-medicine.ts` | 新建 | 用户药品管理接口 |
| `miniprogram/api/medicine.ts` | 新建 | 药品识别/查询接口 |
| `miniprogram/api/medicine-library.ts` | 新建 | 药品库搜索接口 |
| `miniprogram/components/tab-panel-home/index.ts` | 修改 | 4个云函数调用替换 |
| `miniprogram/components/tab-panel-chat/index.ts` | 修改 | deepseekChat 替换 |
| `miniprogram/components/tab-panel-scan/index.ts` | 修改 | recognizeMedicine 替换 |
| `miniprogram/components/tab-panel-mine/index.ts` | 修改 | familyData 调用替换 |
| `miniprogram/pages/reminder-setting/index.ts` | 重写 | 最复杂：5处db读+2处db写+4个云函数 |
| `miniprogram/pages/drug-detail/index.ts` | 修改 | 2处db读+1个云函数替换 |
| `miniprogram/pages/medicine-list/index.ts` | 修改 | getMedicineList + deleteUserMedicine 替换 |
| `miniprogram/pages/scan-result/index.ts` | 修改 | addMedicineToList + createPending 替换 |
| `miniprogram/pages/family/index.ts` | 修改 | familyData 6个action替换 |
| `miniprogram/pages/family-bind/index.ts` | 修改 | familyData 3个action替换 |
| `miniprogram/pages/history/index.ts` | 修改 | getHistory 替换 |
| `miniprogram/pages/missed-stats/index.ts` | 修改 | getMissedStats 替换 |
| `miniprogram/pages/stock-monitor/index.ts` | 修改 | getMedicineList + getDrugDetailRule 替换 |
| `miniprogram/pages/nearby-pharmacy/index.ts` | 修改 | nearbyPharmacy 替换 |
| `miniprogram/pages/medicine-library/index.ts` | 修改 | medicineLibrary 替换 |
| `miniprogram/pages/points-mall/index.ts` | 修改 | getMallProducts + getWallet 替换 |
| `miniprogram/pages/points-order-*.ts` | 修改 | mall 订单相关替换 |
| `miniprogram/pages/address-list/index.ts` | 修改 | address 相关替换 |
| `miniprogram/pages/address-edit/index.ts` | 修改 | saveAddress 替换 |
| `miniprogram/pages/ai-chat-pick-medicine/index.ts` | 修改 | db读替换 |
| `miniprogram/utils/recognize-medicine-consult.ts` | 修改 | uploadFile + recognizeMedicine 替换 |
