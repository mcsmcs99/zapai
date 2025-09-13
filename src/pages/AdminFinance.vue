<template>
  <q-page padding class="q-gutter-md">

    <!-- Título -->
    <div>
      <div class="text-h4 text-weight-bold">Finanças - Administração</div>
      <div class="text-subtitle2 text-grey-7">
        Monitore receitas e pagamentos de todos os clientes
      </div>
    </div>

    <!-- KPIs -->
    <div class="row q-col-gutter-lg q-mt-md">
      <div v-for="card in kpis" :key="card.key" class="col-12 col-sm-6 col-md-3">
        <q-card class="kpi-card">
          <q-card-section class="row items-center no-wrap">
            <div class="kpi-icon" :class="card.bg">
              <q-icon :name="card.icon" size="26px"/>
            </div>
            <div class="q-ml-md">
              <div class="text-subtitle2 text-grey-7">{{ card.title }}</div>
              <div class="text-h5 text-weight-bold">{{ card.value }}</div>
            </div>
          </q-card-section>
          <q-separator/>
          <q-card-section class="q-pt-sm">
            <q-badge v-if="card.badge" :label="card.badge" color="grey-2" text-color="grey-9" rounded/>
            <div v-else class="text-caption text-grey-7">{{ card.note }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Painel principal -->
    <q-card flat bordered class="panel-card q-mt-lg">

      <!-- Cabeçalho do painel + ações -->
      <q-card-section class="row items-center q-col-gutter-sm">
        <div class="col-auto row items-center q-gutter-sm">
          <q-icon name="payments" color="positive" />
          <div class="text-h6 text-weight-bold">Todos os Pagamentos</div>
        </div>

        <q-space />

        <q-btn
          outline color="primary" icon="file_download" label="Exportar CSV"
          @click="exportCsv"
        />
      </q-card-section>

      <q-separator />

      <!-- FILTROS -->
      <q-card-section class="q-gutter-md">

        <div class="row q-col-gutter-md">
          <q-input
            class="col-12 col-md-3"
            dense outlined clearable debounce="300"
            v-model="filters.q"
            placeholder="Buscar (cliente, email, id)"
          >
            <template #prepend><q-icon name="search" /></template>
          </q-input>

          <q-select
            class="col-6 col-md-2"
            dense outlined emit-value map-options
            v-model="filters.status"
            :options="statusOptions" label="Status"
          />

          <q-select
            class="col-6 col-md-2"
            dense outlined emit-value map-options
            v-model="filters.method"
            :options="methodOptions" label="Método"
          />

          <q-select
            class="col-6 col-md-2"
            dense outlined emit-value map-options
            v-model="filters.plan"
            :options="planOptions" label="Plano"
          />

          <!-- Data (período) -->
          <q-input class="col-6 col-md-3" dense outlined
                   v-model="dateLabel" label="Período" readonly clearable
                   @clear="clearDates">
            <template #append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="filters.dates" range mask="DD/MM/YYYY" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>

        <div class="row q-col-gutter-md">
          <q-input class="col-6 col-md-2" dense outlined v-model.number="filters.min"
                   type="number" min="0" label="Valor mín (R$)" />
          <q-input class="col-6 col-md-2" dense outlined v-model.number="filters.max"
                   type="number" min="0" label="Valor máx (R$)" />

          <!-- atalhos rápidos de data -->
          <div class="col-12 col-md-8 row items-center q-gutter-xs">
            <div class="text-caption text-grey-7 q-mr-xs">Rápido:</div>
            <q-chip clickable @click="quickRange(7)">Últimos 7 dias</q-chip>
            <q-chip clickable @click="quickRange(30)">Últimos 30 dias</q-chip>
            <q-chip clickable @click="quickRange(90)">Últimos 90 dias</q-chip>
            <q-space />
            <q-btn flat color="grey-8" icon="clear_all" label="Limpar filtros" @click="resetFilters" />
          </div>
        </div>

        <!-- Chips de filtros ativos -->
        <div v-if="activeChips.length" class="row q-gutter-xs">
          <q-chip
            v-for="c in activeChips"
            :key="c.key"
            removable
            @remove="c.remove()"
            color="grey-2"
            text-color="grey-9"
          >{{ c.label }}</q-chip>
        </div>
      </q-card-section>

      <q-separator />

      <!-- TABELA -->
      <q-card-section>
        <q-table
          :rows="filteredRows"
          :columns="columns"
          row-key="id"
          flat
          separator="horizontal"
          :pagination="pagination"
          @update:pagination="val => (pagination = val)"
          :loading="loading"
          binary-state-sort
          :rows-per-page-options="[10, 25, 50]"
        >
          <!-- colunas especiais -->
          <template #body-cell-customer="props">
            <q-td :props="props">
              <div class="text-weight-medium">{{ props.row.customer }}</div>
              <div class="text-caption text-grey-7 ellipsis">{{ props.row.email || props.row.customerId }}</div>
            </q-td>
          </template>

          <template #body-cell-amount="props">
            <q-td :props="props" class="text-weight-medium text-positive">
              {{ money(props.row.amount) }}
            </q-td>
          </template>

          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge
                rounded
                :label="props.row.status"
                :color="statusMap[props.row.status]?.bg || 'grey-2'"
                :text-color="statusMap[props.row.status]?.text || 'grey-9'"
              />
            </q-td>
          </template>

          <template #no-data>
            <div class="full-width row items-center justify-center q-pa-lg text-grey-7">
              Nenhum pagamento encontrado com os filtros atuais.
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'

defineOptions({ name: 'AdminFinancePage' })

/* --------------------- MOCK / troque pela sua API --------------------- */
const rows = ref([
  { id: 'p_1', customer: '68ac3b2dfd0cadf016e7e312', email: '',  customerId: '68ac3b2…', plan: 'Plano Básico', amount: 49.90, status: 'Pendente', method: 'Pix',         date: '28/08/2025' },
  { id: 'p_2', customer: 'user1',                       email: 'user1@dom.com', customerId: 'user1', plan: 'N/A',         amount: 99.90, status: 'Pendente', method: 'Credit Card', date: '28/08/2025' },
  { id: 'p_3', customer: 'user1',                       email: 'user1@dom.com', customerId: 'user1', plan: 'N/A',         amount: 49.90, status: 'Pago',     method: 'Pix',         date: '28/08/2025' }
])

/* -------------------------- KPIs -------------------------- */
const money = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const kpis = computed(() => {
  const total = rows.value.reduce((s, r) => s + r.amount, 0)
  const pend  = rows.value.filter(r => r.status === 'Pendente').length
  const ativos = new Set(rows.value.map(r => r.customer)).size
  return [
    { key: 'total', title: 'Receita Total',     value: money(total), icon: 'attach_money', note: '↑ Crescimento constante', bg: 'bg-green' },
    { key: 'mtd',   title: 'Receita Este Mês',  value: money(0),     icon: 'show_chart',  note: 'vs mês anterior',         bg: 'bg-blue'  },
    { key: 'pend',  title: 'Pagamentos Pendentes', value: pend,      icon: 'credit_card', badge: 'Requer atenção',         bg: 'bg-orange'},
    { key: 'active',title: 'Clientes Ativos',   value: ativos,       icon: 'groups',      badge: 'Base crescente',         bg: 'bg-purple'}
  ]
})

/* -------------------------- Filtros -------------------------- */
const filters = reactive({
  q: '',
  status: 'all',
  method: 'all',
  plan: 'all',
  dates: null, // {from:'DD/MM/YYYY', to:'DD/MM/YYYY'}
  min: null,
  max: null
})

const statusOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Pago', value: 'Pago' },
  { label: 'Pendente', value: 'Pendente' },
  { label: 'Cancelado', value: 'Cancelado' },
  { label: 'Falhou', value: 'Falhou' }
]
const methodOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Pix', value: 'Pix' },
  { label: 'Credit Card', value: 'Credit Card' },
  { label: 'Boleto', value: 'Boleto' }
]
const planOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Plano Básico', value: 'Plano Básico' },
  { label: 'Plano Profissional', value: 'Plano Profissional' },
  { label: 'N/A', value: 'N/A' }
]

