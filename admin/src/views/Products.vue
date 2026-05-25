<template>
  <div class="page-container">
    <div class="summary-row stagger-in">
      <div class="mini-stat" v-for="s in summary" :key="s.label">
        <span class="mini-stat-value" :style="{ color: s.color }">{{ s.value }}</span>
        <span class="mini-stat-label">{{ s.label }}</span>
      </div>
    </div>

    <DataTable
      title="商品管理"
      subtitle="管理积分商城商品"
      :columns="columns"
      :data="filteredProducts"
      :current-page="currentPage"
      :page-size="10"
    >
      <template #actions>
        <button class="btn btn-primary" @click="showModal = true">
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/></svg>
          添加商品
        </button>
        <button class="btn btn-outline">导出数据</button>
      </template>

      <template #filters>
        <input v-model="searchQuery" type="text" placeholder="搜索商品名称..." class="filter-input" />
        <select v-model="categoryFilter" class="filter-select">
          <option value="">全部分类</option>
          <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
        </select>
        <select v-model="statusFilter" class="filter-select">
          <option value="">全部状态</option>
          <option value="在售">在售</option>
          <option value="下架">下架</option>
          <option value="预售">预售</option>
        </select>
      </template>

      <template #cell-name="{ row }">
        <div class="product-cell">
          <div class="product-avatar" :style="{ background: getAvatarColor(row.name) }">{{ row.name[0] }}</div>
          <span class="product-name">{{ row.name }}</span>
        </div>
      </template>

      <template #cell-price="{ row }">
        <div class="price-col">
          <span class="price-current">¥{{ row.price }}</span>
          <span class="price-original">¥{{ row.originalPrice }}</span>
        </div>
      </template>

      <template #cell-pointsPrice="{ row }">
        <span class="points-tag">{{ row.pointsPrice }} 积分</span>
      </template>

      <template #cell-sales="{ row }">
        <span class="sales-num">{{ row.sales.toLocaleString() }}</span>
      </template>

      <template #cell-rating="{ row }">
        <div class="rating-cell">
          <svg viewBox="0 0 20 20" fill="#E8A838" width="14" height="14"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <span>{{ row.rating }}</span>
        </div>
      </template>

      <template #cell-status="{ row }">
        <span class="status-badge" :class="statusClass(row.status)">{{ row.status }}</span>
      </template>

      <template #cell-actions="{ row }">
        <div class="action-btns">
          <button class="icon-btn" title="编辑" @click="editProduct(row)">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
          </button>
          <button class="icon-btn danger" title="删除" @click="deleteProduct(row)">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9z" clip-rule="evenodd"/></svg>
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
              <h3>{{ editingProduct ? '编辑商品' : '添加商品' }}</h3>
              <button class="modal-close" @click="showModal = false">×</button>
            </div>
            <div class="modal-body">
              <div class="form-grid">
                <div class="form-group full">
                  <label>商品名称</label>
                  <input v-model="form.name" type="text" placeholder="请输入商品名称" class="form-input" />
                </div>
                <div class="form-group">
                  <label>分类</label>
                  <select v-model="form.category" class="form-input">
                    <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>售价 (¥)</label>
                  <input v-model="form.price" type="number" step="0.01" class="form-input" />
                </div>
                <div class="form-group">
                  <label>原价 (¥)</label>
                  <input v-model="form.originalPrice" type="number" step="0.01" class="form-input" />
                </div>
                <div class="form-group">
                  <label>积分价</label>
                  <input v-model="form.pointsPrice" type="number" class="form-input" />
                </div>
                <div class="form-group">
                  <label>库存</label>
                  <input v-model="form.stock" type="number" class="form-input" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-ghost" @click="showModal = false">取消</button>
              <button class="btn btn-primary" @click="saveProduct">保存</button>
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
import { generateProducts } from '../utils/mock'

const products = ref(generateProducts())
const searchQuery = ref('')
const categoryFilter = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const showModal = ref(false)
const editingProduct = ref(null)

const categories = ['西药', '中成药', '保健品', '医疗器械', '营养补充', '个人护理']
const form = ref({ name: '', category: '西药', price: '', originalPrice: '', pointsPrice: '', stock: '' })

const summary = computed(() => [
  { label: '商品总数', value: products.value.length, color: '#0A6E5D' },
  { label: '在售商品', value: products.value.filter(p => p.status === '在售').length, color: '#10B981' },
  { label: '总销量', value: products.value.reduce((s, p) => s + p.sales, 0).toLocaleString(), color: '#E8A838' },
  { label: '低库存', value: products.value.filter(p => p.stock < 100).length, color: '#EF4444' }
])

const columns = [
  { key: 'id', label: '编号', width: '110px' },
  { key: 'name', label: '商品名称' },
  { key: 'category', label: '分类', width: '100px' },
  { key: 'price', label: '价格', width: '120px' },
  { key: 'pointsPrice', label: '积分价', width: '110px' },
  { key: 'sales', label: '销量', width: '90px' },
  { key: 'rating', label: '评分', width: '80px' },
  { key: 'status', label: '状态', width: '80px' },
  { key: 'actions', label: '操作', width: '100px' }
]

const filteredProducts = computed(() =>
  products.value.filter(p => {
    if (searchQuery.value && !p.name.includes(searchQuery.value)) return false
    if (categoryFilter.value && p.category !== categoryFilter.value) return false
    if (statusFilter.value && p.status !== statusFilter.value) return false
    return true
  })
)

