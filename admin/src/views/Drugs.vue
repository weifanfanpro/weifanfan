<template>
  <div class="page-container">
    <!-- Summary Cards -->
    <div class="summary-row stagger-in">
      <div class="mini-stat" v-for="s in summary" :key="s.label">
        <span class="mini-stat-value" :style="{ color: s.color }">{{ s.value }}</span>
        <span class="mini-stat-label">{{ s.label }}</span>
      </div>
    </div>

    <!-- Table -->
    <DataTable
      title="药品库"
      subtitle="管理所有药品信息"
      :columns="columns"
      :data="filteredDrugs"
      :current-page="currentPage"
      :page-size="10"
    >
      <template #actions>
        <button class="btn btn-primary" @click="showModal = true">
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/></svg>
          添加药品
        </button>
        <button class="btn btn-outline">导出数据</button>
      </template>

      <template #filters>
        <div class="filter-group">
          <input v-model="searchQuery" type="text" placeholder="搜索药品名称、批准文号..." class="filter-input" />
        </div>
        <select v-model="categoryFilter" class="filter-select">
          <option value="">全部分类</option>
          <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
        </select>
        <select v-model="statusFilter" class="filter-select">
          <option value="">全部状态</option>
          <option value="在售">在售</option>
          <option value="下架">下架</option>
        </select>
      </template>

      <template #cell-name="{ row }">
        <span class="drug-name">{{ row.name }}</span>
      </template>

      <template #cell-price="{ row }">
        <span class="price">¥{{ row.price }}</span>
      </template>

      <template #cell-stock="{ row }">
        <div class="stock-bar-wrap">
          <div class="stock-bar" :style="{ width: Math.min(row.stock / 50, 100) + '%' }" :class="{ low: row.stock < 200 }"></div>
        </div>
        <span class="stock-num">{{ row.stock }}</span>
      </template>

      <template #cell-status="{ row }">
        <span class="status-badge" :class="row.status === '在售' ? 'active' : 'inactive'">{{ row.status }}</span>
      </template>

      <template #cell-actions="{ row }">
        <div class="action-btns">
          <button class="icon-btn" title="编辑" @click="editDrug(row)">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
          </button>
          <button class="icon-btn danger" title="删除" @click="deleteDrug(row)">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Modal -->
    <Teleport to="body">
      <transition name="modal">
        <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
          <div class="modal">
            <div class="modal-header">
              <h3>{{ editingDrug ? '编辑药品' : '添加药品' }}</h3>
              <button class="modal-close" @click="showModal = false">×</button>
            </div>
            <div class="modal-body">
              <div class="form-grid">
                <div class="form-group">
                  <label>药品名称</label>
                  <input v-model="form.name" type="text" placeholder="请输入药品名称" class="form-input" />
                </div>
                <div class="form-group">
                  <label>分类</label>
                  <select v-model="form.category" class="form-input">
                    <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>生产厂家</label>
                  <input v-model="form.manufacturer" type="text" placeholder="请输入生产厂家" class="form-input" />
                </div>
                <div class="form-group">
                  <label>批准文号</label>
                  <input v-model="form.approvalNumber" type="text" placeholder="国药准字..." class="form-input" />
                </div>
                <div class="form-group">
                  <label>价格 (¥)</label>
                  <input v-model="form.price" type="number" step="0.01" placeholder="0.00" class="form-input" />
                </div>
                <div class="form-group">
                  <label>库存</label>
                  <input v-model="form.stock" type="number" placeholder="0" class="form-input" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-ghost" @click="showModal = false">取消</button>
              <button class="btn btn-primary" @click="saveDrug">保存</button>
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
import { generateDrugs } from '../utils/mock'

const drugs = ref(generateDrugs())
const searchQuery = ref('')
const categoryFilter = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const showModal = ref(false)
const editingDrug = ref(null)

const categories = ['处方药', 'OTC药品', '保健品', '中成药', '西药', '医疗器械']

const form = ref({ name: '', category: '处方药', manufacturer: '', approvalNumber: '', price: '', stock: '' })

const summary = computed(() => [
  { label: '药品总数', value: drugs.value.length, color: '#0A6E5D' },
  { label: '在售药品', value: drugs.value.filter(d => d.status === '在售').length, color: '#10B981' },
  { label: '低库存', value: drugs.value.filter(d => d.stock < 200).length, color: '#F59E0B' },
  { label: '已下架', value: drugs.value.filter(d => d.status === '下架').length, color: '#EF4444' }
])

const columns = [
  { key: 'id', label: '编号', width: '110px' },
  { key: 'name', label: '药品名称' },
  { key: 'category', label: '分类', width: '100px' },
  { key: 'manufacturer', label: '生产厂家' },
  { key: 'price', label: '价格', width: '100px' },
  { key: 'stock', label: '库存', width: '140px' },
  { key: 'status', label: '状态', width: '80px' },
  { key: 'actions', label: '操作', width: '100px' }
]

const filteredDrugs = computed(() => {
  return drugs.value.filter(d => {
    if (searchQuery.value && !d.name.includes(searchQuery.value) && !d.approvalNumber.includes(searchQuery.value)) return false
    if (categoryFilter.value && d.category !== categoryFilter.value) return false
    if (statusFilter.value && d.status !== statusFilter.value) return false
    return true
  })
})

