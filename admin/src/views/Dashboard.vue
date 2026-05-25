<template>
  <div class="dashboard">
    <!-- Stats Cards -->
    <div class="stats-grid stagger-in">
      <div v-for="(stat, i) in data.stats" :key="i" class="stat-card" :style="{ '--accent': stat.color }">
        <div class="stat-icon-wrap" :style="{ background: stat.color + '12' }">
          <svg v-if="stat.icon === 'users'" viewBox="0 0 24 24" fill="none" :stroke="stat.color" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <svg v-if="stat.icon === 'drug'" viewBox="0 0 24 24" fill="none" :stroke="stat.color" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          <svg v-if="stat.icon === 'orders'" viewBox="0 0 24 24" fill="none" :stroke="stat.color" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          <svg v-if="stat.icon === 'points'" viewBox="0 0 24 24" fill="none" :stroke="stat.color" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
        <div class="stat-content">
          <span class="stat-label">{{ stat.label }}</span>
          <span class="stat-value">{{ animatedValues[i]?.toLocaleString() ?? stat.value.toLocaleString() }}</span>
          <span class="stat-change" :class="stat.change >= 0 ? 'up' : 'down'">
            <svg v-if="stat.change >= 0" viewBox="0 0 12 12" fill="currentColor"><path d="M6 2l4 4H2z"/></svg>
            <svg v-else viewBox="0 0 12 12" fill="currentColor"><path d="M6 10l4-4H2z"/></svg>
            {{ Math.abs(stat.change) }}%
          </span>
        </div>
        <div class="stat-sparkline">
          <svg viewBox="0 0 80 32" preserveAspectRatio="none">
            <path :d="getSparkline(i)" fill="none" :stroke="stat.color" stroke-width="2" stroke-linecap="round"/>
            <path :d="getSparkline(i) + ' L80,32 L0,32 Z'" :fill="stat.color" opacity="0.08"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="charts-row">
      <div class="chart-card revenue-chart">
        <div class="chart-header">
          <h3>营收趋势</h3>
          <div class="chart-tabs">
            <button class="chart-tab" :class="{ active: chartPeriod === 'month' }" @click="chartPeriod = 'month'">月度</button>
            <button class="chart-tab" :class="{ active: chartPeriod === 'quarter' }" @click="chartPeriod = 'quarter'">季度</button>
          </div>
        </div>
        <div class="chart-body">
          <v-chart :option="revenueOption" autoresize style="height: 280px" />
        </div>
      </div>

      <div class="chart-card category-chart">
        <div class="chart-header">
          <h3>品类分布</h3>
        </div>
        <div class="chart-body">
          <v-chart :option="categoryOption" autoresize style="height: 280px" />
        </div>
      </div>
    </div>

    <!-- Recent Orders -->
    <div class="recent-section">
      <div class="recent-card">
        <div class="recent-header">
          <h3>最新订单</h3>
          <a href="#" class="view-all">查看全部 →</a>
        </div>
        <table class="recent-table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>用户</th>
              <th>金额</th>
              <th>状态</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in data.recentOrders" :key="order.id">
              <td class="order-id">{{ order.id }}</td>
              <td>{{ order.user }}</td>
              <td class="amount">¥{{ order.amount.toFixed(2) }}</td>
              <td>
                <span class="status-badge" :class="order.status">
                  {{ { completed: '已完成', pending: '待处理', processing: '处理中' }[order.status] }}
                </span>
              </td>
              <td class="time-cell">{{ order.time }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="quick-actions-card">
        <h3>快捷操作</h3>
        <div class="quick-actions-grid">
          <button v-for="action in quickActions" :key="action.label" class="quick-action-btn" @click="$router.push(action.path)">
            <div class="action-icon" :style="{ background: action.color + '15', color: action.color }">
              <span v-html="action.icon"></span>
            </div>
            <span>{{ action.label }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { generateDashboardData } from '../utils/mock'

use([CanvasRenderer, LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent])

const data = generateDashboardData()
const chartPeriod = ref('month')
const animatedValues = reactive([0, 0, 0, 0])

// Animate stat values
onMounted(() => {
  data.stats.forEach((stat, i) => {
    const target = stat.value
    const duration = 1200
    const start = performance.now()
    function animate(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      animatedValues[i] = Math.floor(target * eased)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  })
})

function getSparkline(index) {
  const points = [
    [0,20],[10,18],[20,22],[30,15],[40,19],[50,12],[60,16],[70,10],[80,14],
    [0,22],[10,20],[20,16],[30,24],[40,14],[50,18],[60,10],[70,20],[80,8],
    [0,18],[10,22],[20,14],[30,20],[40,16],[50,22],[60,12],[70,18],[80,10],
    [0,16],[10,14],[20,20],[30,12],[40,22],[50,10],[60,18],[70,14],[80,20]
  ]
  const p = points.slice(index * 9, (index + 1) * 9)
  return 'M' + p.map(([x, y]) => `${x},${y}`).join(' L')
}

const revenueOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#fff',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    textStyle: { color: '#1A1D21', fontSize: 13 },
    axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(10,110,93,0.04)' } }
  },
  legend: {
    right: 0,
    top: 0,
    textStyle: { color: '#6B7280', fontSize: 12 },
    itemWidth: 12, itemHeight: 3
  },
  grid: { left: 0, right: 0, bottom: 0, top: 40, containLabel: true },
  xAxis: {
    type: 'category',
    data: data.revenueChart.months,
    axisLine: { lineStyle: { color: '#E5E7EB' } },
    axisTick: { show: false },
    axisLabel: { color: '#9CA3AF', fontSize: 12 }
  },
  yAxis: [
    {
      type: 'value',
      splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } },
      axisLabel: { color: '#9CA3AF', fontSize: 12, formatter: '¥{value}万' }
    },
    {
      type: 'value',
      splitLine: { show: false },
      axisLabel: { color: '#9CA3AF', fontSize: 12 }
    }
  ],
  series: [
    {
      name: '营收(万)',
      type: 'line',
      data: data.revenueChart.revenue,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 3, color: '#0A6E5D' },
      itemStyle: { color: '#0A6E5D', borderWidth: 2, borderColor: '#fff' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(10,110,93,0.15)' },
            { offset: 1, color: 'rgba(10,110,93,0)' }
          ]
        }
      }
    },
    {
      name: '订单数',
      type: 'line',
      yAxisIndex: 1,
      data: data.revenueChart.orders,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2, color: '#E8A838', type: 'dashed' },
      itemStyle: { color: '#E8A838', borderWidth: 2, borderColor: '#fff' }
    }
  ]
}))

const categoryOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    backgroundColor: '#fff',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    textStyle: { color: '#1A1D21', fontSize: 13 },
    formatter: '{b}: {c}%'
  },
  series: [{
    type: 'pie',
    radius: ['50%', '78%'],
    center: ['50%', '50%'],
    avoidLabelOverlap: false,
    itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 3 },
    label: { show: true, position: 'outside', fontSize: 12, color: '#6B7280' },
    labelLine: { length: 12, length2: 8, lineStyle: { color: '#D1D5DB' } },
    emphasis: {
      scaleSize: 8,
      label: { fontSize: 14, fontWeight: 'bold' }
    },
    data: data.categoryChart.map((item, i) => ({
      ...item,
      itemStyle: { color: ['#0A6E5D', '#14A085', '#E8A838', '#3B82F6', '#8B5CF6'][i] }
    }))
  }]
}))

const quickActions = [
  { label: '添加药品', path: '/drugs', color: '#0A6E5D', icon: '<svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/></svg>' },
  { label: '发布商品', path: '/products', color: '#E8A838', icon: '<svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4z" clip-rule="evenodd"/></svg>' },
  { label: '处理反馈', path: '/feedback', color: '#3B82F6', icon: '<svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clip-rule="evenodd"/></svg>' },
  { label: '用户管理', path: '/users', color: '#8B5CF6', icon: '<svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>' }
]
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}
.stat-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  padding: 22px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  position: relative;
  overflow: hidden;
  transition: all var(--duration-normal) var(--ease-out);
}
.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.stat-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-icon-wrap svg { width: 22px; height: 22px; }
.stat-content { flex: 1; min-width: 100px; }
.stat-label { display: block; font-size: 0.82rem; color: var(--text-tertiary); margin-bottom: 4px; }
.stat-value { display: block; font-family: 'Outfit', sans-serif; font-size: 1.6rem; font-weight: 700; color: var(--text-primary); line-height: 1.1; }
.stat-change {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.78rem;
  font-weight: 600;
  margin-top: 6px;
}
.stat-change svg { width: 10px; height: 10px; }
.stat-change.up { color: #059669; }
.stat-change.down { color: #DC2626; }
.stat-sparkline {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 100px;
  height: 40px;
  opacity: 0.6;
}

/* Charts */
.charts-row {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 18px;
}
.chart-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  overflow: hidden;
}
.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
}
.chart-header h3 { font-size: 1rem; font-weight: 600; }
.chart-tabs { display: flex; gap: 4px; background: var(--bg-root); border-radius: var(--radius-sm); padding: 3px; }
.chart-tab {
  padding: 5px 14px;
  border-radius: 6px;
  border: none;
  background: transparent;
  font-size: 0.82rem;
  color: var(--text-tertiary);
  font-weight: 500;
  transition: all var(--duration-fast);
}
.chart-tab.active { background: var(--bg-card); color: var(--text-primary); box-shadow: var(--shadow-sm); }
.chart-body { padding: 16px 20px; }

/* Recent */
.recent-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 18px;
}
.recent-card, .quick-actions-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  padding: 20px 24px;
}
.recent-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.recent-header h3 { font-size: 1rem; font-weight: 600; }
.view-all { font-size: 0.82rem; color: var(--primary); font-weight: 500; }
.view-all:hover { text-decoration: underline; }

.recent-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}
.recent-table th {
  padding: 10px 0;
  text-align: left;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border-light);
}
.recent-table td {
  padding: 12px 0;
  border-bottom: 1px solid var(--border-light);
  color: var(--text-secondary);
}
.recent-table tr:last-child td { border-bottom: none; }
.order-id { font-family: 'Outfit', monospace; font-weight: 500; color: var(--text-primary); }
.amount { font-weight: 600; color: var(--text-primary); }
.time-cell { color: var(--text-tertiary); font-size: 0.82rem; }

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: 0.78rem;
  font-weight: 500;
}
.status-badge.completed { background: rgba(16,185,129,0.1); color: #059669; }
.status-badge.pending { background: rgba(245,158,11,0.1); color: #D97706; }
.status-badge.processing { background: rgba(59,130,246,0.1); color: #2563EB; }

.quick-actions-card h3 { font-size: 1rem; font-weight: 600; margin-bottom: 16px; }
.quick-actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--text-primary);
  transition: all var(--duration-fast) var(--ease-out);
}
.quick-action-btn:hover {
  border-color: var(--primary);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}
.action-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

@media (max-width: 1200px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .charts-row { grid-template-columns: 1fr; }
  .recent-section { grid-template-columns: 1fr; }
}
</style>
