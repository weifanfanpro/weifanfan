<template>
  <div class="data-table-wrapper">
    <div class="table-header" v-if="title || $slots.actions">
      <div class="table-title-area">
        <h3 class="table-title" v-if="title">{{ title }}</h3>
        <span class="table-subtitle" v-if="subtitle">{{ subtitle }}</span>
      </div>
      <div class="table-actions">
        <slot name="actions" />
      </div>
    </div>

    <div class="table-filters" v-if="$slots.filters">
      <slot name="filters" />
    </div>

    <div class="table-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.key" :style="col.width ? { width: col.width } : {}">
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in data" :key="row.id || i" class="table-row">
            <td v-for="col in columns" :key="col.key">
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                <span :class="getCellClass(col, row[col.key])">{{ row[col.key] }}</span>
              </slot>
            </td>
          </tr>
          <tr v-if="!data.length">
            <td :colspan="columns.length" class="empty-cell">
              <div class="empty-state">
                <svg viewBox="0 0 48 48" fill="none" class="empty-icon"><circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/><path d="M18 24h12M24 18v12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                <p>暂无数据</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="table-footer" v-if="showPagination">
      <span class="pagination-info">共 {{ total || data.length }} 条记录</span>
      <div class="pagination">
        <button class="page-btn" :disabled="currentPage <= 1" @click="$emit('page-change', currentPage - 1)">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
        </button>
        <button
          v-for="p in displayedPages"
          :key="p"
          class="page-btn"
          :class="{ active: p === currentPage }"
          @click="$emit('page-change', p)"
        >{{ p }}</button>
        <button class="page-btn" :disabled="currentPage >= totalPages" @click="$emit('page-change', currentPage + 1)">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: String,
  subtitle: String,
  columns: { type: Array, required: true },
  data: { type: Array, required: true },
  showPagination: { type: Boolean, default: true },
  currentPage: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  total: Number
})

defineEmits(['page-change'])

const totalPages = computed(() => Math.ceil((props.total || props.data.length) / props.pageSize))
const displayedPages = computed(() => {
  const pages = []
  const start = Math.max(1, props.currentPage - 2)
  const end = Math.min(totalPages.value, start + 4)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

function getCellClass(col, value) {
  if (col.statusMap) return `status-tag ${col.statusMap[value] || ''}`
  return ''
}
</script>

<style scoped>
.data-table-wrapper {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  overflow: hidden;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
}
.table-title { font-size: 1rem; font-weight: 600; }
.table-subtitle { font-size: 0.8rem; color: var(--text-tertiary); margin-top: 2px; }
.table-actions { display: flex; gap: 8px; }

.table-filters {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.table-scroll { overflow-x: auto; }

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}
.data-table thead { background: var(--bg-root); }
.data-table th {
  padding: 12px 20px;
  text-align: left;
  font-weight: 600;
  font-size: 0.78rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}
.data-table td {
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-light);
  color: var(--text-secondary);
}
.table-row { transition: background var(--duration-fast); }
.table-row:hover { background: var(--primary-ghost); }
.table-row:last-child td { border-bottom: none; }

.status-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: 0.78rem;
  font-weight: 500;
}
.status-tag.success { background: rgba(16,185,129,0.1); color: #059669; }
.status-tag.warning { background: rgba(245,158,11,0.1); color: #D97706; }
.status-tag.danger { background: rgba(239,68,68,0.1); color: #DC2626; }
.status-tag.info { background: rgba(59,130,246,0.1); color: #2563EB; }
.status-tag.default { background: var(--bg-root); color: var(--text-secondary); }

.empty-cell { padding: 48px 20px !important; }
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--text-tertiary);
}
.empty-icon { width: 48px; height: 48px; }
.empty-state p { font-size: 0.9rem; }

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-top: 1px solid var(--border-light);
}
.pagination-info { font-size: 0.82rem; color: var(--text-tertiary); }
.pagination { display: flex; gap: 4px; }
.page-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
  color: var(--text-secondary);
  transition: all var(--duration-fast);
}
.page-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
.page-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-btn svg { width: 16px; height: 16px; }
</style>