function editDrug(drug) {
  editingDrug.value = drug
  form.value = { ...drug }
  showModal.value = true
}

function deleteDrug(drug) {
  if (confirm(`确定删除「${drug.name}」吗？`)) {
    drugs.value = drugs.value.filter(d => d.id !== drug.id)
  }
}

function saveDrug() {
  if (editingDrug.value) {
    const idx = drugs.value.findIndex(d => d.id === editingDrug.value.id)
    if (idx !== -1) drugs.value[idx] = { ...drugs.value[idx], ...form.value }
  } else {
    drugs.value.unshift({
      ...form.value,
      id: `DRG-${String(drugs.value.length + 1).padStart(4, '0')}`,
      status: '在售',
      createdAt: new Date().toISOString().slice(0, 10)
    })
  }
  showModal.value = false
  editingDrug.value = null
  form.value = { name: '', category: '处方药', manufacturer: '', approvalNumber: '', price: '', stock: '' }
}
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 20px; }

.summary-row {
  display: flex;
  gap: 14px;
}
.mini-stat {
  flex: 1;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.mini-stat-value { font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 700; }
.mini-stat-label { font-size: 0.82rem; color: var(--text-tertiary); }

.drug-name { font-weight: 600; color: var(--text-primary); }
.price { font-weight: 600; color: var(--primary); }

.stock-bar-wrap {
  display: inline-block;
  width: 60px;
  height: 6px;
  background: var(--bg-root);
  border-radius: 3px;
  overflow: hidden;
  vertical-align: middle;
  margin-right: 8px;
}
.stock-bar { height: 100%; background: var(--primary); border-radius: 3px; transition: width 0.4s; }
.stock-bar.low { background: var(--warning); }
.stock-num { font-size: 0.82rem; color: var(--text-secondary); }

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: 0.78rem;
  font-weight: 500;
}
.status-badge.active { background: rgba(16,185,129,0.1); color: #059669; }
.status-badge.inactive { background: rgba(239,68,68,0.1); color: #DC2626; }

.action-btns { display: flex; gap: 6px; }
.icon-btn {
  width: 30px; height: 30px;
  border: none; border-radius: 6px;
  background: transparent;
  color: var(--text-tertiary);
  display: flex; align-items: center; justify-content: center;
  transition: all var(--duration-fast);
}
.icon-btn:hover { background: var(--bg-root); color: var(--primary); }
.icon-btn.danger:hover { background: rgba(239,68,68,0.08); color: var(--danger); }
.icon-btn svg { width: 16px; height: 16px; }

/* Shared UI */
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: var(--radius-sm);
  font-size: 0.85rem; font-weight: 500; border: none;
  transition: all var(--duration-fast);
}
.btn-primary { background: var(--primary); color: #fff; }
.btn-primary:hover { background: var(--primary-dark); box-shadow: 0 4px 12px rgba(10,110,93,0.25); }
.btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text-secondary); }
.btn-outline:hover { border-color: var(--primary); color: var(--primary); }
.btn-ghost { background: transparent; color: var(--text-secondary); }
.btn-ghost:hover { background: var(--bg-root); }

.filter-group { flex: 1; min-width: 200px; }
.filter-input {
  width: 100%; padding: 8px 14px;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  font-size: 0.85rem; outline: none; background: var(--bg-card);
  transition: border-color var(--duration-fast);
}
.filter-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-ghost); }
.filter-select {
  padding: 8px 30px 8px 14px;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  font-size: 0.85rem; outline: none; background: var(--bg-card);
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%239CA3AF'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 10px center; background-size: 16px;
  cursor: pointer;
}
.filter-select:focus { border-color: var(--primary); }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
}
.modal {
  background: var(--bg-card); border-radius: var(--radius-xl);
  width: 580px; max-height: 85vh; overflow: auto;
  box-shadow: var(--shadow-xl);
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px; border-bottom: 1px solid var(--border-light);
}
.modal-header h3 { font-size: 1.1rem; font-weight: 600; }
.modal-close {
  width: 32px; height: 32px; border: none; background: var(--bg-root);
  border-radius: 8px; font-size: 1.2rem; color: var(--text-tertiary);
  display: flex; align-items: center; justify-content: center;
  transition: all var(--duration-fast);
}
.modal-close:hover { background: var(--danger); color: #fff; }
.modal-body { padding: 24px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); }
.form-input {
  padding: 9px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm);
  font-size: 0.88rem; outline: none; background: var(--bg-card);
  transition: border-color var(--duration-fast);
}
.form-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-ghost); }
.modal-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 16px 24px; border-top: 1px solid var(--border-light);
}

.modal-enter-active { transition: all 0.25s var(--ease-spring); }
.modal-leave-active { transition: all 0.2s var(--ease-out); }
.modal-enter-from { opacity: 0; }
.modal-leave-to { opacity: 0; }
.modal-enter-from .modal { transform: scale(0.92) translateY(16px); }
.modal-leave-to .modal { transform: scale(0.96); }
</style>