function statusClass(s) { return { '在售': 'active', '下架': 'inactive', '预售': 'presale' }[s] || '' }
function getAvatarColor(name) {
  const colors = ['#0A6E5D', '#3B82F6', '#E8A838', '#8B5CF6', '#EF4444', '#10B981']
  return colors[name.charCodeAt(0) % colors.length] + '18'
}

function editProduct(p) {
  editingProduct.value = p
  form.value = { ...p }
  showModal.value = true
}
function deleteProduct(p) {
  if (confirm(`确定删除「${p.name}」？`)) products.value = products.value.filter(x => x.id !== p.id)
}
function saveProduct() {
  if (editingProduct.value) {
    const idx = products.value.findIndex(p => p.id === editingProduct.value.id)
    if (idx !== -1) products.value[idx] = { ...products.value[idx], ...form.value }
  } else {
    products.value.unshift({ ...form.value, id: `PRD-${String(products.value.length + 1).padStart(4, '0')}`, sales: 0, rating: '5.0', status: '在售', createdAt: new Date().toISOString().slice(0, 10) })
  }
  showModal.value = false; editingProduct.value = null
  form.value = { name: '', category: '西药', price: '', originalPrice: '', pointsPrice: '', stock: '' }
}
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 20px; }
.summary-row { display: flex; gap: 14px; }
.mini-stat { flex: 1; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 16px 20px; display: flex; flex-direction: column; gap: 2px; }
.mini-stat-value { font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 700; }
.mini-stat-label { font-size: 0.82rem; color: var(--text-tertiary); }

.product-cell { display: flex; align-items: center; gap: 10px; }
.product-avatar { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.88rem; color: var(--text-primary); flex-shrink: 0; }
.product-name { font-weight: 600; color: var(--text-primary); }

.price-col { display: flex; flex-direction: column; gap: 2px; }
.price-current { font-weight: 600; color: var(--primary); }
.price-original { font-size: 0.78rem; color: var(--text-tertiary); text-decoration: line-through; }
.points-tag { display: inline-block; padding: 2px 8px; background: rgba(232,168,56,0.1); color: #D97706; border-radius: var(--radius-full); font-size: 0.78rem; font-weight: 500; }
.sales-num { font-weight: 500; color: var(--text-primary); }
.rating-cell { display: flex; align-items: center; gap: 4px; font-size: 0.88rem; font-weight: 500; color: var(--text-primary); }

.status-badge { display: inline-block; padding: 3px 10px; border-radius: var(--radius-full); font-size: 0.78rem; font-weight: 500; }
.status-badge.active { background: rgba(16,185,129,0.1); color: #059669; }
.status-badge.inactive { background: rgba(239,68,68,0.1); color: #DC2626; }
.status-badge.presale { background: rgba(59,130,246,0.1); color: #2563EB; }

.action-btns { display: flex; gap: 6px; }
.icon-btn { width: 30px; height: 30px; border: none; border-radius: 6px; background: transparent; color: var(--text-tertiary); display: flex; align-items: center; justify-content: center; transition: all var(--duration-fast); }
.icon-btn:hover { background: var(--bg-root); color: var(--primary); }
.icon-btn.danger:hover { background: rgba(239,68,68,0.08); color: var(--danger); }
.icon-btn svg { width: 16px; height: 16px; }

.btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 500; border: none; transition: all var(--duration-fast); }
.btn-primary { background: var(--primary); color: #fff; }
.btn-primary:hover { background: var(--primary-dark); box-shadow: 0 4px 12px rgba(10,110,93,0.25); }
.btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text-secondary); }
.btn-outline:hover { border-color: var(--primary); color: var(--primary); }
.btn-ghost { background: transparent; color: var(--text-secondary); }
.btn-ghost:hover { background: var(--bg-root); }

.filter-input { padding: 8px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.85rem; outline: none; background: var(--bg-card); min-width: 200px; transition: border-color var(--duration-fast); }
.filter-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-ghost); }
.filter-select { padding: 8px 30px 8px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.85rem; outline: none; background: var(--bg-card); appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%239CA3AF'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; background-size: 16px; cursor: pointer; }
.filter-select:focus { border-color: var(--primary); }

.modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; }
.modal { background: var(--bg-card); border-radius: var(--radius-xl); width: 560px; max-height: 85vh; overflow: auto; box-shadow: var(--shadow-xl); }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--border-light); }
.modal-header h3 { font-size: 1.1rem; font-weight: 600; }
.modal-close { width: 32px; height: 32px; border: none; background: var(--bg-root); border-radius: 8px; font-size: 1.2rem; color: var(--text-tertiary); display: flex; align-items: center; justify-content: center; transition: all var(--duration-fast); }
.modal-close:hover { background: var(--danger); color: #fff; }
.modal-body { padding: 24px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group.full { grid-column: 1 / -1; }
.form-group label { font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); }
.form-input { padding: 9px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.88rem; outline: none; background: var(--bg-card); transition: border-color var(--duration-fast); }
.form-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-ghost); }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid var(--border-light); }

.modal-enter-active { transition: all 0.25s var(--ease-spring); }
.modal-leave-active { transition: all 0.2s var(--ease-out); }
.modal-enter-from { opacity: 0; }
.modal-leave-to { opacity: 0; }
.modal-enter-from .modal { transform: scale(0.92) translateY(16px); }
.modal-leave-to .modal { transform: scale(0.96); }
</style>
