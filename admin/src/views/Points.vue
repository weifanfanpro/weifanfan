<template>
  <div class="page-container">
    <!-- Summary -->
    <div class="summary-row stagger-in">
      <div class="mini-stat" v-for="s in summary" :key="s.label">
        <span class="mini-stat-value" :style="{ color: s.color }">{{ s.value }}</span>
        <span class="mini-stat-label">{{ s.label }}</span>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs-card">
      <div class="tabs-header">
        <button v-for="tab in tabs" :key="tab.key" class="tab-btn" :class="{ active: activeTab === tab.key }" @click="activeTab = tab.key">
          {{ tab.label }}
        </button>
      </div>

      <!-- Records Tab -->
      <div v-if="activeTab === 'records'" class="tab-content">
        <DataTable :columns="recordColumns" :data="records" :show-pagination="true">
          <template #filters>
            <input type="text" placeholder="搜索用户..." class="filter-input" />
            <select class="filter-select">
              <option value="">全部类型</option>
              <option v-for="t in pointTypes" :key="t" :value="t">{{ t }}</option>
            </select>
          </template>
          <template #cell-amount="{ value }">
            <span :class="['points-amount', value > 0 ? 'positive' : 'negative']">
              {{ value > 0 ? '+' : '' }}{{ value }}
            </span>
          </template>
          <template #cell-type="{ value }">
            <span class="type-tag" :class="typeClass(value)">{{ value }}</span>
          </template>
        </DataTable>
      </div>

      <!-- Rules Tab -->
      <div v-if="activeTab === 'rules'" class="tab-content">
        <div class="rules-grid stagger-in">
          <div v-for="rule in rules" :key="rule.id" class="rule-card">
            <div class="rule-icon" :style="{ background: rule.color + '15', color: rule.color }">
              <span v-html="rule.icon"></span>
            </div>
            <div class="rule-info">
              <h4>{{ rule.name }}</h4>
              <p>{{ rule.description }}</p>
            </div>
            <div class="rule-value">
              <span class="rule-points">+{{ rule.points }}</span>
              <span class="rule-unit">积分</span>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="rule.enabled" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- Config Tab -->
      <div v-if="activeTab === 'config'" class="tab-content">
        <div class="config-form stagger-in">
          <div class="config-section">
            <h4>基础配置</h4>
            <div class="config-grid">
              <div class="config-item">
                <label>积分有效期（天）</label>
                <input type="number" value="365" class="form-input" />
                <span class="config-hint">积分自获得之日起有效期</span>
              </div>
              <div class="config-item">
                <label>最低兑换积分</label>
                <input type="number" value="100" class="form-input" />
                <span class="config-hint">用户兑换商品最低积分要求</span>
              </div>
              <div class="config-item">
                <label>每日签到积分</label>
                <input type="number" value="10" class="form-input" />
                <span class="config-hint">用户每日签到获得积分</span>
              </div>
              <div class="config-item">
                <label>连续签到奖励</label>
                <input type="number" value="50" class="form-input" />
                <span class="config-hint">连续签到7天额外奖励</span>
              </div>
            </div>
          </div>
          <div class="config-section">
            <h4>购物返积分</h4>
            <div class="config-grid">
              <div class="config-item">
                <label>返积分比例 (%)</label>
                <input type="number" value="1" step="0.1" class="form-input" />
                <span class="config-hint">每消费1元获得积分数</span>
              </div>
              <div class="config-item">
                <label>VIP加倍系数</label>
                <input type="number" value="2" step="0.5" class="form-input" />
                <span class="config-hint">VIP用户积分倍率</span>
              </div>
            </div>
          </div>
          <div class="config-actions">
            <button class="btn btn-primary">保存配置</button>
            <button class="btn btn-ghost">重置默认</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import DataTable from '../components/DataTable.vue'
import { generatePointsRecords } from '../utils/mock'

const activeTab = ref('records')
const records = ref(generatePointsRecords())
const pointTypes = ['签到奖励', '购物返积分', '活动奖励', '积分兑换', '积分过期', '管理员调整']

const tabs = [
  { key: 'records', label: '积分流水' },
  { key: 'rules', label: '积分规则' },
  { key: 'config', label: '参数配置' }
]

const summary = [
  { label: '总发放积分', value: '524,300', color: '#0A6E5D' },
  { label: '已兑换积分', value: '186,200', color: '#E8A838' },
  { label: '待发放积分', value: '32,800', color: '#3B82F6' },
  { label: '活跃积分用户', value: '8,432', color: '#8B5CF6' }
]

const recordColumns = [
  { key: 'id', label: '流水号', width: '120px' },
  { key: 'user', label: '用户', width: '80px' },
  { key: 'type', label: '类型', width: '120px' },
  { key: 'amount', label: '积分变动', width: '110px' },
  { key: 'balance', label: '余额', width: '100px' },
  { key: 'description', label: '描述' },
  { key: 'createdAt', label: '时间', width: '150px' }
]

