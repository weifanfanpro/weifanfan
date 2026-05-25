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
        <button class="btn btn-primary" @click="showModal = true">
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/></svg>
          添加管理员
        </button>
      </template>

      <template #cell-name="{ row }">
        <div class="admin-cell">
          <div class="admin-avatar" :style="{ background: getAvatarColor(row.name) }">{{ row.name[0] }}</div>
          <div class="admin-info">
            <span class="admin-name">{{ row.name }}</span>
            <span class="admin-email">{{ row.email }}</span>
          </div>
        </div>
      </template>

      <template #cell-role="{ value }">
        <span class="role-badge" :class="roleClass(value)">{{ value }}</span>
      </template>

      <template #cell-permissions="{ row }">
        <div class="perm-tags">
          <span v-for="p in row.permissions" :key="p" class="perm-tag">{{ p }}</span>
        </div>
      </template>

      <template #cell-status="{ value }">
        <span class="status-badge" :class="value === '正常' ? 'active' : 'inactive'">{{ value }}</span>
      </template>

      <template #cell-actions="{ row }">
        <div class="action-btns">
          <button class="icon-btn" title="编辑" @click="editAdmin(row)">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
          </button>
          <button class="icon-btn" :class="row.status === '正常' ? 'warning' : 'success'" :title="row.status === '正常' ? '禁用' : '启用'" @click="toggleStatus(row)">
            <svg v-if="row.status === '正常'" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clip-rule="evenodd"/></svg>
            <svg v-else viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
          </button>
          <button v-if="row.role !== '超级管理员'" class="icon-btn danger" title="删除" @click="deleteAdmin(row)">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9z" clip-rule="evenodd"/></svg>
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Add Modal -->
    <Teleport to="body">
      <transition name="modal">
        <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
          <div class="modal">
            <div class="modal-header">
              <h3>{{ editingAdmin ? '编辑管理员' : '添加管理员' }}</h3>
              <button class="modal-close" @click="showModal = false">×</button>
            </div>
            <div class="modal-body">
              <div class="form-grid">
                <div class="form-group">
                  <label>姓名</label>
                  <input v-model="form.name" type="text" placeholder="请输入姓名" class="form-input" />
                </div>
                <div class="form-group">
                  <label>角色</label>
                  <select v-model="form.role" class="form-input">
                    <option>运营管理员</option>
                    <option>客服管理员</option>
                    <option>技术管理员</option>
                    <option>财务管理员</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>邮箱</label>
                  <input v-model="form.email" type="email" placeholder="admin@zyzl.com" class="form-input" />
                </div>
                <div class="form-group">
                  <label>手机号</label>
                  <input v-model="form.phone" type="tel" placeholder="13800000000" class="form-input" />
                </div>
              </div>
              <div class="form-group" style="margin-top: 16px">
                <label>权限配置</label>
                <div class="perm-checkboxes">
                  <label v-for="p in allPermissions" :key="p" class="perm-checkbox">
                    <input type="checkbox" :value="p" v-model="form.permissions" />
                    <span>{{ p }}</span>
                  </label>
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
import { ref, computed } from 'vue'
import DataTable from '../components/DataTable.vue'
import { generateAdmins } from '../utils/mock'

const admins = ref(generateAdmins())
const showModal = ref(false)
const editingAdmin = ref(null)
const allPermissions = ['数据看板', '药品管理', '商品管理', '积分管理', '用户反馈', '用户管理', '订单管理', '系统设置']

const form = ref({ name: '', role: '运营管理员', email: '', phone: '', permissions: [] })

const summary = computed(() => [
  { label: '管理员总数', value: admins.value.length, color: '#0A6E5D' },
  { label: '正常状态', value: admins.value.filter(a => a.status === '正常').length, color: '#10B981' },
  { label: '已禁用', value: admins.value.filter(a => a.status === '禁用').length, color: '#EF4444' },
  { label: '角色类型', value: new Set(admins.value.map(a => a.role)).size, color: '#3B82F6' }
])

const columns = [
  { key: 'name', label: '管理员', width: '200px' },
  { key: 'role', label: '角色', width: '130px' },
  { key: 'permissions', label: '权限' },
  { key: 'lastLogin', label: '最近登录', width: '150px' },
  { key: 'status', label: '状态', width: '80px' },
  { key: 'actions', label: '操作', width: '120px' }
]

