<template>
  <q-layout view="lHh Lpr lFf">
    <AppHeader
      :title="'Dashboard'"
      :user="{ name: 'Matheus Correia Dos Santos', email: 'mcsmatheusmcs99@gmail.com' }"
      @toggle-left="toggleLeftDrawer"
      @profile="$router.push('/perfil')"
      @logout="logout()"
    />

    <AppSidebar v-model="leftDrawerOpen" />

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import AppSidebar from 'src/components/AppSidebar.vue'
import AppHeader from 'src/components/AppHeader.vue'

const leftDrawerOpen = ref(false)

function toggleLeftDrawer () {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>
