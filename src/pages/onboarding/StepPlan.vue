<template>
  <div>
    <div class="text-subtitle1 q-mb-md">Escolha seu plano</div>

    <div class="row q-col-gutter-lg">
      <q-card
        v-for="p in plans"
        :key="p.id"
        bordered
        flat
        class="plan-card col-12 col-md-4"
        @click="select(p)"
        tabindex="0"
        @keyup.enter.space="select(p)"
      >
        <!-- Cabeçalho -->
        <div class="plan-header row items-center justify-between" :class="{ 'is-selected': ob.plan?.id === p.id }">
          <div class="plan-title">{{ p.title }}</div>
          <div class="row items-center q-gutter-xs">
            <div v-if="p.popular" class="plan-badge">Popular</div>
          </div>
        </div>

        <!-- Preço -->
        <q-card-section class="q-pt-md q-pb-sm">
          <div class="price">{{ p.price === 0 ? 'Sob consulta' : formatBRL(p.price) }}</div>
          <div v-if="p.price !== 0" class="text-grey-7 text-caption">/mês</div>
        </q-card-section>

        <!-- Campos somente leitura -->
        <q-card-section class="q-pt-sm">
          <div class="readonly-field">
            <div class="row items-center justify-between">
              <div class="row items-center">
                <q-icon name="smart_toy" class="q-mr-sm" />
                <span>Assistentes IA</span>
              </div>
              <strong>{{ p.assistantsLabel || p.assistants }}</strong>
            </div>
          </div>

          <div class="readonly-field q-mt-sm">
            <div class="row items-center justify-between">
              <div class="row items-center">
                <q-icon name="chat_bubble" class="q-mr-sm" />
                <span>Mensagens/mês</span>
              </div>
              <strong>{{ p.messagesLabel || formatNumber(p.messages) }}</strong>
            </div>
          </div>

          <q-separator class="q-my-md" />

          <div class="q-mb-sm text-body2">
            <strong>Recursos inclusos:</strong>
          </div>

          <ul class="features q-mb-none">
            <li v-for="(f, i) in p.features" :key="i">
              <q-icon name="circle" size="8px" class="q-mr-sm text-positive" />
              <span>{{ f }}</span>
            </li>
          </ul>
        </q-card-section>
      </q-card>
    </div>

    <!-- Navegação -->
    <div class="row justify-between q-mt-lg">
      <q-btn flat color="grey-7" label="Voltar" @click="emit('back')" />
      <q-btn :disable="!ob.plan" unelevated color="primary" label="Avançar" @click="emit('next')" />
    </div>
  </div>
</template>

<script setup>
import { useOnboardingStore } from 'src/stores/onboarding'
const ob = useOnboardingStore()
const emit = defineEmits(['next','back'])

const plans = [
  {
    id: 'basic',
    title: 'Plano Básico',
    price: 49.9,
    assistants: 1,
    messages: 500,
    features: [
      '1 Assistente IA',
      '500 Mensagens/mês',
      'Dashboard Básico',
      'Suporte por Email'
    ]
  },
  {
    id: 'pro',
    title: 'Plano Profissional',
    price: 99.9,
    assistants: 5,
    messages: 2500,
    popular: true,
    features: [
      '5 Assistentes IA',
      '2.500 Mensagens/mês',
      'Dashboard Avançado',
      'Relatórios',
      'Suporte Prioritário'
    ]
  },
  {
    id: 'enterprise',
    title: 'Plano Enterprise',
    price: 0, // “Sob consulta”
    assistantsLabel: 'Ilimitado*',
    messagesLabel: 'Sob demanda',
    features: [
      'Assistentes e Mensagens sob demanda',
      'SLA e Suporte dedicado',
      'Integrações personalizadas',
      'Gestão de contas e consultoria'
    ]
  }
]

function select (p) {
  ob.plan = p
}

function formatBRL (n) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatNumber (n) {
  if (typeof n !== 'number') return n
  return n.toLocaleString('pt-BR')
}
</script>

<style scoped>
.plan-card {
  border-radius: 14px;
  cursor: pointer;
  transition: box-shadow .2s ease, transform .05s ease, border-color .2s ease;
  border: none;
  outline: none;
}
.plan-card:hover,
.plan-card:focus-visible {
  box-shadow: 0 4px 14px rgba(0,0,0,.06);
}

.plan-header.is-selected {
  padding: 12px 14px;
  border-top-left-radius: 14px;
  border-top-right-radius: 14px;
  background: linear-gradient(180deg, #dcffdc, #ffffff 85%);
  border-bottom: 1px solid var(--q-color-grey-4);
}
.plan-header {
  padding: 12px 14px;
  border-top-left-radius: 14px;
  border-top-right-radius: 14px;
  background: linear-gradient(180deg, #eef0ff, #ffffff 85%);
  border-bottom: 1px solid var(--q-color-grey-4);
}
.plan-title {
  font-weight: 700;
}
.plan-badge {
  font-size: 11px;
  color: #9c27b0;
  background: #f3e5f5;
  padding: 4px 8px;
  border-radius: 999px;
}
.selected-chip {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 999px;
  background: #e3f2fd;
  color: var(--q-color-primary);
  border: 1px solid rgba(33,150,243,.25);
}

.price {
  font-size: 34px;
  font-weight: 800;
  line-height: 1;
}

.readonly-field {
  border: 1px solid var(--q-color-grey-4);
  border-radius: 10px;
  padding: 10px 12px;
}

.features {
  list-style: none;
  padding: 0;
}
.features li {
  display: flex;
  align-items: center;
  margin: 6px 0;
}
</style>
