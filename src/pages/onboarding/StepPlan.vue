<template>
  <div>
    <div class="text-subtitle1 q-mb-md">Escolha seu plano</div>

    <div class="q-my-md">
      <q-skeleton v-if="plansStore.loading" type="QCard" height="180px" class="q-mb-md" />
      <q-skeleton v-if="plansStore.loading" type="QCard" height="180px" class="q-mb-md" />
      <q-skeleton v-if="plansStore.loading" type="QCard" height="180px" />
    </div>

    <div v-if="!plansStore.loading" class="row q-col-gutter-lg">
      <q-card
        v-for="p in plans"
        :key="p.unique_key || p.id"
        bordered
        flat
        class="plan-card col-12 col-md-4"
        @click="select(p)"
        tabindex="0"
        @keyup.enter.space="select(p)"
      >
        <!-- Cabeçalho -->
        <div
          class="plan-header row items-center justify-between"
          :class="{ 'is-selected': ob.plan?.id === p.id }"
        >
          <div class="plan-title">{{ p.name }}</div>
          <div class="row items-center q-gutter-xs">
            <!-- badge opcional se quiser realçar o do meio -->
            <div v-if="isMiddle(p)" class="plan-badge">Recomendado</div>
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
              <strong>{{ p.assistants ?? '-' }}</strong>
            </div>
          </div>

          <div class="readonly-field q-mt-sm">
            <div class="row items-center justify-between">
              <div class="row items-center">
                <q-icon name="chat_bubble" class="q-mr-sm" />
                <span>Mensagens/mês</span>
              </div>
              <strong>{{ formatNumber(p.messages) }}</strong>
            </div>
          </div>

          <q-separator class="q-my-md" />

          <div class="q-mb-sm text-body2">
            <strong>Recursos inclusos:</strong>
          </div>

          <ul class="features q-mb-none">
            <li v-for="(f, i) in featuresFromPlan(p)" :key="i">
              <q-icon name="circle" size="8px" class="q-mr-sm text-positive" />
              <span>{{ f }}</span>
            </li>
          </ul>
        </q-card-section>
      </q-card>
    </div>

    <div v-if="!plansStore.loading && !plans.length" class="q-mt-md">
      <q-banner rounded class="bg-grey-2 text-grey-8">
        Nenhum plano disponível no momento.
      </q-banner>
    </div>

    <!-- Navegação -->
    <div class="row justify-between q-mt-lg">
      <q-btn flat color="grey-7" label="Voltar" @click="emit('back')" />
      <q-btn :disable="!ob.plan" unelevated color="primary" label="Avançar" @click="emit('next')" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useOnboardingStore } from 'src/stores/onboarding'
import { usePlansStore } from 'src/stores/plans'

const ob = useOnboardingStore()
const plansStore = usePlansStore()
const emit = defineEmits(['next','back'])

onMounted(() => {
  // carrega da API (rota /plans com auth)
  plansStore.fetchPlans()
})

const plans = computed(() => plansStore.items || [])

function select (p) {
  ob.plan = p
}

function formatBRL (n) {
  if (typeof n !== 'number') return n
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatNumber (n) {
  if (typeof n !== 'number') return n
  return n.toLocaleString('pt-BR')
}

function isMiddle (p) {
  // só para dar destaque no "do meio" quando houver 3 itens
  const arr = plans.value
  if (!arr?.length) return false
  const mid = Math.floor(arr.length / 2)
  return arr[mid]?.id === p.id
}

function featuresFromPlan (p) {
  const base = [
    `${p.assistants ?? '-'} Assistente(s) IA`,
    `${formatNumber(p.messages)} Mensagens/mês`,
    'Dashboard',
    'Relatórios básicos'
  ]
  if (p.price === 0) {
    base.push('SLA e integrações sob consulta')
  }
  return base
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
