<template>
  <q-layout view="lHh Lpr lFf">
    <AppHeader
      :title="'Dashboard'"
      :user="{ name: 'Matheus Correia Dos Santos', email: 'mcsmatheusmcs99@gmail.com' }"
      @toggle-left="toggleLeftDrawer"
      @profile="$router.push('/profile')"
      @logout="logout()"
    />

    <AppSidebar v-if="!isCheckout" v-model="leftDrawerOpen" />

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppSidebar from 'src/components/AppSidebar.vue'
import AppHeader from 'src/components/AppHeader.vue'

const leftDrawerOpen = ref(false)

const route = useRoute()
const router = useRouter()

const isCheckout = computed(() =>
  route.name === 'checkout' || route.path.startsWith('/checkout')
)

function toggleLeftDrawer () {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
function logout () {
  router.replace({ path: '/login' })
}
</script>
