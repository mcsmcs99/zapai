<template>
  <q-page padding class="q-gutter-md">
    <!-- Header + ações -->
    <div class="row items-center justify-between">
      <div>
        <div class="text-h4 text-weight-bold">Assinaturas de Clientes</div>
        <div class="text-subtitle2 text-grey-7">
          Crie e gerencie planos de assinatura para seus clientes
        </div>
      </div>

      <div class="row q-gutter-sm">
        <q-btn outline rounded icon="add" label="Nova Assinatura" @click="openNewSubscriber" />
        <q-btn rounded unelevated class="btn-gradient" icon="add" label="Criar Plano" @click="openNewPlan" />
      </div>
    </div>

    <!-- KPIs -->
    <div class="row q-col-gutter-lg q-mt-md">
      <div v-for="c in kpis" :key="c.key" class="col-12 col-sm-6 col-md-3">
        <q-card class="kpi-card">
          <q-card-section class="row items-center no-wrap">
            <div class="kpi-icon" :class="c.bg"><q-icon :name="c.icon" size="26px"/></div>
            <div class="q-ml-md">
              <div class="text-subtitle2 text-grey-7">{{ c.title }}</div>
              <div class="text-h5 text-weight-bold">{{ c.value }}</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Seus Planos -->
    <div class="text-h6 text-weight-bold q-mt-lg q-mb-sm">Seus Planos</div>
    <div class="row q-col-gutter-xl">
      <div v-for="p in plans" :key="p.id" class="col-12 col-md-6 col-lg-4">
        <q-card flat bordered class="plan-card">
          <q-card-section class="row items-start no-wrap">
            <div class="text-subtitle1 text-weight-bold">{{ p.name }}</div>
            <q-space />
            <q-btn flat round dense icon="edit" @click="openEditPlan(p)" />
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-badge rounded color="grey-2" text-color="grey-9" :label="cycleLabel(p.cycle)" />
            <div class="text-h4 text-weight-bold text-deep-purple q-mt-sm">{{ money(p.price) }}</div>
            <div class="text-caption text-grey-7">{{ p.description || '—' }}</div>
          </q-card-section>

          <q-separator />
          <q-card-section class="q-pt-sm">
            <div class="text-caption text-weight-bold q-mb-xs">Serviços inclusos</div>
            <ul class="q-pl-sm q-mb-none">
              <li v-for="(s, i) in p.services" :key="i" class="text-body2">{{ s }}</li>
            </ul>
          </q-card-section>
        </q-card>
      </div>

      <div v-if="!plans.length" class="col-12">
        <q-banner class="bg-grey-1 text-grey-8 rounded-borders">
          Nenhum plano cadastrado ainda. Clique em <b>Criar Plano</b> para começar.
        </q-banner>
      </div>
    </div>

    <!-- Tabela de Assinantes -->
    <q-card flat bordered class="q-mt-xl rounded-borders">
      <q-card-section class="row items-center q-col-gutter-sm">
        <div class="text-h6 text-weight-bold">Gerenciamento de Assinantes</div>
        <q-space />
        <q-input dense outlined clearable debounce="300" v-model="search" placeholder="Buscar assinante...">
          <template #prepend><q-icon name="search"/></template>
        </q-input>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-table
          :rows="filteredSubscribers"
          :columns="columns"
          row-key="id"
          flat
          separator="horizontal"
          :rows-per-page-options="[10,25,50]"
        >
          <template #body-cell-plan="props">
            <q-td :props="props">{{ planName(props.row.planId) }}</q-td>
          </template>

          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge
                rounded
                :label="props.row.status"
                :color="props.row.status === 'Ativo' ? 'green-2' : (props.row.status === 'Cancelado' ? 'grey-3' : 'yellow-2')"
                :text-color="props.row.status === 'Ativo' ? 'green-10' : (props.row.status === 'Cancelado' ? 'grey-9' : 'yellow-10')"
              />
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" class="q-gutter-xs">
              <q-btn dense round outline color="negative" icon="cancel" @click="cancelSubscription(props.row)" v-if="props.row.status === 'Ativo'" />
            </q-td>
          </template>

          <template #no-data>
            <div class="full-width row items-center justify-center q-pa-lg text-grey-7">
              Nenhuma assinatura cadastrada ainda.
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Dialogs -->
    <SubscriberDialog
      v-model="dlgSubscriber"
      :plans="plans"
      @save="addSubscriber"
    />
    <SubscriptionPlanDialog
      v-model="dlgPlan.open"
      :mode="dlgPlan.mode"
      :value="dlgPlan.value"
      @save="savePlan"
    />
  </q-page>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import SubscriberDialog from 'components/SubscriberDialog.vue'
import SubscriptionPlanDialog from 'components/SubscriptionPlanDialog.vue'

defineOptions({ name: 'ClientSubscriptionsPage' })

/* ---------- mocks (trocar por API/store) ---------- */
const plans = ref([
  {
    id: 1,
    name: 'Plano Platium',
    description: 'Pode cortar todos dias ilimitado',
    price: 150,
    cycle: 'monthly',         // 'monthly' | 'quarterly' | 'yearly'
    active: true,
    services: ['Corte + Barba', 'Corte Social']
  }
])
const subscribers = ref([]) // {id, name, phone, planId, startAt(DD/MM/YYYY), nextRenewal, status}

