
import { createRouter, createWebHistory } from 'vue-router'

import Login from '../views/Login.vue'
import Profile from '../views/Profile.vue'
import Documents from '../views/Documents.vue'
import Folder from '../views/Folder.vue'
import Editor from '../views/Editor.vue'
import AdminUsers from '../views/AdminUsers.vue'

const router = createRouter({
  history: createWebHistory(),

  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/profile',
      name: 'profile',
      component: Profile
    },
    {
      path: '/documents',
      name: 'documents',
      component: Documents
    },
    {
      path: '/documents/projets',
      name: 'folder',
      component: Folder
    },
    {
      path: '/documents/editor',
      name: 'editor',
      component: Editor
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: AdminUsers,
      meta: { requiresAdmin: true }
    }
  ]
})

router.beforeEach((to) => {
  const isAuthenticated =
    localStorage.getItem('isAuthenticated') === 'true'

  if (to.path !== '/login' && !isAuthenticated) {
    return '/login'
  }

  if (to.meta.requiresAdmin) {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null')

      if (user?.role !== 'ADMIN') {
        return '/documents'
      }
    } catch {
      return '/documents'
    }
  }

  return true
})

export default router
