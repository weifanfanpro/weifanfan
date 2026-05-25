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
      subtitle="查看和处理用户反馈"
      :columns="columns"
      :data="filteredFeedback"
      :current-page="currentPage"
      :page-size="10"
    >
      <template #actions>
        <button class="btn btn-outline">导出反馈</button>
      </template>

      <template #filters>
        <input v-model="searchQuery" type="text" placeholder="搜索反馈标题..." class="filter-input" />
        <select v-model="typeFilter" class="filter-select">
          <option value="">全部类型</option>
          <option v-for="t in types" :key="t" :value="t">{{ t }}</option>
        </select>
        <select v-model="statusFilter" class="filter-select">
          <option value="">全部状态</option>
          <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
        </select>
      </template>

      <template #cell-title="{ row }">
        <div class="feedback-title-cell">
          <span class="feedback-title" @click="openDetail(row)">{{ row.title }}</span>
          <span class="feedback-id">{{ row.id }}</span>
        </div>
      </template>

      <template #cell-type="{ value }">
        <span class="type-tag" :class="typeClass(value)">{{ value }}</span>
      </template>

      <template #cell-priority="{ value }">
        <span class="priority-dot" :class="priorityClass(value)"></span>
        <span :class="'priority-text-' + priorityClass(value)">{{ value }}</span>
      </template>

      <template #cell-status="{ value }">
        <span class="status-badge" :class="statusClass(value)">{{ value }}</span>
      </template>

      <template #cell-actions="{ row }">
        <div class="action-btns">
          <button class="icon-btn" title="查看详情" @click="openDetail(row)">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>
          </button>
          <button class="icon-btn success" title="回复" @click="openReply(row)">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
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
              <h3>反馈详情</h3>
              <button class="modal-close" @click="detailModal = false">×</button>
            </div>
            <div class="modal-body" v-if="selectedFeedback">
              <div class="detail-meta">
                <div class="detail-user">
                  <div class="user-avatar-sm">{{ selectedFeedback.user[0] }}</div>
                  <div>
                    <span class="detail-user-name">{{ selectedFeedback.user }}</span>
                    <span class="detail-time">{{ selectedFeedback.createdAt }}</span>
                  </div>
                </div>
                <div class="detail-tags">
                  <span class="type-tag" :class="typeClass(selectedFeedback.type)">{{ selectedFeedback.type }}</span>
                  <span class="priority-badge" :class="priorityClass(selectedFeedback.priority)">{{ selectedFeedback.priority }}优先级</span>
                </div>
              </div>
              <h4 class="detail-title">{{ selectedFeedback.title }}</h4>
              <p class="detail-content">{{ selectedFeedback.content }}</p>

              <div v-if="selectedFeedback.reply" class="reply-section">
                <h5>管理员回复</h5>
                <div class="reply-bubble">
                  <p>{{ selectedFeedback.reply }}</p>
                </div>
              </div>

              <div v-if="!selectedFeedback.reply" class="reply-input-section">
                <h5>回复用户</h5>
                <textarea v-model="replyText" placeholder="输入回复内容..." class="reply-textarea"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-ghost" @click="detailModal = false">关闭</button>
              <button v-if="selectedFeedback && !selectedFeedback.reply" class="btn btn-primary" @click="submitReply">提交回复</button>
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
import { generateFeedback } from '../utils/mock'

const feedback = ref(generateFeedback())
const searchQuery = ref('')
const typeFilter = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const detailModal = ref(false)
const selectedFeedback = ref(null)
const replyText = ref('')

const types = ['功能建议', 'BUG反馈', '体验优化', '咨询求助', '投诉建议']
const statuses = ['待处理', '处理中', '已回复', '已关闭']

const summary = computed(() => [
  { label: '总反馈', value: feedback.value.length, color: '#0A6E5D' },
  { label: '待处理', value: feedback.value.filter(f => f.status === '待处理').length, color: '#F59E0B' },
  { label: '处理中', value: feedback.value.filter(f => f.status === '处理中').length, color: '#3B82F6' },
  { label: '已解决', value: feedback.value.filter(f => f.status === '已回复' || f.status === '已关闭').length, color: '#10B981' }
])

const columns = [
  { key: 'id', label: '编号', width: '100px' },
  { key: 'title', label: '反馈内容' },
  { key: 'user', label: '用户', width: '80px' },
  { key: 'type', label: '类型', width: '100px' },
  { key: 'priority', label: '优先级', width: '90px' },
  { key: 'status', label: '状态', width: '90px' },
  { key: 'createdAt', label: '时间', width: '120px' },
  { key: 'actions', label: '操作', width: '90px' }
]

const filteredFeedback = computed(() =>
  feedback.value.filter(f => {
    if (searchQuery.value && !f.title.includes(searchQuery.value)) return false
    if (typeFilter.value && f.type !== typeFilter.value) return false
    if (statusFilter.value && f.status !== statusFilter.value) return false
    return true
  })
)