function getAvatarColor(name) {
  const colors = ['#0A6E5D', '#3B82F6', '#E8A838', '#8B5CF6', '#EF4444']
  return colors[name.charCodeAt(0) % colors.length]
}
function roleClass(r) {
  const map = { '超级管理员': 'super', '运营管理员': 'ops', '客服管理员': 'cs', '技术管理员': 'tech', '财务管理员': 'fin' }
  return map[r] || ''
}

function editAdmin(row) {
  editingAdmin.value = row
  form.value = { ...row, permissions: [...row.permissions] }
  showModal.value = true
}
function toggleStatus(row) { row.status = row.status === '正常' ? '禁用' : '正常' }
function deleteAdmin(row) {
  if (confirm(`确定删除管理员「${row.name}」？`)) admins.value = admins.value.filter(a => a.id !== row.id)
}
function saveAdmin() {
  if (editingAdmin.value) {
    const idx = admins.value.findIndex(a => a.id === editingAdmin.value.id)
    if (idx !== -1) admins.value[idx] = { ...admins.value[idx], ...form.value }
  } else {
    admins.value.push({
      ...form.value,
      id: `ADM-${String(admins.value.length + 1).padStart(3, '0')}`,
      status: '正常',
      lastLogin: '-'
    })
  }
  showModal.value = false; editingAdmin.value = null
  form.value = { name: '', role: '运营管理员', email: '', phone: '', permissions: [] }
}
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 20px; }
.summary-row { display: flex; gap: 14px; }
.mini-stat { flex: 1; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 16px 20px; display: flex; flex-direction: column; gap: 2px; }
.mini-stat-value { font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 700; }
.mini-stat-label { font-size: 0.82rem; color: var(--text-tertiary); }

.admin-cell { display: flex; align-items: center; gap: 12px; }
.admin-avatar { width: 38px; height: 38px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.95rem; flex-shrink: 0; }
.admin-info { display: flex; flex-direction: column; }
.admin-name { font-weight: 600; color: var(--text-primary); }
.admin-email { font-size: 0.78rem; color: var(--text-tertiary); }

.role-badge { display: inline-block; padding: 3px 10px; border-radius: var(--radius-full); font-size: 0.78rem; font-weight: 500; }
.role-badge.super { background: rgba(139,92,246,0.1); color: #7C3AED; }
.role-badge.ops { background: rgba(59,130,246,0.1); color: #2563EB; }
.role-badge.cs { background: rgba(16,185,129,0.1); color: #059669; }
.role-badge.tech { background: rgba(245,158,11,0.1); color: #D97706; }
.role-badge.fin { background: rgba(239,68,68,0.1); color: #DC2626; }

.perm-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.perm-tag { display: inline-block; padding: 2px 8px; background: var(--bg-root); border-radius: var(--radius-full); font-size: 0.75rem; color: var(--text-secondary); }

.status-badge { display: inline-block; padding: 3px 10px; border-radius: var(--radius-full); font-size: 0.78rem; font-weight: 500; }
.status-badge.active { background: rgba(16,185,129,0.1); color: #059669; }
.status-badge.inactive { background: rgba(239,68,68,0.1); color: #DC2626; }

.action-btns { display: flex; gap: 6px; }
.icon-btn { width: 30px; height: 30px; border: none; border-radius: 6px; background: transparent; color: var(--text-tertiary); display: flex; align-items: center; justify-content: center; transition: all var(--duration-fast); }
.icon-btn:hover { background: var(--bg-root); color: var(--primary); }
.icon-btn.warning:hover { background: rgba(245,158,11,0.08); color: #D97706; }
.icon-btn.success:hover { background: rgba(16,185,129,0.08); color: #059669; }
.icon-btn.danger:hover { background: rgba(239,68,68,0.08); color: var(--danger); }
.icon-btn svg { width: 16px; height: 16px; }

.btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 500; border: none; transition: all var(--duration-fast); }
.btn-primary { background: var(--primary); color: #fff; }
.btn-primary:hover { background: var(--primary-dark); box-shadow: 0 4px 12px rgba(10,110,93,0.25); }
.btn-ghost { background: transparent; color: var(--text-secondary); }
.btn-ghost:hover { background: var(--bg-root); }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); }
.form-input { padding: 9px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.88rem; outline: none; background: var(--bg-card); transition: border-color var(--duration-fast); }
.form-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-ghost); }
.perm-checkboxes { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 4px; }
.perm-checkbox { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: var(--text-secondary); cursor: pointer; }
.perm-checkbox input { accent-color: var(--primary); width: 16px; height: 16px; }

.modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; }
.modal { background: var(--bg-card); border-radius: var(--radius-xl); width: 560px; max-height: 85vh; overflow: auto; box-shadow: var(--shadow-xl); }
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
