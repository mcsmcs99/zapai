// src/router/index.js
import { defineRouter } from '#q-app/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import routes from './routes'
import { useAuthStore } from 'src/stores/auth'

export default defineRouter(function ({ store }) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    // Mantenha o controle pelo quasar.config.js (vueRouterMode/publicPath)
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  // Guard global (agora no Router correto)
  Router.beforeEach((to) => {
    console.log(to)
    const auth = useAuthStore(store)
    const needsAuth = to.matched.some(r => r.meta?.requiresAuth)
    if (needsAuth && !auth.isAuthenticated) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }
  })

  return Router
})
