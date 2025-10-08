const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: '/profile', name: 'profile', component: () => import('pages/ProfilePage.vue') },
      { path: '/dashboard', name: 'dashboard', component: () => import('pages/Dashboard.vue') },
      { path: '/assistants', name: 'assistants', component: () => import('pages/AssistantsList.vue') },
      { path: '/conversations', name: 'conversations', component: () => import('pages/ConversationsPage.vue') },
      { path: '/appointments', name: 'appointments', component: () => import('pages/AppointmentsPage.vue') },
      { path: '/services', name: 'services', component: () => import('pages/ServicesPage.vue') },
      { path: '/staff', name: 'staff', component: () => import('pages/StaffPage.vue') },
      { path: '/business-revenues', name: 'business-revenues', component: () => import('pages/BusinessRevenues.vue') },
      { path: '/client-subscriptions', name: 'client-subscriptions', component: () => import('pages/ClientSubscriptions.vue') },
      { path: '/simulator', name: 'simulator', component: () => import('pages/SimulatorPage.vue') },
      { path: '/my-subscription', name: 'my-subscription', component: () => import('pages/MySubscription.vue') },
      { path: '/create-assistant', name: 'create-assistant', component: () => import('pages/CreateAssistantPage.vue') },
      { path: '/checkout', name: 'checkout', component: () => import('pages/CheckoutPage.vue') },

      { path: '/admin-dashboard', name: 'admin-dashboard', component: () => import('pages/AdminDashboard.vue') },
      { path: '/companies', name: 'companies', component: () => import('pages/CompaniesPage.vue') },
      { path: '/plans', name: 'plans', component: () => import('pages/PlansPage.vue') },
      { path: '/admin-finance', name: 'admin-finance', component: () => import('pages/AdminFinance.vue') },
    ]
  },
  {
    path: '/',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      { path: '/login', name: 'login', component: () => import('pages/LoginPage.vue') },
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
