const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: '/profile', component: () => import('pages/ProfilePage.vue') },
      { path: '/dashboard', component: () => import('pages/Dashboard.vue') },
      { path: '/assistants', component: () => import('pages/AssistantsList.vue') },
      { path: '/conversations', component: () => import('pages/ConversationsPage.vue') },
      { path: '/appointments', component: () => import('pages/AppointmentsPage.vue') },
      { path: '/services', component: () => import('pages/ServicesPage.vue') },
      { path: '/staff', component: () => import('pages/StaffPage.vue') },
      { path: '/business-revenues', component: () => import('pages/BusinessRevenues.vue') },
      { path: '/client-subscriptions', component: () => import('pages/ClientSubscriptions.vue') },
      { path: '/simulator', component: () => import('pages/SimulatorPage.vue') },
      { path: '/my-subscription', component: () => import('pages/MySubscription.vue') },
      { path: '/create-assistant', component: () => import('pages/CreateAssistantPage.vue') },
      { path: '/checkout', name: 'checkout', component: () => import('pages/CheckoutPage.vue') },

      { path: '/admin-dashboard', component: () => import('pages/AdminDashboard.vue') },
      { path: '/companies', component: () => import('pages/CompaniesPage.vue') },
      { path: '/plans', component: () => import('pages/PlansPage.vue') },
      { path: '/admin-finance', component: () => import('pages/AdminFinance.vue') },
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
