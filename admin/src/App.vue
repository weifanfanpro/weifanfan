<template>
  <div class="app-layout" v-if="appStore.isLoggedIn">
    <Sidebar />
    <div class="app-main" :class="{ collapsed: appStore.sidebarCollapsed }">
      <Header />
      <main class="app-content">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
  <router-view v-else />
</template>

<script setup>
import Sidebar from './components/Sidebar.vue'
import Header from './components/Header.vue'
import { useAppStore } from './stores/app'

const appStore = useAppStore()
appStore.restoreSession()
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: margin-left var(--duration-normal) var(--ease-out);
}

.app-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
  scroll-behavior: smooth;
}
</style>
