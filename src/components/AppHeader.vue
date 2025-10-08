<template>
  <q-header elevated class="app-header">
    <q-toolbar class="q-px-md">

      <!-- Abrir/fechar sidebar -->
      <q-btn
        flat dense round icon="menu" aria-label="Menu"
        @click="$emit('toggle-left')"
      />

      <!-- Título -->
      <q-toolbar-title class="text-weight-medium">
        {{ props.title }}
      </q-toolbar-title>

      <!-- Ações à direita -->
      <div class="row items-center no-wrap q-gutter-sm">
        <slot name="actions" />

        <!-- Menu do usuário (dados vindos do store) -->
        <q-btn flat round dense>
          <q-avatar size="28px" color="primary" text-color="white">
            {{ userInitials }}
          </q-avatar>

          <q-menu anchor="bottom right" self="top right">
            <q-list style="min-width: 260px">
              <q-item>
                <q-item-section>
                  <div class="text-weight-medium">{{ userName }}</div>
                  <div class="text-caption text-grey-7">{{ userEmail }}</div>
                </q-item-section>
              </q-item>

              <q-separator />

              <q-item clickable @click="goProfile">
                <q-item-section avatar><q-icon name="person" /></q-item-section>
                <q-item-section>Meu Perfil</q-item-section>
              </q-item>

              <q-item clickable class="text-negative" @click="handleLogout">
                <q-item-section avatar><q-icon name="logout" /></q-item-section>
                <q-item-section>Sair</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
    </q-toolbar>
  </q-header>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'

defineOptions({ name: 'AppHeader' })

const props = defineProps({
  title: { type: String, default: 'WhatsApp AI' }
})

const router = useRouter()
const auth = useAuthStore()

// Dados do usuário do store (fallbacks amigáveis)
const userName = computed(() => auth.user?.name || 'Usuário')
const userEmail = computed(() => auth.user?.email || 'user@email.com')

const userInitials = computed(() => {
  const n = userName.value.trim()
  if (!n) return 'U'
  const parts = n.split(/\s+/).slice(0, 2)
  return parts.map(p => p[0]?.toUpperCase()).join('') || 'U'
})

function goProfile () {
  router.push({ path: '/profile' })
}

function handleLogout () {
  // limpa token/usuário no store e volta para /login
  auth.logout()
  router.replace({ path: '/login' })
}
</script>

<style scoped>
.app-header {
  backdrop-filter: saturate(180%) blur(6px);
  background: rgba(255,255,255,.9);
}
</style>
