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
      :show-pagination="false"
    >
      <template #actions>
        <button class="btn btn-primary" @click="openAdd">
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/></svg>
          添加商品
        </button>
      </template>

      <template #filters>
        <input v-model="searchQuery" type="text" placeholder="搜索商品名称..." class="filter-input" />
        <select v-model="statusFilter" class="filter-select">
          <option value="">全部状态</option>
          <option value="on">上架</option>
          <option value="off">下架</option>
        </select>
      </template>

      <template #cell-name="{ row }">
        <div class="product-cell">
          <div class="product-avatar" :style="{ background: getAvatarColor(row.name) }">{{ (row.name || '?')[0] }}</div>
          <span class="product-name">{{ row.name }}</span>
        </div>
      </template>

      <template #cell-pointsPrice="{ row }">
        <span class="points-tag">{{ row.pointsPrice }} 积分</span>
      </template>

      <template #cell-status="{ row }">
        <span class="status-badge" :class="row.status === 'on' ? 'active' : 'inactive'">{{ row.status === 'on' ? '上架' : '下架' }}</span>
      </template>

      <template #cell-actions="{ row }">
        <div class="action-btns">
          <button class="icon-btn" title="编辑" @click="openEdit(row)">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
          </button>
          <button class="icon-btn danger" title="删除" @click="deleteProduct(row)">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9z" clip-rule="evenodd"/></svg>
          </button>
        </div>
      </template>
    </DataTable>

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
                <div class="form-group full">
                  <label>商品描述</label>
                  <input v-model="form.description" type="text" placeholder="请输入商品描述" class="form-input" />
                </div>
                <div class="form-group">
                  <label>分类</label>
                  <input v-model="form.category" type="text" placeholder="如：保健品" class="form-input" />
                </div>
                <div class="form-group">
                  <label>积分价</label>
                  <input v-model.number="form.pointsPrice" type="number" class="form-input" />
                </div>
                <div class="form-group">
                  <label>库存</label>
                  <input v-model.number="form.stock" type="number" class="form-input" />
                </div>
                <div class="form-group">
                  <label>状态</label>
                  <select v-model="form.status" class="form-input">
                    <option value="on">上架</option>
                    <option value="off">下架</option>
                  </select>
                </div>
                <div class="form-group full">
                  <label>封面图URL</label>
                  <input v-model="form.coverUrl" type="text" placeholder="图片链接" class="form-input" />
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
import { ref, computed, onMounted } from 'vue'
import DataTable from '../components/DataTable.vue'
import { get, post, del } from '@/utils/request'

const products = ref([])
const searchQuery = ref('')
const statusFilter = ref('')
const showModal = ref(false)
const editingProduct = ref(null)
const form = ref({ name: '', description: '', category: '', pointsPrice: 0, stock: 0, status: 'on', coverUrl: '' })

const summary = computed(() => [
  { label: '商品总数', value: products.value.length, color: '#0A6E5D' },
  { label: '上架商品', value: products.value.filter(p => p.status === 'on').length, color: '#10B981' },
  { label: '下架商品', value: products.value.filter(p => p.status === 'off').length, color: '#EF4444' },
  { label: '低库存', value: products.value.filter(p => p.stock < 10).length, color: '#F59E0B' }
])

const columns = [
  { key: 'productId', label: '编号', width: '120px' },
  { key: 'name', label: '商品名称' },
  { key: 'category', label: '分类', width: '100px' },
  { key: 'pointsPrice', label: '积分价', width: '110px' },
  { key: 'stock', label: '库存', width: '80px' },
  { key: 'status', label: '状态', width: '80px' },
  { key: 'actions', label: '操作', width: '100px' }
]

const filteredProducts = computed(() =>
  products.value.filter(p => {
    if (searchQuery.value && !(p.name || '').includes(searchQuery.value)) return false
    if (statusFilter.value && p.status !== statusFilter.value) return false
    return true
  })
)

function getAvatarColor(name) {
  const colors = ['#0A6E5D', '#3B82F6', '#E8A838', '#8B5CF6', '#EF4444', '#10B981']
  return colors[(name || '').charCodeAt(0) % colors.length] + '18'
}

function openAdd() {
  editingProduct.value = null
  form.value = { name: '', description: '', category: '', pointsPrice: 0, stock: 0, status: 'on', coverUrl: '' }
  showModal.value = true
}
function openEdit(row) {
  editingProduct.value = row
  form.value = { ...row }
  showModal.value = true
}

async function loadProducts() {
  try {
    products.value = await get('/admin/products')
  } catch (e) {
    console.error('加载商品失败:', e)
  }
}

async function saveProduct() {
  try {
    const body = { ...form.value }
    if (editingProduct.value) {
      body.productId = editingProduct.value.productId
    }
    await post('/admin/products', body)
    showModal.value = false
    await loadProducts()
  } catch (e) {
    alert('保存失败: ' + (e.message || '未知错误'))
  }
}

async function deleteProduct(row) {
  if (!confirm(`确定删除「${row.name}」？`)) return
  try {
    await del(`/admin/products/${row.productId}`)
    await loadProducts()
  } catch (e) {
    alert('删除失败: ' + (e.message || '未知错误'))
  }
}

onMounted(loadProducts)
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
.points-tag { display: inline-block; padding: 2px 8px; background: rgba(232,168,56,0.1); color: #D97706; border-radius: var(--radius-full); font-size: 0.78rem; font-weight: 500; }

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
