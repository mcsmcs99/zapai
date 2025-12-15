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
        <q-btn
          color="primary"
          icon="add"
          label="Novo agendamento"
          rounded
          unelevated
          @click="openNewAppointment"
        />

        <q-badge color="green-1" text-color="green-9" :label="`${stats.upcoming} futuros`" rounded />
        <q-badge color="indigo-1" text-color="indigo-10" :label="`${stats.today} hoje`" rounded />
        <q-badge color="grey-2" text-color="grey-8" :label="`${filteredFlat.length} listados`" rounded />
      </div>
    </div>

    <!-- Filtros -->
    <q-card flat bordered class="q-mt-sm filter-card">
      <q-card-section class="row q-col-gutter-md items-end">
        <q-input
          class="col-12 col-md-3"
          dense
          outlined
          clearable
          debounce="250"
          v-model="f.q"
          placeholder="Buscar por cliente, serviço…"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>

        <q-select
          class="col-6 col-md-2"
          dense
          outlined
          emit-value
          map-options
          v-model="f.status"
          :options="statusOpts"
          label="Status"
        />

        <q-select
          class="col-6 col-md-2"
          dense
          outlined
          emit-value
          map-options
          v-model="f.collab"
          :options="collabOpts"
          label="Colaborador"
        />

        <q-select
          class="col-6 col-md-2"
          dense
          outlined
          emit-value
          map-options
          v-model="f.service"
          :options="serviceOpts"
          label="Serviço"
        />

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
                <q-badge
                  :color="statusMap[a.status]?.bg || 'grey-2'"
                  :text-color="statusMap[a.status]?.text || 'grey-9'"
                  :label="statusMap[a.status]?.label || a.status"
                  rounded
                />
                <div class="q-mt-sm text-weight-bold text-positive">
                  {{ currency(a.price) }}
                </div>

                <div class="q-mt-sm">
                  <q-btn flat dense round icon="more_vert">
                    <q-menu>
                      <q-list style="min-width: 170px">
                        <!-- sempre -->
                        <q-item clickable @click="view(a)">
                          <q-item-section avatar><q-icon name="visibility" /></q-item-section>
                          <q-item-section>Ver detalhes</q-item-section>
                        </q-item>

                        <!-- só se puder editar -->
                        <q-item v-if="canEdit(a)" clickable @click="reschedule(a)">
                          <q-item-section avatar><q-icon name="event_available" /></q-item-section>
                          <q-item-section>Remarcar</q-item-section>
                        </q-item>

                        <q-separator v-if="canEdit(a)" />

                        <!-- só se puder editar -->
                        <q-item v-if="canEdit(a)" clickable class="text-negative" @click="cancel(a)">
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

    <!-- Dialog criar/editar/visualizar -->
    <AppointmentEditorDialog
      v-model="dlg.open"
      :mode="dlg.mode"
      :value="dlg.value"
      :services="services"
      :staff="staff"
      :appointments="appointments"
      @save="onSaveAppointment"
    />

    <!-- Dialog cancelar -->
    <q-dialog v-model="cancelDlg.open">
      <q-card style="min-width:360px">
        <q-card-section class="row items-center q-gutter-sm">
          <q-icon name="warning" color="negative" />
          <div class="text-subtitle1 text-weight-bold">Cancelar agendamento</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          Tem certeza que deseja cancelar este agendamento
          <b>{{ cancelDlg.row?.start }} - {{ cancelDlg.row?.end }}</b>
          de <b>{{ cancelDlg.row?.customer }}</b>?
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Voltar" v-close-popup />
          <q-btn color="negative" label="Cancelar agendamento" @click="confirmCancel" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import AppointmentEditorDialog from 'components/AppointmentEditorDialog.vue'

import { useServicesStore } from 'src/stores/tenant/services'
import { useStaffStore } from 'src/stores/tenant/staff'
import { useAppointmentsStore } from 'src/stores/tenant/appointments'

defineOptions({ name: 'AppointmentsPage' })

const servicesStore = useServicesStore()
const staffStore = useStaffStore()
const appointmentsStore = useAppointmentsStore()

const { services } = storeToRefs(servicesStore)
const { staff } = storeToRefs(staffStore)
const { appointments } = storeToRefs(appointmentsStore)

/* -------- dialog (create/edit/view) -------- */
const dlg = reactive({
  open: false,
  mode: 'create', // 'create' | 'edit' | 'view'
  value: null
})

function openNewAppointment () {
  dlg.mode = 'create'
  dlg.value = null
  dlg.open = true
}

async function onSaveAppointment (payload) {
  // create/edit dependendo do mode
  let resp
  if (dlg.mode === 'edit' && dlg.value?.id) {
    resp = await appointmentsStore.updateAppointment(dlg.value.id, payload)
  } else {
    resp = await appointmentsStore.createAppointment(payload)
  }

  if (resp?.ok) {
    await appointmentsStore.fetchAppointments()
  }
}

/* -------- regras de ações -------- */
const todayISO = () => new Date().toISOString().slice(0, 10)

function isPastDate (a) {
  return String(a?.date || '') < todayISO()
}

function isFinalStatus (a) {
  return a?.status === 'done' || a?.status === 'cancelled'
}

function canEdit (a) {
  // hoje/futuro e não finalizado/cancelado
  return !isPastDate(a) && !isFinalStatus(a)
}

