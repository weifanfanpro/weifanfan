<template>
  <header class="header">
    <div class="header-left">
      <h1 class="page-title">{{ $route.meta.title }}</h1>
      <span class="page-breadcrumb">首页 / {{ $route.meta.title }}</span>
    </div>
    <div class="header-right">
      <div class="header-divider"></div>
      <div class="header-user" @click="showDropdown = !showDropdown">
        <div class="user-avatar">{{ (appStore.username || 'A')[0] }}</div>
        <div class="user-info">
          <span class="user-name">{{ appStore.username }}</span>
          <span class="user-role">{{ roleLabel }}</span>
        </div>
        <svg class="chevron" :class="{ open: showDropdown }" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
        <transition name="dropdown">
          <div v-if="showDropdown" class="user-dropdown">
            <a class="dropdown-item danger" @click.prevent="handleLogout">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd"/></svg>
              退出登录
            </a>
          </div>
        </transition>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'

const router = useRouter()
const appStore = useAppStore()
const showDropdown = ref(false)

const roleLabel = computed(() => {
  const map = { ROLE_SUPER_ADMIN: '超级管理员', ROLE_OPERATOR: '运营管理员', ROLE_CS: '客服管理员', ROLE_TECH: '技术管理员', ROLE_FINANCE: '财务管理员' }
  return map[appStore.role] || '管理员'
})

function handleLogout() {
  appStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.header {
  height: 64px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  position: sticky;
  top: 0;
  z-index: 50;
}
.header-left { display: flex; flex-direction: column; gap: 1px; }
.page-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-primary);
}
.page-breadcrumb {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-divider {
  width: 1px;
  height: 24px;
  background: var(--border);
  margin: 0 4px;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--duration-fast);
  position: relative;
}
.header-user:hover { background: var(--bg-root); }

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 600;
}
.user-info { display: flex; flex-direction: column; gap: 0; }
.user-name { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); line-height: 1.2; }
.user-role { font-size: 0.7rem; color: var(--text-tertiary); }
.chevron {
  width: 16px;
  height: 16px;
  color: var(--text-tertiary);
  transition: transform var(--duration-fast);
}
.chevron.open { transform: rotate(180deg); }

.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 160px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-light);
  padding: 6px;
  z-index: 200;
}
.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  color: var(--text-secondary);
  transition: all var(--duration-fast);
  cursor: pointer;
}
.dropdown-item:hover { background: var(--bg-root); color: var(--text-primary); }
.dropdown-item svg { width: 16px; height: 16px; }
.dropdown-item.danger { color: var(--danger); }
.dropdown-item.danger:hover { background: rgba(239,68,68,0.06); }

.dropdown-enter-active { transition: all 0.2s var(--ease-spring); }
.dropdown-leave-active { transition: all 0.15s var(--ease-out); }
.dropdown-enter-from { opacity: 0; transform: translateY(-8px) scale(0.95); }
.dropdown-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
