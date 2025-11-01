<template>
  <q-layout view="lHh Lpr lFf">
    <AppHeader
      :title="pageTitle"
      @toggle-left="toggleLeftDrawer"
      @profile="$router.push('/profile')"
      @logout="logout()"
    />

    <!-- esconde sidebar no checkout e no onboarding -->
    <AppSidebar v-if="!hideSidebar" v-model="leftDrawerOpen" />

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppSidebar from 'src/components/AppSidebar.vue'
import AppHeader from 'src/components/AppHeader.vue'

const leftDrawerOpen = ref(false)
const route = useRoute()
const router = useRouter()

const isCheckout = computed(() =>
  route.name === 'checkout' || route.path.startsWith('/checkout')
)

// esconde no checkout e quando for rota de onboarding
const hideSidebar = computed(() =>
  isCheckout.value || route.name === 'onboarding-company' || route.meta?.onboarding === true
)

// (opcional) título dinâmico
const pageTitle = computed(() =>
  route.meta?.onboarding ? 'Criar empresa' : 'Dashboard'
)

function toggleLeftDrawer () {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
function logout () {
  router.replace({ path: '/login' })
}
</script>
