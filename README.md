# 叮咚用药 (DingDong Medicine)

一款智能用药提醒微信小程序，帮助用户管理家庭药品、定时服药，并提供 AI 用药助手、附近药店查询、积分商城等功能。

## 项目结构

```
├── admin/          # 管理后台 (Vue 3 + Vite)
├── back/           # 后端服务 (Java Spring Boot)
└── weixin/         # 微信小程序前端 (TypeScript + TDesign)
```

## 核心功能

### 小程序端
- **药品管理** - 添加、编辑家庭药品，支持扫码录入
- **智能提醒** - 定时服药提醒，支持家庭成员代管
- **AI 用药助手** - 智能问答，提供用药建议
- **附近药店** - 基于位置查找附近药店
- **积分商城** - 购物获取积分，兑换商品
- **家庭关怀** - 绑定家人，远程查看服药情况

### 管理后台
- **数据看板** - 用户、订单、药品等数据统计
- **药品管理** - 药品库维护与审核
- **订单管理** - 商城订单处理
- **用户管理** - 用户信息查看

## 技术栈

| 模块 | 技术 |
|------|------|
| 小程序 | TypeScript, TDesign, WeChat MiniProgram |
| 后端 | Java, Spring Boot, MyBatis-Plus, Redis, JWT |
| 管理后台 | Vue 3, Vite, Pinia, Vue Router |
| 数据库 | MySQL |

## 快速开始

### 后端服务
```bash
cd back
# 配置 application.yml 中的数据库连接
mvn spring-boot:run
```

### 管理后台
```bash
cd admin
npm install
npm run dev
```

### 微信小程序
```bash
cd weixin
npm install
# 使用微信开发者工具打开项目
```

## 项目说明

- `server.log` - 后端运行日志
- `.gitignore` - Git 忽略配置
- `API-DOC.md` - 接口文档
