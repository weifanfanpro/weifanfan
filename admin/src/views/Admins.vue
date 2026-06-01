<template>
  <div class="page-container">
    <div class="summary-row stagger-in">
      <div class="mini-stat" v-for="s in summary" :key="s.label">
        <span class="mini-stat-value" :style="{ color: s.color }">{{ s.value }}</span>
        <span class="mini-stat-label">{{ s.label }}</span>
      </div>
    </div>

    <DataTable
      title="管理员管理"
      subtitle="管理系统管理员账号"
      :columns="columns"
      :data="admins"
      :show-pagination="false"
    >
      <template #actions>
        <button v-if="appStore.isSuperAdmin" class="btn btn-primary" @click="openAdd">
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/></svg>
          添加管理员
        </button>
      </template>

      <template #cell-username="{ row }">
        <div class="admin-cell">
          <div class="admin-avatar" :style="{ background: getAvatarColor(row.username) }">{{ (row.username || '?')[0] }}</div>
          <span class="admin-name">{{ row.username }}</span>
        </div>
      </template>

      <template #cell-role="{ value }">
        <span class="role-badge" :class="roleClass(value)">{{ roleLabel(value) }}</span>
      </template>

      <template #cell-status="{ value }">
        <span class="status-badge" :class="value === 'enabled' ? 'active' : 'inactive'">{{ value === 'enabled' ? '正常' : '禁用' }}</span>
      </template>

      <template #cell-lastLoginAt="{ value }">
        <span>{{ value || '-' }}</span>
      </template>

      <template #cell-actions="{ row }">
        <div class="action-btns">
          <button v-if="appStore.isSuperAdmin && row.username !== 'admin'" class="icon-btn danger" title="删除" @click="deleteAdmin(row)">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9z" clip-rule="evenodd"/></svg>
          </button>
          <button v-if="appStore.isSuperAdmin && row.username !== 'admin'" class="icon-btn" :title="row.status === 'enabled' ? '禁用' : '启用'" @click="toggleStatus(row)">
            <svg v-if="row.status === 'enabled'" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd"/></svg>
            <svg v-else viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/></svg>
          </button>
        </div>
      </template>
    </DataTable>

    <Teleport to="body">
      <transition name="modal">
        <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
          <div class="modal">
            <div class="modal-header">
              <h3>添加管理员</h3>
              <button class="modal-close" @click="showModal = false">×</button>
            </div>
            <div class="modal-body">
              <div class="form-grid">
                <div class="form-group">
                  <label>用户名</label>
                  <input v-model="form.username" type="text" placeholder="请输入用户名" class="form-input" />
                </div>
                <div class="form-group">
                  <label>密码</label>
                  <input v-model="form.password" type="password" placeholder="请输入密码" class="form-input" />
                </div>
                <div class="form-group full">
                  <label>角色</label>
                  <select v-model="form.role" class="form-input">
                    <option value="ROLE_OPERATOR">运营管理员</option>
                    <option value="ROLE_CS">客服管理员</option>
                    <option value="ROLE_TECH">技术管理员</option>
                    <option value="ROLE_FINANCE">财务管理员</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-ghost" @click="showModal = false">取消</button>
              <button class="btn btn-primary" @click="saveAdmin">保存</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from '../components/DataTable.vue'
import { useAppStore } from '@/stores/app'
import { get, post, del } from '@/utils/request'

const appStore = useAppStore()
const admins = ref([])
const showModal = ref(false)
const form = ref({ username: '', password: '', role: 'ROLE_OPERATOR' })

const summary = computed(() => [
  { label: '管理员总数', value: admins.value.length, color: '#0A6E5D' },
  { label: '正常状态', value: admins.value.filter(a => a.status === 'enabled').length, color: '#10B981' },
  { label: '已禁用', value: admins.value.filter(a => a.status === 'disabled').length, color: '#EF4444' },
  { label: '角色类型', value: new Set(admins.value.map(a => a.role)).size, color: '#3B82F6' }
])

const columns = [
  { key: 'username', label: '管理员', width: '180px' },
  { key: 'role', label: '角色', width: '130px' },
  { key: 'lastLoginAt', label: '最近登录', width: '180px' },
  { key: 'status', label: '状态', width: '80px' },
  { key: 'actions', label: '操作', width: '80px' }
]

function getAvatarColor(name) {
  const colors = ['#0A6E5D', '#3B82F6', '#E8A838', '#8B5CF6', '#EF4444']
  return colors[(name || '').charCodeAt(0) % colors.length]
}
function roleClass(r) {
  const map = { ROLE_SUPER_ADMIN: 'super', ROLE_OPERATOR: 'ops', ROLE_CS: 'cs', ROLE_TECH: 'tech', ROLE_FINANCE: 'fin' }
  return map[r] || ''
}
function roleLabel(r) {
  const map = { ROLE_SUPER_ADMIN: '超级管理员', ROLE_OPERATOR: '运营管理员', ROLE_CS: '客服管理员', ROLE_TECH: '技术管理员', ROLE_FINANCE: '财务管理员' }
  return map[r] || r
}

