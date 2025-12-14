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
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  Router.beforeEach((to) => {
    const auth = useAuthStore(store)

    const isAuthenticated = auth.isAuthenticated
    const isPending = auth.user?.status === 'pending_group'
    const isNeedSelectgGroup = auth.user?.current_group_id === null
    const requiresAuth = to.matched.some(r => r.meta?.requiresAuth)
    const isOnboarding = to.matched.some(r => r.meta?.onboarding)

    // 1) Bloqueia rotas protegidas para não autenticado
    if (requiresAuth && !isAuthenticated) {
      return { name: 'login' }
    }

    // 2) Usuário autenticado mas pendente:
    //    só pode acessar a rota de onboarding
    if (isAuthenticated && isPending && !isOnboarding) {
      return { name: 'onboarding-company' }
    }

    // 2) Usuário autenticado e sem empresa selecionada:
    //    só pode acessar a rota de seleção de empresa
    if (isAuthenticated && isNeedSelectgGroup && to.name !== 'select-group' && to.name !== 'onboarding-company') {
      return { name: 'select-group' }
    }

    // 3) Usuário autenticado e NÃO pendente:
    //    se tentar ir para onboarding, manda pro app
    if (isAuthenticated && !isPending && isOnboarding) {
      return { name: 'dashboard' }
    }

    // 4) Usuário autenticado tentando ir pro login: redireciona
    if (isAuthenticated && (to.name === 'login' || to.name == undefined)) {
      return { name: isPending ? 'onboarding-company' : 'dashboard' }
    }

    return true
  })

  return Router
})
