<template>
  <div class="page-container">
    <div class="summary-row stagger-in">
      <div class="mini-stat" v-for="s in summary" :key="s.label">
        <span class="mini-stat-value" :style="{ color: s.color }">{{ s.value }}</span>
        <span class="mini-stat-label">{{ s.label }}</span>
      </div>
    </div>

    <DataTable
      title="订单管理"
      subtitle="管理积分商城订单"
      :columns="columns"
      :data="filteredOrders"
      :show-pagination="false"
    >
      <template #filters>
        <input v-model="searchQuery" type="text" placeholder="搜索订单号..." class="filter-input" />
        <select v-model="statusFilter" class="filter-select">
          <option value="">全部状态</option>
          <option v-for="s in statusList" :key="s" :value="s">{{ s }}</option>
        </select>
      </template>

      <template #cell-status="{ value }">
        <span class="status-badge" :class="statusClass(value)">{{ value }}</span>
      </template>

      <template #cell-actions="{ row }">
        <button
          v-if="canAdvance(row.status)"
          class="btn btn-primary btn-sm"
          @click="advanceOrder(row)"
        >
          {{ advanceLabel(row.status) }}
        </button>
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from '../components/DataTable.vue'
import { get, post } from '@/utils/request'

const orders = ref([])
const searchQuery = ref('')
const statusFilter = ref('')
const statusList = ['pending', 'paid', 'shipped', 'completed', 'cancelled']

const summary = computed(() => [
  { label: '总订单', value: orders.value.length, color: '#0A6E5D' },
  { label: '待付款', value: orders.value.filter(o => o.status === 'pending').length, color: '#F59E0B' },
  { label: '已发货', value: orders.value.filter(o => o.status === 'shipped').length, color: '#3B82F6' },
  { label: '已完成', value: orders.value.filter(o => o.status === 'completed').length, color: '#10B981' }
])

const columns = [
  { key: 'orderId', label: '订单号', width: '180px' },
  { key: 'openid', label: '用户', width: '140px' },
  { key: 'totalPoints', label: '积分', width: '100px' },
  { key: 'status', label: '状态', width: '100px' },
  { key: 'createdAt', label: '创建时间', width: '180px' },
  { key: 'actions', label: '操作', width: '120px' }
]

const filteredOrders = computed(() =>
  orders.value.filter(o => {
    if (searchQuery.value && !o.orderId.includes(searchQuery.value)) return false
    if (statusFilter.value && o.status !== statusFilter.value) return false
    return true
  })
)

function statusClass(s) {
  const map = { pending: 'warning', paid: 'info', shipped: 'info', completed: 'success', cancelled: 'default' }
  return map[s] || ''
}

function canAdvance(status) {
  return ['pending', 'paid', 'shipped'].includes(status)
}

function advanceLabel(status) {
  const map = { pending: '确认付款', paid: '确认发货', shipped: '确认完成' }
  return map[status] || ''

}

async function loadOrders() {
  try {
    orders.value = await get('/admin/orders')
  } catch (e) {
    console.error('加载订单失败:', e)
  }
}

async function advanceOrder(row) {
  try {
    await post(`/admin/orders/${row.orderId}/advance`)
    await loadOrders()
  } catch (e) {
    alert('操作失败: ' + (e.message || '未知错误'))
  }
}

onMounted(loadOrders)
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 20px; }
.summary-row { display: flex; gap: 14px; }
.mini-stat { flex: 1; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 16px 20px; display: flex; flex-direction: column; gap: 2px; }
.mini-stat-value { font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 700; }
.mini-stat-label { font-size: 0.82rem; color: var(--text-tertiary); }

.status-badge { display: inline-block; padding: 3px 10px; border-radius: var(--radius-full); font-size: 0.78rem; font-weight: 500; }
.status-badge.warning { background: rgba(245,158,11,0.1); color: #D97706; }
.status-badge.info { background: rgba(59,130,246,0.1); color: #2563EB; }
.status-badge.success { background: rgba(16,185,129,0.1); color: #059669; }
.status-badge.default { background: var(--bg-root); color: var(--text-tertiary); }

.btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 500; border: none; transition: all var(--duration-fast); cursor: pointer; }
.btn-primary { background: var(--primary); color: #fff; }
.btn-primary:hover { background: var(--primary-dark); }
.btn-sm { padding: 5px 12px; font-size: 0.8rem; }

.filter-input { padding: 8px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.85rem; outline: none; background: var(--bg-card); min-width: 200px; transition: border-color var(--duration-fast); }
.filter-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-ghost); }
.filter-select { padding: 8px 30px 8px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.85rem; outline: none; background: var(--bg-card); appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%239CA3AF'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; background-size: 16px; cursor: pointer; }
.filter-select:focus { border-color: var(--primary); }
</style>