/* ---------- helpers ---------- */
const money = (v) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v)
const cycleLabel = (c) => c === 'monthly' ? 'Mensal' : c === 'quarterly' ? 'Trimestral' : 'Anual'
const planById = (id) => plans.value.find(p => p.id === id)
const planName  = (id) => planById(id)?.name || '—'

/* ---------- KPIs ---------- */
const kpis = computed(() => {
  const activeSubs = subscribers.value.filter(s => s.status === 'Ativo')
  const mrr = activeSubs.reduce((sum, s) => {
    const p = planById(s.planId); if (!p) return sum
    const monthly = p.cycle === 'yearly' ? p.price / 12 : (p.cycle === 'quarterly' ? p.price / 3 : p.price)
    return sum + monthly
  }, 0)
  const pend = 0 // placeholder se tiver cobrança pendente
  return [
    { key:'mrr',  title:'Receita Recorrente (MRR)', value: money(mrr), icon:'attach_money', bg:'bg-green' },
    { key:'subs', title:'Total de Assinantes',      value: subscribers.value.length, icon:'groups', bg:'bg-blue' },
    { key:'plans',title:'Planos Ativos',            value: plans.value.filter(p => p.active).length, icon:'swap_horiz', bg:'bg-purple' },
    { key:'pend', title:'Pagamentos Pendentes',     value: pend, icon:'payments', bg:'bg-orange' }
  ]
})

/* ---------- tabela assinantes ---------- */
const search = ref('')
const columns = [
  { name:'customer', label:'Cliente', field:'name', align:'left', sortable:true },
  { name:'plan',     label:'Plano',   field:'planId', align:'left', sortable:true },
  { name:'status',   label:'Status',  field:'status', align:'left', sortable:true },
  { name:'renewal',  label:'Próxima Renovação', field:'nextRenewal', align:'left', sortable:true },
  { name:'actions',  label:'Ações', align:'right' }
]
const filteredSubscribers = computed(() =>
  subscribers.value.filter(s =>
    !search.value ||
    s.name.toLowerCase().includes(search.value.toLowerCase()) ||
    planName(s.planId).toLowerCase().includes(search.value.toLowerCase())
  )
)

/* ---------- dialogs: Nova assinatura ---------- */
const dlgSubscriber = ref(false)
function openNewSubscriber () { dlgSubscriber.value = true }
function addSubscriber (payload) {
  subscribers.value.push({ id: cryptoId(), ...payload, status: 'Ativo' })
}

/* ---------- dialogs: Planos ---------- */
const dlgPlan = reactive({
  open: false,
  mode: 'create', // 'create' | 'edit'
  value: emptyPlan()
})
function emptyPlan () {
  return {
    id: null,
    name: '',
    description: '',
    price: 0,
    cycle: 'monthly',
    active: true,
    services: []
  }
}
function openNewPlan () {
  dlgPlan.mode = 'create'
  dlgPlan.value = emptyPlan()
  dlgPlan.open = true
}
function openEditPlan (plan) {
  dlgPlan.mode = 'edit'
  dlgPlan.value = JSON.parse(JSON.stringify(plan))
  dlgPlan.open = true
}
function savePlan (p) {
  if (dlgPlan.mode === 'create') {
    plans.value.push({ ...p, id: nextId(plans.value) })
  } else {
    const i = plans.value.findIndex(x => x.id === p.id)
    if (i > -1) plans.value[i] = JSON.parse(JSON.stringify(p))
  }
}

/* ---------- ações ---------- */
function cancelSubscription (row) {
  row.status = 'Cancelado'
}

/* ---------- utils ---------- */
function nextId (arr) { return Math.max(0, ...arr.map(x => x.id || 0)) + 1 }
function cryptoId () { return Math.random().toString(36).slice(2) }

/* ---------- estilos dos cards ---------- */
</script>

<style scoped>
.kpi-card { border-radius: 14px; box-shadow: 0 6px 16px rgba(0,0,0,.06); }
.kpi-icon { width: 56px; height: 56px; border-radius: 12px; display: grid; place-items: center; color: #0b1b13; }
.bg-green  { background: radial-gradient(120px 60px at 80% 10%, rgba(35,181,115,.18), transparent 60%), #E8F7EF; }
.bg-blue   { background: radial-gradient(120px 60px at 70% 20%, rgba(69,92,233,.18),  transparent 60%), #EEF2FF; }
.bg-purple { background: radial-gradient(120px 60px at 70% 20%, rgba(144,97,249,.18), transparent 60%), #F4EDFF; }
.bg-orange { background: radial-gradient(120px 60px at 70% 20%, rgba(255,149,0,.18),  transparent 60%), #FFF4EA; }

.plan-card { border-radius: 16px; box-shadow: 0 12px 22px rgba(0,0,0,.06); }
.btn-gradient { background: linear-gradient(90deg, #8B5CF6 0%, #EC4899 100%); color: #fff; }
</style>
