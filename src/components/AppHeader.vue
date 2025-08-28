<template>
  <q-header elevated class="app-header">
    <q-toolbar class="q-px-md">

      <!-- Abrir/fechar sidebar -->
      <q-btn
        flat dense round icon="menu" aria-label="Menu"
        @click="$emit('toggle-left')"
      />

      <!-- Título do topo (opcional) -->
      <q-toolbar-title class="text-weight-medium">
        {{ title }}
      </q-toolbar-title>

      <!-- Ações à direita (ex.: Testar IA / Novo Assistente) -->
      <div class="row items-center no-wrap q-gutter-sm">
        <slot name="actions" />

        <!-- Menu do usuário -->
        <q-btn flat round dense>
          <q-avatar size="28px" color="primary" text-color="white">
            {{ userInitials }}
          </q-avatar>

          <q-menu anchor="bottom right" self="top right">
            <q-list style="min-width: 260px">
              <q-item>
                <q-item-section>
                  <div class="text-weight-medium">{{ user?.name }}</div>
                  <div class="text-caption text-grey-7">{{ user?.email }}</div>
                </q-item-section>
              </q-item>

              <q-separator />

              <q-item clickable @click="$emit('profile')">
                <q-item-section avatar><q-icon name="person" /></q-item-section>
                <q-item-section>Meu Perfil</q-item-section>
              </q-item>

              <q-item clickable class="text-negative" @click="$emit('logout')">
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

defineOptions({ name: 'AppHeader' }) // evita erro ESLint multi-word

const props = defineProps({
  title: { type: String, default: 'WhatsApp AI' },
  user: {
    type: Object,
    default: () => ({ name: 'Usuário', email: 'user@email.com' })
  }
})

const userInitials = computed(() => {
  const n = (props.user?.name || '').trim()
  if (!n) return 'U'
  const parts = n.split(/\s+/).slice(0, 2)       // pega nome e sobrenome
  return parts.map(p => p[0]?.toUpperCase()).join('') || 'U'
})
</script>

<style scoped>
.app-header {
  backdrop-filter: saturate(180%) blur(6px);
  background: rgba(255,255,255,.9);
}
</style>