const dateLabel = computed(() => {
  const d = filters.dates
  if (!d || !d.from || !d.to) return ''
  return `${d.from} — ${d.to}`
})
function clearDates () { filters.dates = null }

function resetFilters () {
  Object.assign(filters, { q: '', status: 'all', method: 'all', plan: 'all', dates: null, min: null, max: null })
}

/* Chips de filtros ativos (UX) */
const activeChips = computed(() => {
  const chips = []
  if (filters.q) chips.push({ key:'q', label:`Busca: ${filters.q}`, remove: () => (filters.q = '') })
  if (filters.status !== 'all') chips.push({ key:'s', label:`Status: ${filters.status}`, remove: () => (filters.status = 'all') })
  if (filters.method !== 'all') chips.push({ key:'m', label:`Método: ${filters.method}`, remove: () => (filters.method = 'all') })
  if (filters.plan !== 'all') chips.push({ key:'p', label:`Plano: ${filters.plan}`, remove: () => (filters.plan = 'all') })
  if (filters.dates?.from && filters.dates?.to) chips.push({ key:'d', label:`Período: ${dateLabel.value}`, remove: clearDates })
  if (filters.min != null) chips.push({ key:'min', label:`Min: ${money(filters.min)}`, remove: () => (filters.min = null) })
  if (filters.max != null) chips.push({ key:'max', label:`Max: ${money(filters.max)}`, remove: () => (filters.max = null) })
  return chips
})

