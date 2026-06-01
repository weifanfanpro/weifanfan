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
      subtitle="管理注册用户账号"
      :columns="columns"
      :data="filteredUsers"
      :show-pagination="false"
    >
      <template #filters>
        <input v-model="searchQuery" type="text" placeholder="搜索昵称或手机号..." class="filter-input" />
        <select v-model="statusFilter" class="filter-select">
          <option value="">全部状态</option>
          <option value="enabled">正常</option>
          <option value="disabled">禁用</option>
        </select>
      </template>

      <template #cell-nickName="{ row }">
        <div class="user-cell">
          <div class="user-avatar" :style="{ background: getAvatarColor(row.nickName) }">{{ (row.nickName || '?')[0] }}</div>
          <span class="user-name">{{ row.nickName || '未设置' }}</span>
        </div>
      </template>

      <template #cell-gender="{ value }">
        <span>{{ genderLabel(value) }}</span>
      </template>

      <template #cell-memberLevel="{ value }">
        <span class="level-badge" :class="value">{{ levelLabel(value) }}</span>
      </template>

      <template #cell-status="{ value }">
        <span class="status-badge" :class="value === 'enabled' ? 'active' : 'inactive'">{{ value === 'enabled' ? '正常' : '禁用' }}</span>
      </template>

      <template #cell-lastLoginAt="{ value }">
        <span>{{ value || '-' }}</span>
      </template>

      <template #cell-actions="{ row }">
        <div class="action-btns">
          <button class="icon-btn" :title="row.status === 'enabled' ? '禁用' : '启用'" @click="toggleStatus(row)">
            <svg v-if="row.status === 'enabled'" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd"/></svg>
            <svg v-else viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/></svg>
          </button>
          <button class="icon-btn danger" title="删除" @click="deleteUser(row)">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9z" clip-rule="evenodd"/></svg>
          </button>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from '../components/DataTable.vue'
import { get, post, del } from '@/utils/request'

const users = ref([])
const searchQuery = ref('')
const statusFilter = ref('')

const summary = computed(() => [
  { label: '用户总数', value: users.value.length, color: '#0A6E5D' },
  { label: '正常用户', value: users.value.filter(u => u.status === 'enabled').length, color: '#10B981' },
  { label: '已禁用', value: users.value.filter(u => u.status === 'disabled').length, color: '#EF4444' },
  { label: 'VIP用户', value: users.value.filter(u => u.memberLevel && u.memberLevel !== 'normal').length, color: '#8B5CF6' }
])

const columns = [
  { key: 'nickName', label: '用户', width: '200px' },
  { key: 'phone', label: '手机号', width: '140px' },
  { key: 'gender', label: '性别', width: '80px' },
  { key: 'memberLevel', label: '会员等级', width: '100px' },
  { key: 'status', label: '状态', width: '80px' },
  { key: 'lastLoginAt', label: '最近登录', width: '180px' },
  { key: 'actions', label: '操作', width: '100px' }
]

const filteredUsers = computed(() =>
  users.value.filter(u => {
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      if (!(u.nickName || '').toLowerCase().includes(q) && !(u.phone || '').includes(q)) return false
    }
    if (statusFilter.value && u.status !== statusFilter.value) return false
    return true
  })
)

function getAvatarColor(name) {
  const colors = ['#0A6E5D', '#3B82F6', '#E8A838', '#8B5CF6', '#EF4444', '#10B981']
  return colors[((name || '').charCodeAt(0) || 0) % colors.length]
}

function genderLabel(g) {
  return { 0: '未知', 1: '男', 2: '女' }[g] || '未知'
}

function levelLabel(l) {
  const map = { normal: '普通', silver: '白银', gold: '黄金', diamond: '钻石' }
  return map[l] || l || '普通'
}

async function loadUsers() {
  try {
    users.value = await get('/admin/users/list')
  } catch (e) {
    console.error('加载用户失败:', e)
  }
}

async function toggleStatus(row) {
  const action = row.status === 'enabled' ? '禁用' : '启用'
  if (!confirm(`确定${action}用户「${row.nickName || row.id}」？`)) return
  try {
    const newStatus = row.status === 'enabled' ? 'disabled' : 'enabled'
    await post(`/admin/users/${row.id}/status`, { status: newStatus })
    await loadUsers()
  } catch (e) {
    alert(`${action}失败: ` + (e.message || '未知错误'))
  }
}

async function deleteUser(row) {
  if (!confirm(`确定删除用户「${row.nickName || row.id}」？此操作不可恢复。`)) return
  try {
    await del(`/admin/users/${row.id}`)
    await loadUsers()
  } catch (e) {
    alert('删除失败: ' + (e.message || '未知错误'))
  }
}

onMounted(loadUsers)
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 20px; }
.summary-row { display: flex; gap: 14px; }
.mini-stat { flex: 1; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 16px 20px; display: flex; flex-direction: column; gap: 2px; }
.mini-stat-value { font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 700; }
.mini-stat-label { font-size: 0.82rem; color: var(--text-tertiary); }

.user-cell { display: flex; align-items: center; gap: 10px; }
.user-avatar { width: 34px; height: 34px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.88rem; flex-shrink: 0; }
.user-name { font-weight: 600; color: var(--text-primary); }

.level-badge { display: inline-block; padding: 3px 10px; border-radius: var(--radius-full); font-size: 0.78rem; font-weight: 500; background: rgba(59,130,246,0.1); color: #2563EB; }
.level-badge.gold { background: rgba(232,168,56,0.1); color: #D97706; }
.level-badge.diamond { background: rgba(139,92,246,0.1); color: #7C3AED; }
.level-badge.silver { background: rgba(156,163,175,0.1); color: #6B7280; }

.status-badge { display: inline-block; padding: 3px 10px; border-radius: var(--radius-full); font-size: 0.78rem; font-weight: 500; }
.status-badge.active { background: rgba(16,185,129,0.1); color: #059669; }
.status-badge.inactive { background: rgba(239,68,68,0.1); color: #DC2626; }

.action-btns { display: flex; gap: 6px; }
.icon-btn { width: 30px; height: 30px; border: none; border-radius: 6px; background: transparent; color: var(--text-tertiary); display: flex; align-items: center; justify-content: center; transition: all var(--duration-fast); }
.icon-btn:hover { background: var(--bg-root); color: var(--primary); }
.icon-btn.danger:hover { background: rgba(239,68,68,0.08); color: var(--danger); }
.icon-btn svg { width: 16px; height: 16px; }

.filter-input { padding: 8px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.85rem; outline: none; background: var(--bg-card); min-width: 200px; transition: border-color var(--duration-fast); }
.filter-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-ghost); }
.filter-select { padding: 8px 30px 8px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.85rem; outline: none; background: var(--bg-card); appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%239CA3AF'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; background-size: 16px; cursor: pointer; }
.filter-select:focus { border-color: var(--primary); }
</style>
