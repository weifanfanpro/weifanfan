<template>
  <div class="page-container">
    <div class="summary-row stagger-in">
      <div class="mini-stat" v-for="s in summary" :key="s.label">
        <span class="mini-stat-value" :style="{ color: s.color }">{{ s.value }}</span>
        <span class="mini-stat-label">{{ s.label }}</span>
      </div>
    </div>

    <DataTable
      title="用户反馈"
      subtitle="查看用户反馈"
      :columns="columns"
      :data="filteredFeedback"
      :show-pagination="false"
    >
      <template #filters>
        <input v-model="searchQuery" type="text" placeholder="搜索反馈标题..." class="filter-input" />
        <select v-model="statusFilter" class="filter-select">
          <option value="">全部状态</option>
          <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
        </select>
      </template>

      <template #cell-title="{ row }">
        <div class="feedback-title-cell">
          <span class="feedback-title" @click="openDetail(row)">{{ row.title }}</span>
          <span class="feedback-id">#{{ row.id }}</span>
        </div>
      </template>

      <template #cell-type="{ value }">
        <span class="type-tag" :class="typeClass(value)">{{ value }}</span>
      </template>

      <template #cell-status="{ value }">
        <span class="status-badge" :class="statusClass(value)">{{ value }}</span>
      </template>

      <template #cell-actions="{ row }">
        <button class="icon-btn" title="查看详情" @click="openDetail(row)">
          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>
        </button>
      </template>
    </DataTable>

    <Teleport to="body">
      <transition name="modal">
        <div v-if="detailModal" class="modal-overlay" @click.self="detailModal = false">
          <div class="modal modal-lg">
            <div class="modal-header">
              <h3>反馈详情</h3>
              <button class="modal-close" @click="detailModal = false">×</button>
            </div>
            <div class="modal-body" v-if="selectedFeedback">
              <div class="detail-meta">
                <div class="detail-user">
                  <div class="user-avatar-sm">{{ (selectedFeedback.openid || '?')[0] }}</div>
                  <div>
                    <span class="detail-user-name">{{ selectedFeedback.openid }}</span>
                    <span class="detail-time">{{ selectedFeedback.createdAt }}</span>
                  </div>
                </div>
                <span class="type-tag" :class="typeClass(selectedFeedback.type)">{{ selectedFeedback.type }}</span>
              </div>
              <h4 class="detail-title">{{ selectedFeedback.title }}</h4>
              <p class="detail-content">{{ selectedFeedback.content }}</p>
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
import { ref, computed, onMounted } from 'vue'
import DataTable from '../components/DataTable.vue'
import { get } from '@/utils/request'

const feedback = ref([])
const searchQuery = ref('')
const statusFilter = ref('')
const detailModal = ref(false)
const selectedFeedback = ref(null)
const statuses = ['pending', 'processing', 'replied', 'closed']

const summary = computed(() => [
  { label: '总反馈', value: feedback.value.length, color: '#0A6E5D' },
  { label: '待处理', value: feedback.value.filter(f => f.status === 'pending').length, color: '#F59E0B' },
  { label: '处理中', value: feedback.value.filter(f => f.status === 'processing').length, color: '#3B82F6' },
  { label: '已解决', value: feedback.value.filter(f => f.status === 'replied' || f.status === 'closed').length, color: '#10B981' }
])

const columns = [
  { key: 'id', label: '编号', width: '80px' },
  { key: 'title', label: '反馈内容' },
  { key: 'openid', label: '用户', width: '130px' },
  { key: 'type', label: '类型', width: '100px' },
  { key: 'status', label: '状态', width: '90px' },
  { key: 'createdAt', label: '时间', width: '160px' },
  { key: 'actions', label: '操作', width: '70px' }
]

const filteredFeedback = computed(() =>
  feedback.value.filter(f => {
    if (searchQuery.value && !(f.title || '').includes(searchQuery.value)) return false
    if (statusFilter.value && f.status !== statusFilter.value) return false
    return true
  })
)

