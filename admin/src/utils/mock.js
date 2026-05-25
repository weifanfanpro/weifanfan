// Mock data generators
export function generateDashboardData() {
  return {
    stats: [
      { label: '总用户数', value: 12846, change: +12.5, icon: 'users', color: '#0A6E5D' },
      { label: '药品种类', value: 2358, change: +3.2, icon: 'drug', color: '#3B82F6' },
      { label: '今日订单', value: 486, change: +8.7, icon: 'orders', color: '#E8A838' },
      { label: '积分发放', value: 52430, change: -2.1, icon: 'points', color: '#8B5CF6' }
    ],
    revenueChart: {
      months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      revenue: [42, 48, 56, 52, 68, 75, 82, 78, 92, 88, 96, 105],
      orders: [320, 380, 420, 390, 510, 560, 620, 580, 690, 660, 720, 790]
    },
    categoryChart: [
      { name: '处方药', value: 35 },
      { name: 'OTC药品', value: 28 },
      { name: '保健品', value: 18 },
      { name: '医疗器械', value: 12 },
      { name: '其他', value: 7 }
    ],
    recentOrders: [
      { id: 'ORD-2024001', user: '张三', amount: 256.00, status: 'completed', time: '10分钟前' },
      { id: 'ORD-2024002', user: '李四', amount: 189.50, status: 'pending', time: '25分钟前' },
      { id: 'ORD-2024003', user: '王五', amount: 432.00, status: 'completed', time: '1小时前' },
      { id: 'ORD-2024004', user: '赵六', amount: 67.80, status: 'processing', time: '2小时前' },
      { id: 'ORD-2024005', user: '孙七', amount: 315.00, status: 'completed', time: '3小时前' }
    ]
  }
}

export function generateDrugs() {
  const categories = ['处方药', 'OTC药品', '保健品', '中成药', '西药', '医疗器械']
  const manufacturers = ['国药集团', '华润三九', '白云山', '云南白药', '同仁堂', '修正药业']
  const names = [
    '阿莫西林胶囊', '布洛芬缓释胶囊', '复方感冒灵颗粒', '板蓝根颗粒',
    '六味地黄丸', '蒙脱石散', '头孢克肟分散片', '双黄连口服液',
    '健胃消食片', '金银花露', '感冒清热颗粒', '藿香正气水',
    '维生素C片', '钙尔奇D片', '甲硝唑片', '红霉素软膏',
    '皮炎平软膏', '创可贴', '体温计', '血压计'
  ]
  return names.map((name, i) => ({
    id: `DRG-${String(i + 1).padStart(4, '0')}`,
    name,
    category: categories[i % categories.length],
    manufacturer: manufacturers[i % manufacturers.length],
    price: (Math.random() * 200 + 10).toFixed(2),
    stock: Math.floor(Math.random() * 5000) + 100,
    status: Math.random() > 0.15 ? '在售' : '下架',
    approvalNumber: `国药准字H${2020 + (i % 4)}${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
    createdAt: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`
  }))
}