function openAdd() {
  form.value = { username: '', password: '', role: 'ROLE_OPERATOR' }
  showModal.value = true
}

async function loadAdmins() {
  try {
    admins.value = await get('/admin/auth/list')
  } catch (e) {
    console.error('加载管理员失败:', e)
  }
}

async function saveAdmin() {
  if (!form.value.username || !form.value.password) {
    alert('请填写用户名和密码')
    return
  }
  try {
    await post('/admin/auth/create', form.value)
    showModal.value = false
    await loadAdmins()
  } catch (e) {
    alert('添加失败: ' + (e.message || '未知错误'))
  }
}

async function toggleStatus(row) {
  const action = row.status === 'enabled' ? '禁用' : '启用'
  if (!confirm(`确定${action}管理员「${row.username}」？`)) return
  try {
    const newStatus = row.status === 'enabled' ? 'disabled' : 'enabled'
    await post(`/admin/auth/${row.username}/status`, { status: newStatus })
    await loadAdmins()
  } catch (e) {
    alert(`${action}失败: ` + (e.message || '未知错误'))
  }
}

async function deleteAdmin(row) {
  if (!confirm(`确定删除管理员「${row.username}」？`)) return
  try {
    await del(`/admin/auth/${row.username}`)
    await loadAdmins()
  } catch (e) {
    alert('删除失败: ' + (e.message || '未知错误'))
  }
}

onMounted(loadAdmins)
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 20px; }
.summary-row { display: flex; gap: 14px; }
.mini-stat { flex: 1; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 16px 20px; display: flex; flex-direction: column; gap: 2px; }
.mini-stat-value { font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 700; }
.mini-stat-label { font-size: 0.82rem; color: var(--text-tertiary); }

.admin-cell { display: flex; align-items: center; gap: 12px; }
.admin-avatar { width: 38px; height: 38px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.95rem; flex-shrink: 0; }
.admin-name { font-weight: 600; color: var(--text-primary); }

.role-badge { display: inline-block; padding: 3px 10px; border-radius: var(--radius-full); font-size: 0.78rem; font-weight: 500; }
.role-badge.super { background: rgba(139,92,246,0.1); color: #7C3AED; }
.role-badge.ops { background: rgba(59,130,246,0.1); color: #2563EB; }
.role-badge.cs { background: rgba(16,185,129,0.1); color: #059669; }
.role-badge.tech { background: rgba(245,158,11,0.1); color: #D97706; }
.role-badge.fin { background: rgba(239,68,68,0.1); color: #DC2626; }

.status-badge { display: inline-block; padding: 3px 10px; border-radius: var(--radius-full); font-size: 0.78rem; font-weight: 500; }
.status-badge.active { background: rgba(16,185,129,0.1); color: #059669; }
.status-badge.inactive { background: rgba(239,68,68,0.1); color: #DC2626; }

.action-btns { display: flex; gap: 6px; }
.icon-btn { width: 30px; height: 30px; border: none; border-radius: 6px; background: transparent; color: var(--text-tertiary); display: flex; align-items: center; justify-content: center; transition: all var(--duration-fast); }
.icon-btn:hover { background: var(--bg-root); color: var(--primary); }
.icon-btn.danger:hover { background: rgba(239,68,68,0.08); color: var(--danger); }
.icon-btn svg { width: 16px; height: 16px; }

.btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 500; border: none; transition: all var(--duration-fast); cursor: pointer; }
.btn-primary { background: var(--primary); color: #fff; }
.btn-primary:hover { background: var(--primary-dark); box-shadow: 0 4px 12px rgba(10,110,93,0.25); }
.btn-ghost { background: transparent; color: var(--text-secondary); }
.btn-ghost:hover { background: var(--bg-root); }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group.full { grid-column: 1 / -1; }
.form-group label { font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); }
.form-input { padding: 9px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.88rem; outline: none; background: var(--bg-card); transition: border-color var(--duration-fast); }
.form-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-ghost); }

.modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; }
.modal { background: var(--bg-card); border-radius: var(--radius-xl); width: 480px; max-height: 85vh; overflow: auto; box-shadow: var(--shadow-xl); }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--border-light); }
.modal-header h3 { font-size: 1.1rem; font-weight: 600; }
.modal-close { width: 32px; height: 32px; border: none; background: var(--bg-root); border-radius: 8px; font-size: 1.2rem; color: var(--text-tertiary); display: flex; align-items: center; justify-content: center; }
.modal-close:hover { background: var(--danger); color: #fff; }
.modal-body { padding: 24px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid var(--border-light); }

.modal-enter-active { transition: all 0.25s var(--ease-spring); }
.modal-leave-active { transition: all 0.2s var(--ease-out); }
.modal-enter-from { opacity: 0; }
.modal-leave-to { opacity: 0; }
.modal-enter-from .modal { transform: scale(0.92) translateY(16px); }
.modal-leave-to .modal { transform: scale(0.96); }
</style>
