import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { title: '数据看板', icon: 'dashboard' }
  },
  {
    path: '/drugs',
    name: 'Drugs',
    component: () => import('../views/Drugs.vue'),
    meta: { title: '药品库管理', icon: 'drug' }
  },
  {
    path: '/products',
    name: 'Products',
    component: () => import('../views/Products.vue'),
    meta: { title: '商品管理', icon: 'product' }
  },
  {
    path: '/points',
    name: 'Points',
    component: () => import('../views/Points.vue'),
    meta: { title: '积分管理', icon: 'points' }
  },
  {
    path: '/feedback',
    name: 'Feedback',
    component: () => import('../views/Feedback.vue'),
    meta: { title: '用户反馈', icon: 'feedback' }
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('../views/Users.vue'),
    meta: { title: '用户管理', icon: 'users' }
  },
  {
    path: '/admins',
    name: 'Admins',
    component: () => import('../views/Admins.vue'),
    meta: { title: '管理员管理', icon: 'admins' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
