<template>
  <header class="header">
    <div class="header-left">
      <h1 class="page-title">{{ $route.meta.title }}</h1>
      <span class="page-breadcrumb">首页 / {{ $route.meta.title }}</span>
    </div>
    <div class="header-right">
      <div class="header-search">
        <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg>
        <input type="text" placeholder="搜索功能、数据..." class="search-input" />
      </div>
      <button class="header-btn" title="通知">
        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>
        <span class="badge-dot"></span>
      </button>
      <div class="header-divider"></div>
      <div class="header-user" @click="showDropdown = !showDropdown">
        <div class="user-avatar">管</div>
        <div class="user-info">
          <span class="user-name">管理员</span>
          <span class="user-role">超级管理员</span>
        </div>
        <svg class="chevron" :class="{ open: showDropdown }" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
        <transition name="dropdown">
          <div v-if="showDropdown" class="user-dropdown">
            <a href="#" class="dropdown-item">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
              个人设置
            </a>
            <a href="#" class="dropdown-item">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/></svg>
              系统设置
            </a>
            <div class="dropdown-divider"></div>
            <a href="#" class="dropdown-item danger">
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
import { ref } from 'vue'

const showDropdown = ref(false)
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

.header-search {
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 12px;
  width: 16px;
  height: 16px;
  color: var(--text-tertiary);
}
.search-input {
  background: var(--bg-root);
  border: 1px solid transparent;
  border-radius: var(--radius-full);
  padding: 7px 14px 7px 36px;
  font-size: 0.85rem;
  width: 220px;
  color: var(--text-primary);
  transition: all var(--duration-fast) var(--ease-out);
  outline: none;
}
.search-input:focus {
  border-color: var(--primary);
  background: var(--bg-card);
  box-shadow: 0 0 0 3px var(--primary-ghost);
  width: 280px;
}
.search-input::placeholder { color: var(--text-tertiary); }

.header-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all var(--duration-fast);
}
.header-btn:hover { background: var(--bg-root); color: var(--text-primary); }
.header-btn svg { width: 20px; height: 20px; }
.badge-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 7px;
  height: 7px;
  background: var(--danger);
  border-radius: 50%;
  border: 1.5px solid var(--bg-card);
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
  width: 180px;
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
}
.dropdown-item:hover { background: var(--bg-root); color: var(--text-primary); }
.dropdown-item svg { width: 16px; height: 16px; }
.dropdown-item.danger { color: var(--danger); }
.dropdown-item.danger:hover { background: rgba(239,68,68,0.06); }
.dropdown-divider { height: 1px; background: var(--border-light); margin: 4px 0; }

.dropdown-enter-active { transition: all 0.2s var(--ease-spring); }
.dropdown-leave-active { transition: all 0.15s var(--ease-out); }
.dropdown-enter-from { opacity: 0; transform: translateY(-8px) scale(0.95); }
.dropdown-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
