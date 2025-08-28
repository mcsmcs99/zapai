const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: '/perfil', component: () => import('pages/ProfilePage.vue') },
      { path: '/dashboard', component: () => import('pages/Dashboard.vue') },
      { path: '/assistentes', component: () => import('pages/AssistantsList.vue') },
      { path: '/conversas', component: () => import('pages/ConversationsPage.vue') },
      { path: '/simulador', component: () => import('pages/SimulatorPage.vue') },
      { path: '/admin', component: () => import('pages/AdminDashboard.vue') },
      { path: '/empresas', component: () => import('pages/CompaniesPage.vue') },
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
