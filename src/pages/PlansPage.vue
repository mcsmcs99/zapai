<template>
  <q-page padding class="q-gutter-md">

    <!-- Título + ação -->
    <div class="row items-center justify-between">
      <div>
        <div class="text-h4 text-weight-bold">Gerenciar Planos</div>
        <div class="text-subtitle2 text-grey-7">
          Configure os planos de assinatura disponíveis
        </div>
      </div>

      <q-btn
        class="gradient-btn"
        rounded unelevated icon="add" label="Novo Plano"
        @click="openCreate"
      />
    </div>

    <!-- Grid de planos -->
    <div class="row q-col-gutter-xl q-mt-md">
      <div
        v-for="p in plans"
        :key="p.id"
        class="col-12 col-md-6 col-lg-4"
      >
        <q-card flat bordered class="plan-card">
          <!-- Cabeçalho -->
          <div class="plan-header row items-center no-wrap">
            <div class="text-h6 text-weight-bold q-pr-sm ellipsis">
              {{ p.name }}
            </div>

            <q-space />

            <q-badge
              v-if="p.popular"
              rounded
              color="purple-1"
              text-color="purple-9"
              label="Popular"
            />
          </div>

          <q-separator />

          <!-- Preço -->
          <q-card-section class="q-pt-lg q-pb-md">
            <div class="text-h4 text-weight-bold">{{ money(p.price) }}</div>
            <div class="text-caption text-grey-7">/mês</div>
          </q-card-section>

          <!-- Quotas -->
          <q-card-section class="q-pt-none q-gutter-sm">
            <div class="quota row items-center q-pa-sm quota-box">
              <q-icon name="smart_toy" class="q-mr-sm" />
              <div class="text-body2">Assistentes IA</div>
              <q-space />
              <div class="text-weight-bold">{{ p.limits.assistants }}</div>
            </div>
            <div class="quota row items-center q-pa-sm quota-box">
              <q-icon name="chat_bubble_outline" class="q-mr-sm" />
              <div class="text-body2">Mensagens/mês</div>
              <q-space />
              <div class="text-weight-bold">
                {{ p.limits.messages.toLocaleString('pt-BR') }}
              </div>
            </div>
            <q-separator class="q-mt-sm" />
          </q-card-section>

          <!-- Recursos -->
          <q-card-section>
            <div class="text-subtitle2 text-weight-bold q-mb-sm">Recursos inclusos:</div>

            <div v-for="(f, i) in p.features" :key="i" class="row items-start q-mb-xs">
              <q-icon name="circle" size="8px" class="q-mt-xs q-mr-sm text-positive" />
              <div class="text-body2">{{ f }}</div>
            </div>
          </q-card-section>

          <q-separator />

          <!-- Ações -->
          <q-card-actions align="left" class="q-pa-md">
            <q-btn outline color="dark" icon="edit" label="Editar" @click="openEdit(p)" />
            <q-space />
            <q-btn flat round color="negative" icon="delete" @click="askRemove(p)" />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Dialog: Editor de Plano (componente separado) -->
    <PlanEditorDialog
      v-model="dlgOpen"
      :mode="dlgMode"
      :value="current"
      @save="savePlan"
    />

    <!-- Dialog: remover -->
    <q-dialog v-model="rm.open">
      <q-card style="min-width: 380px">
        <q-card-section class="row items-center q-gutter-sm">
          <q-icon name="warning" color="negative" />
        <div class="text-subtitle1 text-weight-bold">Remover plano</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          Deseja remover o plano <b>{{ rm.item?.name }}</b>?
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="negative" label="Remover" @click="removePlan" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, reactive } from 'vue'
import PlanEditorDialog from 'components/PlanEditorDialog.vue'

defineOptions({ name: 'PlansPage' })

/* ====== dados mock (troque pela sua API) ====== */
const plans = ref([
  {
    id: 1,
    name: 'Plano Básico',
    price: 49.90,
    popular: true,
    limits: { assistants: 1, messages: 500 },
    features: [
      '1 Assistente IA',
      '500 Mensagens/mês',
      'Dashboard Básico',
      'Suporte por Email'
    ]
  },
  {
    id: 2,
    name: 'Plano Profissional',
    price: 99.90,
    popular: true,
    limits: { assistants: 5, messages: 2500 },
    features: [
      '5 Assistentes IA',
      '2.500 Mensagens/mês',
      'Dashboard Avançado',
      'Relatórios',
      'Suporte Prioritário'
    ]
  }
])

/* ====== helpers ====== */
const money = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

/* ====== dialog do editor ====== */
const dlgOpen = ref(false)
const dlgMode = ref('create') // 'create' | 'edit'
const current = reactive({
  id: null,
  name: '',
  price: 0,
  popular: false,
  limits: { assistants: 1, messages: 0 },
  features: []
})

function openCreate () {
  Object.assign(current, { id: null, name: '', price: 0, popular: false, limits: { assistants: 1, messages: 0 }, features: [] })
  dlgMode.value = 'create'
  dlgOpen.value = true
}
function openEdit (p) {
  Object.assign(current, JSON.parse(JSON.stringify(p)))
  dlgMode.value = 'edit'
  dlgOpen.value = true
}
function savePlan (payload) {
  if (dlgMode.value === 'create') {
    const id = Math.max(0, ...plans.value.map(p => p.id)) + 1
    plans.value.push({ ...payload, id })
  } else {
    const i = plans.value.findIndex(p => p.id === payload.id)
    if (i > -1) plans.value[i] = JSON.parse(JSON.stringify(payload))
  }
}

/* ====== remover ====== */
const rm = reactive({ open: false, item: null })
function askRemove (p) { rm.item = p; rm.open = true }
function removePlan () {
  plans.value = plans.value.filter(p => p.id !== rm.item.id)
  rm.open = false
}
</script>

<style scoped>
.plan-card {
  border-radius: 16px;
  box-shadow: 0 12px 22px rgba(0,0,0,.06);
}
.plan-header {
  padding: 16px 18px;
  background: linear-gradient(180deg, #EEF2FF 0%, #F6F7FF 100%);
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}
.quota-box {
  border: 1px solid rgba(0,0,0,.06);
  border-radius: 10px;
  background: #fff;
}
.gradient-btn {
  background: linear-gradient(90deg, #8B5CF6 0%, #EC4899 100%);
  color: #fff;
}
</style>