/* Helpers de data (DD/MM/YYYY -> timestamp) */
function toTs (ddmmyyyy) {
  const [d, m, y] = ddmmyyyy.split('/').map(n => +n)
  return new Date(y, m - 1, d).getTime()
}

/* Filtro principal */
const filteredRows = computed(() => {
  const q = filters.q.trim().toLowerCase()
  return rows.value.filter(r => {
    const okQ  = !q || [r.customer, r.email, r.customerId, r.id].some(v => (v || '').toLowerCase().includes(q))
    const okS  = filters.status === 'all' || r.status === filters.status
    const okM  = filters.method === 'all' || r.method === filters.method
    const okP  = filters.plan   === 'all' || r.plan   === filters.plan
    const okMin = filters.min == null || r.amount >= Number(filters.min)
    const okMax = filters.max == null || r.amount <= Number(filters.max)
    let okDate = true
    if (filters.dates?.from && filters.dates?.to) {
      const ts = toTs(r.date)
      okDate = ts >= toTs(filters.dates.from) && ts <= toTs(filters.dates.to)
    }
    return okQ && okS && okM && okP && okMin && okMax && okDate
  })
})

function quickRange (days) {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - days + 1)
  const fmt = (d) => String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + d.getFullYear()
  filters.dates = { from: fmt(start), to: fmt(end) }
}

/* -------------------------- Tabela -------------------------- */
const loading = ref(false)
let pagination = reactive({ page: 1, rowsPerPage: 10, sortBy: 'date', descending: true })

const columns = [
  { name: 'customer', label: 'Cliente',    field: 'customer', align: 'left', sortable: true },
  { name: 'plan',     label: 'Plano',      field: 'plan',     align: 'left', sortable: true },
  { name: 'amount',   label: 'Valor',      field: 'amount',   align: 'right',sortable: true },
  { name: 'status',   label: 'Status',     field: 'status',   align: 'left', sortable: true },
  { name: 'method',   label: 'Método',     field: 'method',   align: 'left', sortable: true },
  { name: 'date',     label: 'Data',       field: 'date',     align: 'left', sortable: true }
]

const statusMap = {
  Pago:     { bg: 'green-2',  text: 'green-10' },
  Pendente: { bg: 'yellow-2', text: 'yellow-10' },
  Cancelado:{ bg: 'grey-3',   text: 'grey-9' },
  Falhou:   { bg: 'red-2',    text: 'red-10' }
}

/* -------------------------- Export CSV -------------------------- */
function exportCsv () {
  const header = ['id','cliente','email','plano','valor','status','método','data']
  const lines = filteredRows.value.map(r =>
    [r.id, r.customer, r.email || '', r.plan, String(r.amount).replace('.', ','), r.status, r.method, r.date]
  )
  const csv = [header, ...lines].map(l => l.map(v => `"${String(v).replace(/"/g,'""')}"`).join(';')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'pagamentos.csv'; a.click()
  URL.revokeObjectURL(url)
}

/* Exemplo: reprocessar KPIs quando filtros mudam (opcional) */
watch(filteredRows, () => { /* recalcular coisas específicas se quiser */ })
</script>

<style scoped>
.kpi-card { border-radius: 14px; box-shadow: 0 6px 16px rgba(0,0,0,.06); }
.kpi-icon { width: 56px; height: 56px; border-radius: 12px; display: grid; place-items: center; color: #0b1b13; }
.bg-green  { background: radial-gradient(120px 60px at 80% 10%, rgba(35,181,115,.18), transparent 60%), #E8F7EF; }
.bg-blue   { background: radial-gradient(120px 60px at 70% 20%, rgba(69,92,233,.18),  transparent 60%), #EEF2FF; }
.bg-purple { background: radial-gradient(120px 60px at 70% 20%, rgba(144,97,249,.18), transparent 60%), #F4EDFF; }
.bg-orange { background: radial-gradient(120px 60px at 70% 20%, rgba(255,149,0,.18),  transparent 60%), #FFF4EA; }

.panel-card { border-radius: 14px; box-shadow: 0 6px 16px rgba(0,0,0,.05); }
.ellipsis { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
</style>
