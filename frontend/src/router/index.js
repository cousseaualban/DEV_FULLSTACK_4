
import { createRouter, createWebHistory } from 'vue-router'

import Login from '../views/Login.vue'
import Profile from '../views/Profile.vue'
import Documents from '../views/Documents.vue'
import Folder from '../views/Folder.vue'
import Editor from '../views/Editor.vue'

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
    }
  ]
})

router.beforeEach((to) => {
  const isAuthenticated =
    localStorage.getItem('isAuthenticated') === 'true'

  if (to.path !== '/login' && !isAuthenticated) {
    return '/login'
  }

  return true
})


export default router