export function generateProducts() {
  const categories = ['西药', '中成药', '保健品', '医疗器械', '营养补充', '个人护理']
  const names = [
    '感冒灵颗粒装', '维生素B族复合片', '深海鱼油软胶囊', '电子血压计',
    '红外体温计', '医用外科口罩', '益生菌粉剂', '蛋白粉营养品',
    '叶酸片', '钙镁锌片', '褪黑素片', '胶原蛋白饮',
    '辅酶Q10胶囊', '螺旋藻片', 'DHA藻油', '铁锌口服液'
  ]
  return names.map((name, i) => ({
    id: `PRD-${String(i + 1).padStart(4, '0')}`,
    name,
    category: categories[i % categories.length],
    price: (Math.random() * 300 + 20).toFixed(2),
    originalPrice: (Math.random() * 400 + 50).toFixed(2),
    pointsPrice: Math.floor(Math.random() * 5000) + 500,
    sales: Math.floor(Math.random() * 10000) + 100,
    stock: Math.floor(Math.random() * 3000) + 50,
    status: ['在售', '下架', '预售'][Math.floor(Math.random() * 3)],
    rating: (4 + Math.random()).toFixed(1),
    createdAt: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`
  }))
}

export function generateUsers() {
  const names = ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十', '钱一一', '陈一二', '林一三', '黄一四', '刘一五', '杨一六', '何一七', '马一八']
  return names.map((name, i) => ({
    id: `USR-${String(i + 1).padStart(5, '0')}`,
    name,
    phone: `138${String(Math.floor(Math.random() * 99999999)).padStart(8, '0')}`,
    email: `user${i + 1}@example.com`,
    points: Math.floor(Math.random() * 10000),
    totalSpent: (Math.random() * 50000).toFixed(2),
    orderCount: Math.floor(Math.random() * 100),
    level: ['普通会员', '银卡会员', '金卡会员', '钻石会员'][Math.floor(Math.random() * 4)],
    status: Math.random() > 0.1 ? '正常' : '禁用',
    registerDate: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    lastLogin: `2024-12-${String(Math.floor(Math.random() * 20) + 1).padStart(2, '0')}`
  }))
}

export function generateFeedback() {
  const types = ['功能建议', 'BUG反馈', '体验优化', '咨询求助', '投诉建议']
  const statuses = ['待处理', '处理中', '已回复', '已关闭']
  const users = ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十']
  const titles = [
    '希望增加药品比价功能',
    '搜索结果加载缓慢',
    '积分兑换流程太复杂',
    '首页推荐不够精准',
    '订单详情页面崩溃',
    '支付完成后未跳转',
    '希望支持医保卡支付',
    '药品说明书字体太小',
    '建议增加用药提醒功能',
    '客服回复速度慢',
    '优惠券使用规则不清晰',
    '药品分类不够细致'
  ]
  const contents = [
    '希望能增加不同药店的药品价格对比，方便用户选择性价比最高的药品。',
    '在药品库页面搜索时，输入关键词后需要等待5秒以上才能显示结果，体验很差。',
    '积分兑换商品的步骤太多了，建议简化流程，增加一键兑换功能。',
    '首页推荐的药品与我的购买历史不太相关，推荐算法需要优化。',
    '在查看订单详情时，页面直接白屏崩溃了，手机型号是iPhone 15。',
    '微信支付成功后，页面一直显示"支付中"，没有自动跳转到结果页。',
    '很多用户希望能直接使用医保卡支付，减少自费部分。',
    '药品说明书的文字太小了，老年人看不清楚，建议支持放大功能。',
    '希望能设置用药提醒，定时提醒用户服药，特别是慢性病患者。',
    '在线咨询客服后，平均等待时间超过30分钟，希望能改善。',
    '优惠券的使用条件和限制不够明确，导致结算时才发现不能用。',
    '当前药品分类比较粗糙，建议增加更细分的科室分类。'
  ]
  return titles.map((title, i) => ({
    id: `FB-${String(i + 1).padStart(4, '0')}`,
    title,
    content: contents[i],
    type: types[i % types.length],
    user: users[i % users.length],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    priority: ['低', '中', '高', '紧急'][Math.floor(Math.random() * 4)],
    createdAt: `2024-12-${String(Math.floor(Math.random() * 20) + 1).padStart(2, '0')}`,
    reply: i < 4 ? '感谢您的反馈，我们已经收到并正在处理中。' : ''
  }))
}

export function generateAdmins() {
  return [
    { id: 'ADM-001', name: '张管理', role: '超级管理员', email: 'admin@zyzl.com', phone: '13800000001', status: '正常', lastLogin: '2024-12-20 14:30', permissions: ['全部权限'] },
    { id: 'ADM-002', name: '李运营', role: '运营管理员', email: 'ops@zyzl.com', phone: '13800000002', status: '正常', lastLogin: '2024-12-20 10:15', permissions: ['商品管理', '订单管理', '用户管理'] },
    { id: 'ADM-003', name: '王客服', role: '客服管理员', email: 'cs@zyzl.com', phone: '13800000003', status: '正常', lastLogin: '2024-12-19 16:45', permissions: ['用户反馈', '用户管理'] },
    { id: 'ADM-004', name: '赵技术', role: '技术管理员', email: 'tech@zyzl.com', phone: '13800000004', status: '禁用', lastLogin: '2024-12-15 09:00', permissions: ['系统设置', '数据看板'] },
    { id: 'ADM-005', name: '孙财务', role: '财务管理员', email: 'fin@zyzl.com', phone: '13800000005', status: '正常', lastLogin: '2024-12-20 11:20', permissions: ['积分管理', '订单管理', '数据看板'] }
  ]
}

export function generatePointsRecords() {
  const types = ['签到奖励', '购物返积分', '活动奖励', '积分兑换', '积分过期', '管理员调整']
  const users = ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十']
  return Array.from({ length: 20 }, (_, i) => ({
    id: `PTS-${String(i + 1).padStart(5, '0')}`,
    user: users[i % users.length],
    type: types[i % types.length],
    amount: types[i % types.length].includes('兑换') || types[i % types.length].includes('过期')
      ? -Math.floor(Math.random() * 2000) - 100
      : Math.floor(Math.random() * 500) + 10,
    balance: Math.floor(Math.random() * 10000),
    description: `${types[i % types.length]} - ${new Date(2024, 11, Math.floor(Math.random() * 20) + 1).toLocaleDateString()}`,
    createdAt: `2024-12-${String(Math.floor(Math.random() * 20) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
  }))
}