/* helper: converte item da lista -> formato do dialog */
const isoToBR = (iso) => {
  if (!iso) return ''
  const [y, m, d] = String(iso).split('-')
  if (!y || !m || !d) return ''
  return `${d}/${m}/${y}`
}

function mapRowToDialogValue (a) {
  return {
    id: a.id,

    // ✅ fallbacks
    service_id: a.service_id ?? a.serviceId ?? null,
    collaborator_id: a.collaborator_id ?? a.collaboratorId ?? null,

    dateBR: isoToBR(a.date),
    start: a.start ?? '',
    customer_name: a.customer_name ?? a.customerName ?? a.customer ?? ''
  }
}

/* ações do menu */
function view (a) {
  dlg.mode = 'view'
  dlg.value = mapRowToDialogValue(a)
  dlg.open = true
}

function reschedule (a) {
  dlg.mode = 'edit'
  dlg.value = mapRowToDialogValue(a)
  dlg.open = true
}

/* cancelar */
const cancelDlg = reactive({ open: false, row: null })

function cancel (a) {
  cancelDlg.row = a
  cancelDlg.open = true
}

async function confirmCancel () {
  if (!cancelDlg.row?.id) return

  const resp = await appointmentsStore.updateAppointment(cancelDlg.row.id, {
    status: 'cancelled'
  })

  if (resp?.ok) {
    cancelDlg.open = false
    cancelDlg.row = null
    await appointmentsStore.fetchAppointments()
  }
}

/* ------- Filtros / listagem ------- */
const f = ref({ q: '', status: 'all', collab: 'all', service: 'all', from: '', to: '' })

const statusOpts = [
  { label: 'Todos', value: 'all' },
  { label: 'Pendente', value: 'pending' },
  { label: 'Confirmado', value: 'confirmed' },
  { label: 'Concluído', value: 'done' },
  { label: 'Cancelado', value: 'cancelled' }
]
const statusMap = {
  pending:   { label: 'Pendente',   bg: 'orange-1', text: 'orange-10' },
  confirmed: { label: 'Confirmado', bg: 'green-1',  text: 'green-9' },
  done:      { label: 'Concluído',  bg: 'grey-2',   text: 'grey-9' },
  cancelled: { label: 'Cancelado',  bg: 'red-1',    text: 'red-10' }
}

const collabOpts = computed(() => {
  // agora usa o nome exibido (a.collaborator) só pra filtro
  const set = Array.from(new Set((appointments.value || []).map(a => a.collaborator))).filter(Boolean).sort()
  return [{ label: 'Todos', value: 'all' }, ...set.map(x => ({ label: x, value: x }))]
})

const serviceOpts = computed(() => {
  const set = Array.from(new Set((appointments.value || []).map(a => a.service))).filter(Boolean).sort()
  return [{ label: 'Todos', value: 'all' }, ...set.map(x => ({ label: x, value: x }))]
})

const currency = v =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0))

const parseBR = (s) => {
  if (!s) return null
  const [d, m, y] = s.split('/').map(Number)
  if (!d || !m || !y) return null
  return new Date(y, m - 1, d)
}

const fmtDateLong = (iso) =>
  new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date(iso))

const filteredFlat = computed(() => {
  const q = f.value.q.trim().toLowerCase()
  const from = parseBR(f.value.from)
  const to = parseBR(f.value.to)

  return (appointments.value || [])
    .filter(a => {
      const okQ = !q || [a.customer, a.service, a.collaborator].some(t => String(t || '').toLowerCase().includes(q))
      const okS = f.value.status === 'all' || a.status === f.value.status
      const okC = f.value.collab === 'all' || a.collaborator === f.value.collab
      const okV = f.value.service === 'all' || a.service === f.value.service

      const d = new Date(a.date)
      const okFrom = !from || d >= from
      const okTo = !to || d <= to
      return okQ && okS && okC && okV && okFrom && okTo
    })
    .sort((a, b) => (a.date === b.date ? a.start.localeCompare(b.start) : a.date.localeCompare(b.date)))
})

const groups = computed(() => {
  const map = new Map()
  for (const a of filteredFlat.value) {
    if (!map.has(a.date)) map.set(a.date, [])
    map.get(a.date).push(a)
  }
  return Array.from(map.entries()).map(([key, items]) => ({ key, items }))
})

const stats = computed(() => {
  const tISO = todayISO()
  const todayCount = filteredFlat.value.filter(a => a.date === tISO).length
  const upcoming = filteredFlat.value.filter(a => a.date >= tISO && a.status !== 'cancelled').length
  return { today: todayCount, upcoming }
})

function resetFilters () {
  f.value = { q: '', status: 'all', collab: 'all', service: 'all', from: '', to: '' }
}

const formatGroupLabel = (iso) => fmtDateLong(iso)

/* ------- lifecycle ------- */
onMounted(async () => {
  servicesStore.loadFromSession()
  staffStore.loadFromSession?.()
  appointmentsStore.loadFromSession?.()

  await servicesStore.fetchServices()
  await staffStore.fetchStaff()
  await appointmentsStore.fetchAppointments()
})
</script>

<style scoped>
.filter-card { border-radius: 14px; box-shadow: 0 6px 16px rgba(0,0,0,.05); }
.item-row { border: 1px solid #eef0f3; }
.rounded-borders { border-radius: 12px; }
</style>