const rules = [
  { id: 1, name: '每日签到', description: '用户每日签到获得积分', points: 10, color: '#0A6E5D', enabled: true, icon: '<svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>' },
  { id: 2, name: '购物返积分', description: '每消费1元获得1积分', points: 1, color: '#E8A838', enabled: true, icon: '<svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z"/><path id="innerCircle" d="M16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/></svg>' },
  { id: 3, name: '连续签到奖励', description: '连续签到7天额外奖励', points: 50, color: '#3B82F6', enabled: true, icon: '<svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clip-rule="evenodd"/></svg>' },
  { id: 4, name: '邀请好友', description: '成功邀请新用户注册', points: 100, color: '#8B5CF6', enabled: true, icon: '<svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/></svg>' },
  { id: 5, name: '评价奖励', description: '完成订单评价获得积分', points: 20, color: '#10B981', enabled: false, icon: '<svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>' },
  { id: 6, name: '分享商品', description: '分享商品到社交平台', points: 5, color: '#F59E0B', enabled: true, icon: '<svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/></svg>' }
]

function typeClass(t) {
  const map = { '签到奖励': 'green', '购物返积分': 'blue', '活动奖励': 'purple', '积分兑换': 'orange', '积分过期': 'red', '管理员调整': 'gray' }
  return map[t] || ''
}
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 20px; }
.summary-row { display: flex; gap: 14px; }
.mini-stat { flex: 1; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 16px 20px; display: flex; flex-direction: column; gap: 2px; }
.mini-stat-value { font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 700; }
.mini-stat-label { font-size: 0.82rem; color: var(--text-tertiary); }

.tabs-card { background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-light); overflow: hidden; }
.tabs-header { display: flex; border-bottom: 1px solid var(--border-light); padding: 0 24px; }
.tab-btn { padding: 14px 20px; border: none; background: transparent; font-size: 0.9rem; font-weight: 500; color: var(--text-tertiary); position: relative; transition: color var(--duration-fast); }
.tab-btn:hover { color: var(--text-primary); }
.tab-btn.active { color: var(--primary); }
.tab-btn.active::after { content: ''; position: absolute; bottom: 0; left: 20px; right: 20px; height: 2px; background: var(--primary); border-radius: 2px 2px 0 0; }
.tab-content { padding: 0; }

.points-amount { font-weight: 600; font-family: 'Outfit', sans-serif; }
.points-amount.positive { color: #059669; }
.points-amount.negative { color: #DC2626; }

.type-tag { display: inline-block; padding: 3px 10px; border-radius: var(--radius-full); font-size: 0.78rem; font-weight: 500; background: var(--bg-root); color: var(--text-secondary); }
.type-tag.green { background: rgba(16,185,129,0.1); color: #059669; }
.type-tag.blue { background: rgba(59,130,246,0.1); color: #2563EB; }
.type-tag.purple { background: rgba(139,92,246,0.1); color: #7C3AED; }
.type-tag.orange { background: rgba(245,158,11,0.1); color: #D97706; }
.type-tag.red { background: rgba(239,68,68,0.1); color: #DC2626; }
.type-tag.gray { background: var(--bg-root); color: var(--text-secondary); }

.rules-grid { padding: 24px; display: flex; flex-direction: column; gap: 12px; }
.rule-card { display: flex; align-items: center; gap: 16px; padding: 16px 20px; border: 1px solid var(--border-light); border-radius: var(--radius-md); transition: all var(--duration-fast); }
.rule-card:hover { border-color: var(--primary-glow); box-shadow: var(--shadow-sm); }
.rule-icon { width: 44px; height: 44px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.rule-info { flex: 1; }
.rule-info h4 { font-size: 0.95rem; font-weight: 600; margin-bottom: 2px; }
.rule-info p { font-size: 0.82rem; color: var(--text-tertiary); }
.rule-value { text-align: right; margin-right: 16px; }
.rule-points { font-family: 'Outfit', sans-serif; font-size: 1.3rem; font-weight: 700; color: var(--primary); }
.rule-unit { font-size: 0.78rem; color: var(--text-tertiary); margin-left: 2px; }

.toggle { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle-slider { position: absolute; cursor: pointer; inset: 0; background: var(--border); border-radius: 12px; transition: 0.2s; }
.toggle-slider::before { content: ''; position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: 0.2s; }
.toggle input:checked + .toggle-slider { background: var(--primary); }
.toggle input:checked + .toggle-slider::before { transform: translateX(20px); }

.config-form { padding: 24px; }
.config-section { margin-bottom: 28px; }
.config-section h4 { font-size: 1rem; font-weight: 600; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid var(--border-light); }
.config-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.config-item { display: flex; flex-direction: column; gap: 6px; }
.config-item label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }
.config-hint { font-size: 0.78rem; color: var(--text-tertiary); }
.config-actions { display: flex; gap: 10px; padding-top: 20px; border-top: 1px solid var(--border-light); }

.btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 500; border: none; transition: all var(--duration-fast); }
.btn-primary { background: var(--primary); color: #fff; }
.btn-primary:hover { background: var(--primary-dark); }
.btn-ghost { background: transparent; color: var(--text-secondary); }
.btn-ghost:hover { background: var(--bg-root); }
.form-input { padding: 9px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.88rem; outline: none; background: var(--bg-card); transition: border-color var(--duration-fast); }
.form-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-ghost); }

.filter-input { padding: 8px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.85rem; outline: none; background: var(--bg-card); min-width: 200px; transition: border-color var(--duration-fast); }
.filter-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-ghost); }
.filter-select { padding: 8px 30px 8px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.85rem; outline: none; background: var(--bg-card); appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%239CA3AF'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; background-size: 16px; cursor: pointer; }
</style>
