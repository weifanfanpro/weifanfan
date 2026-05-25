<template>
  <div class="page-container">
    <div class="summary-row stagger-in">
      <div class="mini-stat" v-for="s in summary" :key="s.label">
        <span class="mini-stat-value" :style="{ color: s.color }">{{ s.value }}</span>
        <span class="mini-stat-label">{{ s.label }}</span>
      </div>
    </div>

    <DataTable
      title="用户管理"
      subtitle="管理平台注册用户"
      :columns="columns"
      :data="filteredUsers"
      :current-page="currentPage"
      :page-size="10"
    >
      <template #actions>
        <button class="btn btn-outline">导出用户</button>
      </template>

      <template #filters>
        <input v-model="searchQuery" type="text" placeholder="搜索用户名、手机号..." class="filter-input" />
        <select v-model="levelFilter" class="filter-select">
          <option value="">全部等级</option>
          <option v-for="l in levels" :key="l" :value="l">{{ l }}</option>
        </select>
        <select v-model="statusFilter" class="filter-select">
          <option value="">全部状态</option>
          <option value="正常">正常</option>
          <option value="禁用">禁用</option>
        </select>
      </template>

      <template #cell-name="{ row }">
        <div class="user-cell">
          <div class="user-avatar" :style="{ background: getAvatarColor(row.name) }">{{ row.name[0] }}</div>
          <div class="user-info-cell">
            <span class="user-name">{{ row.name }}</span>
            <span class="user-phone">{{ row.phone }}</span>
          </div>
        </div>
      </template>

      <template #cell-level="{ value }">
        <span class="level-badge" :class="levelClass(value)">{{ value }}</span>
      </template>

      <template #cell-points="{ value }">
        <span class="points-value">{{ value.toLocaleString() }}</span>
      </template>

      <template #cell-totalSpent="{ value }">
        <span class="amount">¥{{ Number(value).toLocaleString() }}</span>
      </template>

      <template #cell-orderCount="{ value }">
        <span class="count">{{ value }}</span>
      </template>

      <template #cell-status="{ value }">
        <span class="status-badge" :class="value === '正常' ? 'active' : 'inactive'">{{ value }}</span>
      </template>

      <template #cell-actions="{ row }">
        <div class="action-btns">
          <button class="icon-btn" title="查看详情" @click="openDetail(row)">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>
          </button>
          <button class="icon-btn" title="编辑" @click="editUser(row)">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
          </button>
          <button class="icon-btn" :class="row.status === '正常' ? 'warning' : 'success'" :title="row.status === '正常' ? '禁用' : '启用'" @click="toggleStatus(row)">
            <svg v-if="row.status === '正常'" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clip-rule="evenodd"/></svg>
            <svg v-else viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Detail Modal -->
    <Teleport to="body">
      <transition name="modal">
        <div v-if="detailModal" class="modal-overlay" @click.self="detailModal = false">
          <div class="modal modal-lg">
            <div class="modal-header">
              <h3>用户详情</h3>
              <button class="modal-close" @click="detailModal = false">×</button>
            </div>
            <div class="modal-body" v-if="selectedUser">
              <div class="user-detail-header">
                <div class="user-avatar-lg" :style="{ background: getAvatarColor(selectedUser.name) }">{{ selectedUser.name[0] }}</div>
                <div class="user-detail-info">
                  <h4>{{ selectedUser.name }}</h4>
                  <span class="level-badge" :class="levelClass(selectedUser.level)">{{ selectedUser.level }}</span>
                  <div class="user-meta">
                    <span>{{ selectedUser.phone }}</span>
                    <span>{{ selectedUser.email }}</span>
                  </div>
                </div>
              </div>
              <div class="user-stats-grid">
                <div class="user-stat">
                  <span class="user-stat-value">{{ selectedUser.points.toLocaleString() }}</span>
                  <span class="user-stat-label">积分余额</span>
                </div>
                <div class="user-stat">
                  <span class="user-stat-value">¥{{ Number(selectedUser.totalSpent).toLocaleString() }}</span>
                  <span class="user-stat-label">累计消费</span>
                </div>
                <div class="user-stat">
                  <span class="user-stat-value">{{ selectedUser.orderCount }}</span>
                  <span class="user-stat-label">订单数</span>
                </div>
                <div class="user-stat">
                  <span class="user-stat-value">{{ selectedUser.registerDate }}</span>
                  <span class="user-stat-label">注册时间</span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-ghost" @click="detailModal = false">关闭</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import DataTable from '../components/DataTable.vue'
import { generateUsers } from '../utils/mock'

const users = ref(generateUsers())
const searchQuery = ref('')
const levelFilter = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const detailModal = ref(false)
const selectedUser = ref(null)

const levels = ['普通会员', '银卡会员', '金卡会员', '钻石会员']

const summary = computed(() => [
  { label: '总用户', value: users.value.length, color: '#0A6E5D' },
  { label: '活跃用户', value: users.value.filter(u => u.status === '正常').length, color: '#10B981' },
  { label: 'VIP用户', value: users.value.filter(u => u.level !== '普通会员').length, color: '#E8A838' },
  { label: '本月新增', value: '126', color: '#3B82F6' }
])

const columns = [
  { key: 'name', label: '用户', width: '180px' },
  { key: 'level', label: '等级', width: '110px' },
  { key: 'points', label: '积分', width: '100px' },
  { key: 'totalSpent', label: '累计消费', width: '120px' },
  { key: 'orderCount', label: '订单数', width: '80px' },
  { key: 'lastLogin', label: '最近登录', width: '130px' },
  { key: 'status', label: '状态', width: '80px' },
  { key: 'actions', label: '操作', width: '120px' }
]