function typeClass(t) {
  const map = { '功能建议': 'blue', 'BUG反馈': 'red', '体验优化': 'green', '咨询求助': 'purple', '投诉建议': 'orange' }
  return map[t] || ''
}
function priorityClass(p) {
  const map = { '低': 'low', '中': 'medium', '高': 'high', '紧急': 'urgent' }
  return map[p] || ''
}
function statusClass(s) {
  const map = { '待处理': 'warning', '处理中': 'info', '已回复': 'success', '已关闭': 'default' }
  return map[s] || ''
}

function openDetail(row) { selectedFeedback.value = row; detailModal.value = true; replyText.value = '' }
function openReply(row) { selectedFeedback.value = row; detailModal.value = true; replyText.value = '' }
function submitReply() {
  if (!replyText.value.trim()) return
  selectedFeedback.value.reply = replyText.value
  selectedFeedback.value.status = '已回复'
  detailModal.value = false
}
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

.priority-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; vertical-align: middle; }
.priority-dot.low { background: #10B981; }
.priority-dot.medium { background: #F59E0B; }
.priority-dot.high { background: #F97316; }
.priority-dot.urgent { background: #EF4444; animation: pulse 1.5s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

.status-badge { display: inline-block; padding: 3px 10px; border-radius: var(--radius-full); font-size: 0.78rem; font-weight: 500; }
.status-badge.warning { background: rgba(245,158,11,0.1); color: #D97706; }
.status-badge.info { background: rgba(59,130,246,0.1); color: #2563EB; }
.status-badge.success { background: rgba(16,185,129,0.1); color: #059669; }
.status-badge.default { background: var(--bg-root); color: var(--text-tertiary); }

.action-btns { display: flex; gap: 6px; }
.icon-btn { width: 30px; height: 30px; border: none; border-radius: 6px; background: transparent; color: var(--text-tertiary); display: flex; align-items: center; justify-content: center; transition: all var(--duration-fast); }
.icon-btn:hover { background: var(--bg-root); color: var(--primary); }
.icon-btn.success:hover { background: rgba(16,185,129,0.08); color: #059669; }
.icon-btn svg { width: 16px; height: 16px; }

.btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 500; border: none; transition: all var(--duration-fast); }
.btn-primary { background: var(--primary); color: #fff; }
.btn-primary:hover { background: var(--primary-dark); }
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
.modal-close { width: 32px; height: 32px; border: none; background: var(--bg-root); border-radius: 8px; font-size: 1.2rem; color: var(--text-tertiary); display: flex; align-items: center; justify-content: center; transition: all var(--duration-fast); }
.modal-close:hover { background: var(--danger); color: #fff; }
.modal-body { padding: 24px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid var(--border-light); }

.detail-meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.detail-user { display: flex; align-items: center; gap: 10px; }
.user-avatar-sm { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--primary-light)); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.88rem; }
.detail-user-name { display: block; font-weight: 600; font-size: 0.9rem; }
.detail-time { display: block; font-size: 0.78rem; color: var(--text-tertiary); }
.detail-tags { display: flex; gap: 8px; }
.priority-badge { display: inline-block; padding: 3px 10px; border-radius: var(--radius-full); font-size: 0.78rem; font-weight: 500; }
.priority-badge.low { background: rgba(16,185,129,0.1); color: #059669; }
.priority-badge.medium { background: rgba(245,158,11,0.1); color: #D97706; }
.priority-badge.high { background: rgba(249,115,22,0.1); color: #EA580C; }
.priority-badge.urgent { background: rgba(239,68,68,0.1); color: #DC2626; }

.detail-title { font-size: 1.1rem; font-weight: 600; margin-bottom: 12px; }
.detail-content { font-size: 0.92rem; color: var(--text-secondary); line-height: 1.7; }

.reply-section { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border-light); }
.reply-section h5, .reply-input-section h5 { font-size: 0.9rem; font-weight: 600; margin-bottom: 12px; }
.reply-bubble { background: var(--primary-ghost); border-radius: var(--radius-md); padding: 14px 18px; border-left: 3px solid var(--primary); }
.reply-bubble p { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; }

.reply-input-section { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border-light); }
.reply-textarea { width: 100%; min-height: 100px; padding: 12px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.9rem; resize: vertical; outline: none; font-family: inherit; transition: border-color var(--duration-fast); }
.reply-textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-ghost); }

.modal-enter-active { transition: all 0.25s var(--ease-spring); }
.modal-leave-active { transition: all 0.2s var(--ease-out); }
.modal-enter-from { opacity: 0; }
.modal-leave-to { opacity: 0; }
.modal-enter-from .modal { transform: scale(0.92) translateY(16px); }
.modal-leave-to .modal { transform: scale(0.96); }
</style>