function typeClass(t) {
  const map = { feature: 'blue', bug: 'red', experience: 'green', help: 'purple', complaint: 'orange' }
  return map[t] || 'gray'
}
function statusClass(s) {
  const map = { pending: 'warning', processing: 'info', replied: 'success', closed: 'default' }
  return map[s] || ''
}

function openDetail(row) {
  selectedFeedback.value = row
  detailModal.value = true
}

onMounted(async () => {
  try {
    feedback.value = await get('/admin/feedbacks')
  } catch (e) {
    console.error('加载反馈失败:', e)
  }
})
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 20px; }
.summary-row { display: flex; gap: 14px; }
.mini-stat { flex: 1; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 16px 20px; display: flex; flex-direction: column; gap: 2px; }
.mini-stat-value { font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 700; }
.mini-stat-label { font-size: 0.82rem; color: var(--text-tertiary); }

.feedback-title-cell { display: flex; flex-direction: column; gap: 2px; }
.feedback-title { font-weight: 600; color: var(--text-primary); cursor: pointer; transition: color var(--duration-fast); }
.feedback-title:hover { color: var(--primary); }
.feedback-id { font-size: 0.75rem; color: var(--text-tertiary); }

.type-tag { display: inline-block; padding: 3px 10px; border-radius: var(--radius-full); font-size: 0.78rem; font-weight: 500; }
.type-tag.blue { background: rgba(59,130,246,0.1); color: #2563EB; }
.type-tag.red { background: rgba(239,68,68,0.1); color: #DC2626; }
.type-tag.green { background: rgba(16,185,129,0.1); color: #059669; }
.type-tag.purple { background: rgba(139,92,246,0.1); color: #7C3AED; }
.type-tag.orange { background: rgba(245,158,11,0.1); color: #D97706; }
.type-tag.gray { background: var(--bg-root); color: var(--text-secondary); }

.status-badge { display: inline-block; padding: 3px 10px; border-radius: var(--radius-full); font-size: 0.78rem; font-weight: 500; }
.status-badge.warning { background: rgba(245,158,11,0.1); color: #D97706; }
.status-badge.info { background: rgba(59,130,246,0.1); color: #2563EB; }
.status-badge.success { background: rgba(16,185,129,0.1); color: #059669; }
.status-badge.default { background: var(--bg-root); color: var(--text-tertiary); }

.icon-btn { width: 30px; height: 30px; border: none; border-radius: 6px; background: transparent; color: var(--text-tertiary); display: flex; align-items: center; justify-content: center; transition: all var(--duration-fast); }
.icon-btn:hover { background: var(--bg-root); color: var(--primary); }
.icon-btn svg { width: 16px; height: 16px; }

.btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 500; border: none; transition: all var(--duration-fast); cursor: pointer; }
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
.modal-close { width: 32px; height: 32px; border: none; background: var(--bg-root); border-radius: 8px; font-size: 1.2rem; color: var(--text-tertiary); display: flex; align-items: center; justify-content: center; transition: all var(--duration-fast); }
.modal-close:hover { background: var(--danger); color: #fff; }
.modal-body { padding: 24px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid var(--border-light); }

.detail-meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.detail-user { display: flex; align-items: center; gap: 10px; }
.user-avatar-sm { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--primary-light)); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.88rem; }
.detail-user-name { display: block; font-weight: 600; font-size: 0.85rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.detail-time { display: block; font-size: 0.78rem; color: var(--text-tertiary); }
.detail-title { font-size: 1.1rem; font-weight: 600; margin-bottom: 12px; }
.detail-content { font-size: 0.92rem; color: var(--text-secondary); line-height: 1.7; white-space: pre-wrap; }

.modal-enter-active { transition: all 0.25s var(--ease-spring); }
.modal-leave-active { transition: all 0.2s var(--ease-out); }
.modal-enter-from { opacity: 0; }
.modal-leave-to { opacity: 0; }
.modal-enter-from .modal { transform: scale(0.92) translateY(16px); }
.modal-leave-to .modal { transform: scale(0.96); }
</style>
