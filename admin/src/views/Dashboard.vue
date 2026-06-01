<template>
  <div class="dashboard">
    <div class="stats-grid stagger-in">
      <div v-for="(stat, i) in stats" :key="stat.label" class="stat-card" :style="{ '--accent': stat.color }">
        <div class="stat-icon-wrap" :style="{ background: stat.color + '12' }">
          <svg v-if="stat.icon === 'users'" viewBox="0 0 24 24" fill="none" :stroke="stat.color" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <svg v-if="stat.icon === 'orders'" viewBox="0 0 24 24" fill="none" :stroke="stat.color" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          <svg v-if="stat.icon === 'products'" viewBox="0 0 24 24" fill="none" :stroke="stat.color" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          <svg v-if="stat.icon === 'feedback'" viewBox="0 0 24 24" fill="none" :stroke="stat.color" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div class="stat-content">
          <span class="stat-label">{{ stat.label }}</span>
          <span class="stat-value">{{ animatedValues[i] ?? stat.value }}</span>
        </div>
      </div>
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
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { get } from '@/utils/request'

const rawData = ref({ totalUsers: 0, totalOrders: 0, totalProducts: 0, totalFeedbacks: 0 })
const animatedValues = reactive([0, 0, 0, 0])

const stats = [
  { label: '总用户数', key: 'totalUsers', icon: 'users', color: '#0A6E5D' },
  { label: '总订单数', key: 'totalOrders', icon: 'orders', color: '#E8A838' },
  { label: '总商品数', key: 'totalProducts', icon: 'products', color: '#3B82F6' },
  { label: '总反馈数', key: 'totalFeedbacks', icon: 'feedback', color: '#8B5CF6' }
]

const quickActions = [
  { label: '商品管理', path: '/products', color: '#E8A838', icon: '<svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4z" clip-rule="evenodd"/></svg>' },
  { label: '订单管理', path: '/orders', color: '#0A6E5D', icon: '<svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/></svg>' },
  { label: '处理反馈', path: '/feedback', color: '#3B82F6', icon: '<svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clip-rule="evenodd"/></svg>' },
  { label: '管理员管理', path: '/admins', color: '#8B5CF6', icon: '<svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001z" clip-rule="evenodd"/></svg>' }
]

onMounted(async () => {
  try {
    const data = await get('/admin/dashboard/summary')
    rawData.value = data
    stats.forEach((stat, i) => {
      const target = data[stat.key] || 0
      const duration = 1000
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
  } catch (e) {
    console.error('加载看板数据失败:', e)
  }
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
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
  align-items: center;
  gap: 16px;
  transition: all var(--duration-normal) var(--ease-out);
}
.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.stat-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-icon-wrap svg { width: 24px; height: 24px; }
.stat-content { flex: 1; }
.stat-label { display: block; font-size: 0.82rem; color: var(--text-tertiary); margin-bottom: 4px; }
.stat-value { display: block; font-family: 'Outfit', sans-serif; font-size: 1.8rem; font-weight: 700; color: var(--text-primary); }

.quick-actions-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  padding: 24px;
}
.quick-actions-card h3 { font-size: 1rem; font-weight: 600; margin-bottom: 16px; }
.quick-actions-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
  transition: all var(--duration-fast) var(--ease-out);
  cursor: pointer;
}
.quick-action-btn:hover {
  border-color: var(--primary);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}
.action-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

@media (max-width: 1200px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .quick-actions-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
