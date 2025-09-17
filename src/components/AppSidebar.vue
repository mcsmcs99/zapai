<template>
  <q-drawer
    :model-value="modelValue"
    @update:model-value="val => emit('update:modelValue', val)"
    show-if-above
    bordered
  >
    <!-- Brand -->
    <div class="q-pa-md row items-center brand">
      <q-avatar size="44px" color="primary" text-color="white" rounded>
        <q-icon name="smart_toy" />
      </q-avatar>
      <div class="q-ml-md">
        <div class="text-weight-bold text-body1">WhatsApp AI</div>
        <div class="text-caption text-grey-7">Assistente Virtual</div>
      </div>
    </div>

    <q-separator spaced />

    <!-- MENU PRINCIPAL -->
    <q-list padding>
      <q-item-label class="section-label">MENU PRINCIPAL</q-item-label>

      <q-item
        v-for="it in main"
        :key="it.to"
        clickable
        :to="it.to"
        :class="['nav-item', { 'active-link': isActive(it.to) }]"
      >
        <q-item-section avatar><q-icon :name="it.icon" /></q-item-section>
        <q-item-section><q-item-label>{{ it.label }}</q-item-label></q-item-section>
      </q-item>

      <q-separator spaced />

      <q-item-label class="section-label text-negative">ADMINISTRAÇÃO</q-item-label>

      <q-item
        v-for="it in admin"
        :key="it.to"
        clickable
        :to="it.to"
        :class="['nav-item', { 'active-link': isActive(it.to) }]"
      >
        <q-item-section avatar><q-icon :name="it.icon" /></q-item-section>
        <q-item-section><q-item-label>{{ it.label }}</q-item-label></q-item-section>
      </q-item>
    </q-list>

    <!-- Status card -->
    <div class="q-pa-md">
      <q-card flat bordered class="status-card">
        <q-card-section class="row items-center q-gutter-sm">
          <q-icon name="settings_suggest" />
          <div class="text-subtitle2">Status</div>
        </q-card-section>
        <q-separator inset />
        <q-card-section class="row items-center q-gutter-sm">
          <q-badge rounded color="green-5" class="dot" />
          <div class="text-body2">Sistema Online</div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Footer button -->
    <div class="drawer-footer q-pa-md">
      <q-btn
        class="full-width"
        color="primary"
        rounded
        unelevated
        icon="add"
        label="Novo Assistente"
        @click="$router.push('/create-assistant')"
      />
    </div>
  </q-drawer>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import { useRoute } from 'vue-router'

defineOptions({ name: 'AppSidebar' }) // evita erro ESLint de multi-word

defineProps({ modelValue: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue'])

const route = useRoute()
const isActive = (to) => route.path === to || route.path.startsWith(to + '/')

const main = [
  { label: 'Dashboard',              icon: 'insights',              to: '/dashboard' },
  { label: 'Meus Assistentes',       icon: 'smart_toy',             to: '/assistants' },
  { label: 'Conversas',              icon: 'chat_bubble',           to: '/conversations' },
  { label: 'Agendamentos',           icon: 'calendar_month',        to: '/appointments' },
  { label: 'Serviços',               icon: 'construction',          to: '/services' },
  { label: 'Colaboradores',          icon: 'group',                 to: '/staff' },
  { label: 'Receitas do negócio',    icon: 'attach_money',          to: '/business-revenues' },
  { label: 'Assinatura de clientes', icon: 'autorenew',             to: '/client-subscriptions' },
  { label: 'Simulador',              icon: 'play_circle',           to: '/simulator' },
  { label: 'Minha assinatura',       icon: 'wallet',                to: '/my-subscription' },
]
const admin = [
  { label: 'Dashboard Admin',  icon: 'admin_panel_settings',  to: '/admin-dashboard' },
  { label: 'Empresas',         icon: 'apartment',             to: '/companies' },
  { label: 'Planos',           icon: 'loyalty',               to: '/plans' },
  { label: 'Finanças',         icon: 'attach_money',          to: '/admin-finance' },
]
</script>

<style scoped>
.brand { padding-top: 18px; padding-bottom: 6px; }
.section-label {
  font-size: 11px; letter-spacing: .8px; font-weight: 700;
  color: #9AA4B2; padding: 6px 16px;
}
.nav-item { border-radius: 12px; margin: 4px 8px; }
.nav-item.active-link {
  background: #E8F7EF;         /* verde 50 */
  color: #167C4F;               /* verde escuro */
}
.status-card {
  border-radius: 14px;
  background: linear-gradient(180deg, #F3FBFF 0%, #F1F7FF 100%);
}
.dot { width: 8px; height: 8px; padding: 0; }
.drawer-footer { position: sticky; bottom: 0; background: white; }
</style>
