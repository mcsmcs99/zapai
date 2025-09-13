<template>
  <q-page padding class="q-gutter-md">
    <!-- Título -->
    <div class="row items-center justify-between">
      <div>
        <div class="text-h4 text-weight-bold">Agenda de Compromissos</div>
        <div class="text-subtitle2 text-grey-7">
          Visualize todos os agendamentos confirmados
        </div>
      </div>
      <div class="row items-center q-gutter-sm">
        <q-badge color="green-1" text-color="green-9" :label="`${stats.upcoming} futuros`" rounded />
        <q-badge color="indigo-1" text-color="indigo-10" :label="`${stats.today} hoje`" rounded />
        <q-badge color="grey-2" text-color="grey-8" :label="`${filteredFlat.length} listados`" rounded />
      </div>
    </div>

    <!-- Filtros -->
    <q-card flat bordered class="q-mt-sm filter-card">
      <q-card-section class="row q-col-gutter-md items-end">
        <q-input
          class="col-12 col-md-3" dense outlined clearable debounce="250"
          v-model="f.q" placeholder="Buscar por cliente, serviço…">
          <template #prepend><q-icon name="search" /></template>
        </q-input>

        <q-select class="col-6 col-md-2" dense outlined emit-value map-options
          v-model="f.status" :options="statusOpts" label="Status" />

        <q-select class="col-6 col-md-2" dense outlined emit-value map-options
          v-model="f.collab" :options="collabOpts" label="Colaborador" />

        <q-select class="col-6 col-md-2" dense outlined emit-value map-options
          v-model="f.service" :options="serviceOpts" label="Serviço" />

        <!-- Data de / até -->
        <q-input class="col-6 col-md-1" dense outlined v-model="f.from" label="De" mask="##/##/####">
          <template #append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="f.from" mask="DD/MM/YYYY" />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>

        <q-input class="col-6 col-md-1" dense outlined v-model="f.to" label="Até" mask="##/##/####">
          <template #append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="f.to" mask="DD/MM/YYYY" />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>

        <div class="col-12 col-md-auto row q-gutter-sm justify-end">
          <q-btn outline color="grey-8" label="Limpar filtros" @click="resetFilters" />
        </div>
      </q-card-section>
    </q-card>

    <!-- Lista (agrupada por dia) -->
    <q-card flat bordered class="q-mt-md">
      <q-card-section class="text-h6 text-weight-bold">Próximos Agendamentos</q-card-section>
      <q-separator />

      <div v-if="!groups.length" class="q-pa-xl flex flex-center column text-grey-7">
        <q-icon name="event_busy" size="64px" class="q-mb-sm" />
        Nenhum agendamento encontrado com os filtros atuais.
      </div>

      <div v-else class="q-pa-md">
        <div v-for="g in groups" :key="g.key" class="q-mb-md">
          <div class="text-weight-bold text-primary q-mb-sm">
            {{ formatGroupLabel(g.key) }}
          </div>

          <q-list separator>
            <q-item v-for="a in g.items" :key="a.id" class="rounded-borders item-row">
              <q-item-section>
                <div class="text-h6 text-weight-bold">{{ a.start }} - {{ a.end }}</div>
                <div class="text-body1">{{ a.customer }}</div>
                <div class="row items-center q-gutter-sm q-mt-xs text-grey-7">
                  <div class="row items-center">
                    <q-icon name="content_cut" class="q-mr-xs" /> {{ a.service }}
                  </div>
                  <div class="row items-center">
                    <q-icon name="person_outline" class="q-mr-xs" /> {{ a.collaborator }}
                  </div>
                </div>
              </q-item-section>

              <q-item-section side top class="text-right">
                <q-badge :color="statusMap[a.status].bg" :text-color="statusMap[a.status].text"
                         :label="statusMap[a.status].label" rounded />
                <div class="q-mt-sm text-weight-bold text-positive">{{ currency(a.price) }}</div>

                <div class="q-mt-sm">
                  <q-btn flat dense round icon="more_vert">
                    <q-menu>
                      <q-list style="min-width: 170px">
                        <q-item clickable @click="view(a)">
                          <q-item-section avatar><q-icon name="visibility" /></q-item-section>
                          <q-item-section>Ver detalhes</q-item-section>
                        </q-item>
                        <q-item clickable @click="reschedule(a)">
                          <q-item-section avatar><q-icon name="event_available" /></q-item-section>
                          <q-item-section>Remarcar</q-item-section>
                        </q-item>
                        <q-separator />
                        <q-item clickable class="text-negative" @click="cancel(a)">
                          <q-item-section avatar><q-icon name="cancel" /></q-item-section>
                          <q-item-section>Cancelar</q-item-section>
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-btn>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </div>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'

defineOptions({ name: 'AppointmentsPage' })

