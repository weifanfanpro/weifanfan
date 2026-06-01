<template>
  <div class="page-container">
    <div class="adjust-card">
      <h3>积分调整</h3>
      <p class="card-desc">手动调整用户积分（增加或扣除）</p>
      <form class="adjust-form" @submit.prevent="submitAdjust">
        <div class="form-group">
          <label>用户 OpenID</label>
          <input v-model="form.openid" type="text" placeholder="请输入用户的 OpenID" class="form-input" />
        </div>
        <div class="form-group">
          <label>积分值</label>
          <input v-model.number="form.points" type="number" placeholder="正数增加，负数扣除" class="form-input" />
          <span class="form-hint">正数为增加积分，负数为扣除积分</span>
        </div>
        <div class="form-group">
          <label>调整原因</label>
          <input v-model="form.reason" type="text" placeholder="请输入调整原因" class="form-input" />
        </div>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? '提交中...' : '提交调整' }}
        </button>
      </form>
      <p v-if="message" class="msg" :class="messageType">{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { post } from '@/utils/request'

const form = reactive({ openid: '', points: 0, reason: '' })
const loading = ref(false)
const message = ref('')
const messageType = ref('')

async function submitAdjust() {
  if (!form.openid) { message.value = '请输入用户 OpenID'; messageType.value = 'error'; return }
  if (!form.points || form.points === 0) { message.value = '积分值不能为0'; messageType.value = 'error'; return }
  if (!form.reason) { message.value = '请输入调整原因'; messageType.value = 'error'; return }

  loading.value = true
  message.value = ''
  try {
    await post('/admin/points/adjust', { openid: form.openid, points: form.points, reason: form.reason })
    message.value = '积分调整成功'
    messageType.value = 'success'
    form.openid = ''
    form.points = 0
    form.reason = ''
  } catch (e) {
    message.value = '调整失败: ' + (e.message || '未知错误')
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 20px; }

.adjust-card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: 32px;
  max-width: 560px;
}
.adjust-card h3 { font-size: 1.2rem; font-weight: 600; margin-bottom: 4px; }
.card-desc { font-size: 0.85rem; color: var(--text-tertiary); margin-bottom: 24px; }

.adjust-form { display: flex; flex-direction: column; gap: 18px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }
.form-input { padding: 10px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.9rem; outline: none; background: var(--bg-card); transition: border-color var(--duration-fast); }
.form-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-ghost); }
.form-hint { font-size: 0.78rem; color: var(--text-tertiary); }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 20px; border-radius: var(--radius-sm); font-size: 0.9rem; font-weight: 500; border: none; transition: all var(--duration-fast); cursor: pointer; }
.btn-primary { background: var(--primary); color: #fff; }
.btn-primary:hover { background: var(--primary-dark); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.msg { margin-top: 12px; padding: 10px 14px; border-radius: var(--radius-sm); font-size: 0.85rem; }
.msg.success { background: rgba(16,185,129,0.1); color: #059669; }
.msg.error { background: rgba(239,68,68,0.1); color: #DC2626; }
</style>
