<template>
  <q-page padding class="q-gutter-md">
    <!-- Título -->
    <div>
      <div class="text-h4 text-weight-bold">Receitas do Negócio</div>
      <div class="text-subtitle2 text-grey-7">
        Acompanhe as entradas financeiras do seu estabelecimento
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
        </q-card>
      </div>
    </div>

    <!-- Histórico -->
    <q-card flat bordered class="panel-card q-mt-lg">
      <q-card-section class="row items-center q-col-gutter-sm">
        <div class="text-h6 text-weight-bold">Histórico de Transações</div>
        <q-space />
        <q-btn
          outline color="primary" icon="file_download" label="Exportar CSV"
          @click="exportCsv"
        />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-table
          :rows="rows"
          :columns="columns"
          row-key="id"
          flat
          separator="horizontal"
          :pagination="pagination"
          @update:pagination="val => (pagination = val)"
          :rows-per-page-options="[10, 25, 50]"
        >
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
                :color="statusMap[props.row.status].bg"
                :text-color="statusMap[props.row.status].text"
              />
            </q-td>
          </template>

          <template #no-data>
            <div class="full-width row items-center justify-center q-pa-lg text-grey-7">
              Nenhuma transação registrada ainda.
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'

defineOptions({ name: 'BusinessRevenuesPage' })

/* ---------------- Mock de transações ----------------
   Campos: id, date (DD/MM/YYYY), customer, service, amount, method, status
------------------------------------------------------ */
const rows = ref([
  { id: 't_1001', date: '05/09/2025', customer: 'Carlos Mendes', service: 'Corte + Barba', amount: 49.90, method: 'Pix',         status: 'Pago' },
  { id: 't_1002', date: '05/09/2025', customer: 'João Silva',     service: 'Corte Social',  amount: 25.00, method: 'Credit Card', status: 'Pago' },
  { id: 't_1003', date: '02/09/2025', customer: 'Ana Paula',      service: 'Escova',        amount: 40.00, method: 'Pix',         status: 'Pago' },
  { id: 't_0999', date: '28/08/2025', customer: 'Marcos Lima',    service: 'Barba',         amount: 20.00, method: 'Pix',         status: 'Pago' },
  { id: 't_0998', date: '27/08/2025', customer: 'Julia Souza',    service: 'Hidratação',    amount: 60.00, method: 'Boleto',      status: 'Cancelado' }
])

/* ---------------- KPIs ---------------- */
const money = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const thisMonth = () => {
  const d = new Date()
  return { m: d.getMonth(), y: d.getFullYear() }
}
const toTs = (ddmmyyyy) => {
  const [d,m,y] = ddmmyyyy.split('/').map(Number)
  return new Date(y, m - 1, d)
}

const kpis = computed(() => {
  const total = rows.value
    .filter(r => r.status === 'Pago')
    .reduce((s, r) => s + r.amount, 0)

  const { m, y } = thisMonth()
  const monthPaid = rows.value.filter(r => {
    const d = toTs(r.date)
    return r.status === 'Pago' && d.getMonth() === m && d.getFullYear() === y
  })
  const monthTotal = monthPaid.reduce((s, r) => s + r.amount, 0)

  const txCount = rows.value.length
  const ticket = rows.value.length
    ? rows.value.filter(r => r.status === 'Pago').reduce((s, r) => s + r.amount, 0) /
      Math.max(1, rows.value.filter(r => r.status === 'Pago').length)
    : 0

  return [
    { key: 'total', title: 'Receita Total',     value: money(total), icon: 'attach_money', bg: 'bg-green'  },
    { key: 'mtd',   title: 'Receita Este Mês',  value: money(monthTotal), icon: 'show_chart',   bg: 'bg-blue'   },
    { key: 'tx',    title: 'Total de Transações', value: txCount,    icon: 'shopping_bag', bg: 'bg-purple' },
    { key: 'arpu',  title: 'Ticket Médio',      value: money(ticket), icon: 'event',        bg: 'bg-orange' }
  ]
})

/* ---------------- Tabela ---------------- */
const columns = [
  { name: 'date',    label: 'Data',    field: 'date',    align: 'left', sortable: true },
  { name: 'customer',label: 'Cliente', field: 'customer',align: 'left', sortable: true },
  { name: 'service', label: 'Serviço', field: 'service', align: 'left', sortable: true },
  { name: 'amount',  label: 'Valor',   field: 'amount',  align: 'right',sortable: true },
  { name: 'method',  label: 'Método',  field: 'method',  align: 'left', sortable: true },
  { name: 'status',  label: 'Status',  field: 'status',  align: 'left', sortable: true }
]

const statusMap = {
  Pago:      { bg: 'green-2',  text: 'green-10' },
  Pendente:  { bg: 'yellow-2', text: 'yellow-10' },
  Cancelado: { bg: 'grey-3',   text: 'grey-9' }
}

let pagination = reactive({ page: 1, rowsPerPage: 10, sortBy: 'date', descending: true })

/* ---------------- Export CSV ---------------- */
function exportCsv () {
  const header = ['data','cliente','serviço','valor','método','status']
  const lines = rows.value.map(r =>
    [r.date, r.customer, r.service, String(r.amount).replace('.', ','), r.method, r.status]
  )
  const csv = [header, ...lines].map(l => l.map(v => `"${String(v).replace(/"/g,'""')}"`).join(';')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'receitas.csv'; a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.kpi-card { border-radius: 14px; box-shadow: 0 6px 16px rgba(0,0,0,.06); }
.kpi-icon { width: 56px; height: 56px; border-radius: 12px; display: grid; place-items: center; color: #0b1b13; }
.bg-green  { background: radial-gradient(120px 60px at 80% 10%, rgba(35,181,115,.18), transparent 60%), #E8F7EF; }
.bg-blue   { background: radial-gradient(120px 60px at 70% 20%, rgba(69,92,233,.18),  transparent 60%), #EEF2FF; }
.bg-purple { background: radial-gradient(120px 60px at 70% 20%, rgba(144,97,249,.18), transparent 60%), #F4EDFF; }
.bg-orange { background: radial-gradient(120px 60px at 70% 20%, rgba(255,149,0,.18),  transparent 60%), #FFF4EA; }

.panel-card { border-radius: 14px; box-shadow: 0 6px 16px rgba(0,0,0,.05); }
</style>