/* ------- MOCK: substitua por sua API ------- */
const appointments = ref([
  // date ISO (YYYY-MM-DD) + horários (24h)
  { id: 1,  date: '2025-12-22', start: '16:00', end: '16:30', customer: 'Daniel Rocha',  service: 'Corte Social', collaborator: 'João Silva',   status: 'confirmed', price: 25 },
  { id: 2,  date: '2025-12-22', start: '09:00', end: '11:00', customer: 'Beatriz Almeida', service: 'Coloração',   collaborator: 'Maria Santos', status: 'confirmed', price: 120 },
  { id: 3,  date: '2025-12-21', start: '15:30', end: '15:55', customer: 'Ricardo Santos',  service: 'Barba',       collaborator: 'Pedro Oliveira',status: 'confirmed', price: 20 },
  { id: 4,  date: '2025-12-21', start: '10:00', end: '11:30', customer: 'Amanda Costa',    service: 'Escova',      collaborator: 'Carla Mendes', status: 'done',      price: 35 },
  { id: 5,  date: '2025-12-20', start: '14:00', end: '14:30', customer: 'Lucas Prado',     service: 'Corte Social',collaborator: 'João Silva',   status: 'cancelled', price: 25 }
])

/* ------- Filtros ------- */
const f = ref({
  q: '', status: 'all', collab: 'all', service: 'all',
  from: '', to: ''
})
const statusOpts = [
  { label: 'Todos', value: 'all' },
  { label: 'Confirmado', value: 'confirmed' },
  { label: 'Concluído', value: 'done' },
  { label: 'Cancelado', value: 'cancelled' }
]
const statusMap = {
  confirmed: { label: 'Confirmado', bg: 'green-1', text: 'green-9' },
  done:      { label: 'Concluído', bg: 'grey-2',  text: 'grey-9'  },
  cancelled: { label: 'Cancelado', bg: 'red-1',   text: 'red-10'  }
}
const collabOpts = computed(() => {
  const set = Array.from(new Set(appointments.value.map(a => a.collaborator))).sort()
  return [{ label: 'Todos', value: 'all' }, ...set.map(x => ({ label: x, value: x }))]
})
const serviceOpts = computed(() => {
  const set = Array.from(new Set(appointments.value.map(a => a.service))).sort()
  return [{ label: 'Todos', value: 'all' }, ...set.map(x => ({ label: x, value: x }))]
})

/* helpers */
const currency = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0))
const parseBR = (s) => {
  if (!s) return null
  const [d,m,y] = s.split('/').map(Number)
  return new Date(y, m - 1, d)
}
const fmtDateLong = (iso) =>
  new Intl.DateTimeFormat('pt-BR', { weekday:'long', day:'2-digit', month:'long' }).format(new Date(iso))

/* aplica filtros e ordena */
const filteredFlat = computed(() => {
  const q = f.value.q.trim().toLowerCase()
  const from = parseBR(f.value.from)
  const to   = parseBR(f.value.to)

  return appointments.value
    .filter(a => {
      const okQ = !q || [a.customer, a.service, a.collaborator].some(t => t.toLowerCase().includes(q))
      const okS = f.value.status === 'all'  || a.status === f.value.status
      const okC = f.value.collab === 'all'  || a.collaborator === f.value.collab
      const okV = f.value.service === 'all' || a.service === f.value.service

      const d = new Date(a.date)
      const okFrom = !from || d >= from
      const okTo   = !to   || d <= to
      return okQ && okS && okC && okV && okFrom && okTo
    })
    .sort((a,b) => a.date === b.date ? a.start.localeCompare(b.start) : a.date.localeCompare(b.date))
})

/* agrupa por dia */
const groups = computed(() => {
  const map = new Map()
  for (const a of filteredFlat.value) {
    if (!map.has(a.date)) map.set(a.date, [])
    map.get(a.date).push(a)
  }
  return Array.from(map.entries()).map(([key, items]) => ({ key, items }))
})

/* estatísticas rápidas */
const stats = computed(() => {
  const todayISO = new Date().toISOString().slice(0,10)
  const todayCount = filteredFlat.value.filter(a => a.date === todayISO).length
  const upcoming   = filteredFlat.value.filter(a => a.date >= todayISO && a.status !== 'cancelled').length
  return { today: todayCount, upcoming }
})

function resetFilters () {
  f.value = { q: '', status: 'all', collab: 'all', service: 'all', from: '', to: '' }
}

/* ações */
function view(a){ console.log('ver', a) }
function reschedule(a){ console.log('remarcar', a) }
function cancel(a){ console.log('cancelar', a) }

/* rótulo do grupo (ex.: domingo, 22 de dezembro) */
const formatGroupLabel = (iso) => fmtDateLong(iso)
</script>

<style scoped>
.filter-card { border-radius: 14px; box-shadow: 0 6px 16px rgba(0,0,0,.05); }
.item-row { border: 1px solid #eef0f3; }
.rounded-borders { border-radius: 12px; }
</style>
