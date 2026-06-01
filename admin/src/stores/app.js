import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { post } from '@/utils/request'

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const currentTheme = ref('light')

  const token = ref(localStorage.getItem('admin_token') || '')
  const username = ref(localStorage.getItem('admin_username') || '')
  const role = ref(localStorage.getItem('admin_role') || '')

  const isLoggedIn = computed(() => !!token.value)
  const isSuperAdmin = computed(() => role.value === 'ROLE_SUPER_ADMIN')

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  async function login(loginUsername, password) {
    const data = await post('/admin/auth/login', { username: loginUsername, password })
    token.value = data.token
    username.value = data.username
    role.value = data.role
    localStorage.setItem('admin_token', data.token)
    localStorage.setItem('admin_username', data.username)
    localStorage.setItem('admin_role', data.role)
    return data
  }

  function logout() {
    token.value = ''
    username.value = ''
    role.value = ''
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_username')
    localStorage.removeItem('admin_role')
  }

  function restoreSession() {
    token.value = localStorage.getItem('admin_token') || ''
    username.value = localStorage.getItem('admin_username') || ''
    role.value = localStorage.getItem('admin_role') || ''
  }

  return {
    sidebarCollapsed, currentTheme, toggleSidebar,
    token, username, role, isLoggedIn, isSuperAdmin,
    login, logout, restoreSession
  }
})