const filteredUsers = computed(() =>
  users.value.filter(u => {
    if (searchQuery.value && !u.name.includes(searchQuery.value) && !u.phone.includes(searchQuery.value)) return false
    if (levelFilter.value && u.level !== levelFilter.value) return false
    if (statusFilter.value && u.status !== statusFilter.value) return false
    return true
  })
)

function getAvatarColor(name) {
  const colors = ['#0A6E5D', '#3B82F6', '#E8A838', '#8B5CF6', '#EF4444', '#10B981']
  return colors[name.charCodeAt(0) % colors.length]
}
function levelClass(l) {
  const map = { '普通会员': 'normal', '银卡会员': 'silver', '金卡会员': 'gold', '钻石会员': 'diamond' }
  return map[l] || ''
}

function openDetail(row) { selectedUser.value = row; detailModal.value = true }
function editUser(row) { /* placeholder */ }
function toggleStatus(row) {
  row.status = row.status === '正常' ? '禁用' : '正常'
}
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 20px; }
.summary-row { display: flex; gap: 14px; }
.mini-stat { flex: 1; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 16px 20px; display: flex; flex-direction: column; gap: 2px; }
.mini-stat-value { font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 700; }
.mini-stat-label { font-size: 0.82rem; color: var(--text-tertiary); }

.user-cell { display: flex; align-items: center; gap: 10px; }
.user-avatar { width: 36px; height: 36px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.88rem; flex-shrink: 0; }
.user-info-cell { display: flex; flex-direction: column; }
.user-name { font-weight: 600; color: var(--text-primary); font-size: 0.9rem; }
.user-phone { font-size: 0.78rem; color: var(--text-tertiary); }

.level-badge { display: inline-block; padding: 3px 10px; border-radius: var(--radius-full); font-size: 0.78rem; font-weight: 500; }
.level-badge.normal { background: var(--bg-root); color: var(--text-secondary); }
.level-badge.silver { background: #F3F4F6; color: #6B7280; border: 1px solid #D1D5DB; }
.level-badge.gold { background: rgba(245,158,11,0.1); color: #D97706; }
.level-badge.diamond { background: rgba(139,92,246,0.1); color: #7C3AED; }

.points-value { font-family: 'Outfit', sans-serif; font-weight: 600; color: var(--primary); }
.amount { font-weight: 600; color: var(--text-primary); }
.count { font-weight: 500; }

.status-badge { display: inline-block; padding: 3px 10px; border-radius: var(--radius-full); font-size: 0.78rem; font-weight: 500; }
.status-badge.active { background: rgba(16,185,129,0.1); color: #059669; }
.status-badge.inactive { background: rgba(239,68,68,0.1); color: #DC2626; }

.action-btns { display: flex; gap: 6px; }
.icon-btn { width: 30px; height: 30px; border: none; border-radius: 6px; background: transparent; color: var(--text-tertiary); display: flex; align-items: center; justify-content: center; transition: all var(--duration-fast); }
.icon-btn:hover { background: var(--bg-root); color: var(--primary); }
.icon-btn.warning:hover { background: rgba(245,158,11,0.08); color: #D97706; }
.icon-btn.success:hover { background: rgba(16,185,129,0.08); color: #059669; }
.icon-btn svg { width: 16px; height: 16px; }

.btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 500; border: none; transition: all var(--duration-fast); }
.btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text-secondary); }
.btn-outline:hover { border-color: var(--primary); color: var(--primary); }
.btn-ghost { background: transparent; color: var(--text-secondary); }
.btn-ghost:hover { background: var(--bg-root); }

.filter-input { padding: 8px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.85rem; outline: none; background: var(--bg-card); min-width: 200px; transition: border-color var(--duration-fast); }
.filter-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-ghost); }
.filter-select { padding: 8px 30px 8px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.85rem; outline: none; background: var(--bg-card); appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%239CA3AF'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; background-size: 16px; cursor: pointer; }

.modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; }
.modal { background: var(--bg-card); border-radius: var(--radius-xl); width: 560px; max-height: 85vh; overflow: auto; box-shadow: var(--shadow-xl); }
.modal-lg { width: 640px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--border-light); }
.modal-header h3 { font-size: 1.1rem; font-weight: 600; }
.modal-close { width: 32px; height: 32px; border: none; background: var(--bg-root); border-radius: 8px; font-size: 1.2rem; color: var(--text-tertiary); display: flex; align-items: center; justify-content: center; }
.modal-close:hover { background: var(--danger); color: #fff; }
.modal-body { padding: 24px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid var(--border-light); }

.user-detail-header { display: flex; align-items: center; gap: 20px; margin-bottom: 28px; }
.user-avatar-lg { width: 64px; height: 64px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; flex-shrink: 0; }
.user-detail-info h4 { font-size: 1.2rem; margin-bottom: 6px; }
.user-meta { display: flex; gap: 16px; margin-top: 8px; font-size: 0.85rem; color: var(--text-tertiary); }

.user-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.user-stat { background: var(--bg-root); border-radius: var(--radius-md); padding: 16px; text-align: center; }
.user-stat-value { display: block; font-family: 'Outfit', sans-serif; font-size: 1.2rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.user-stat-label { font-size: 0.78rem; color: var(--text-tertiary); }

.modal-enter-active { transition: all 0.25s var(--ease-spring); }
.modal-leave-active { transition: all 0.2s var(--ease-out); }
.modal-enter-from { opacity: 0; }
.modal-leave-to { opacity: 0; }
.modal-enter-from .modal { transform: scale(0.92) translateY(16px); }
.modal-leave-to .modal { transform: scale(0.96); }
</style>
