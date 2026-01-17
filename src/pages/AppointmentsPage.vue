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

    <!-- Lista (paginada no backend) -->
    <q-card flat bordered class="q-mt-md">
      <q-card-section class="row items-center justify-between">
        <div class="text-h6 text-weight-bold">Próximos Agendamentos</div>

        <div class="text-caption text-grey-7">
          Total: {{ meta.total }} • Página {{ meta.page }} de {{ meta.totalPages }}
        </div>
      </q-card-section>

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
                <div class="text-subtitle1 text-weight-medium">
                  {{ a.customer || 'Cliente não informado' }}
                </div>

                <div class="row items-center q-gutter-xs q-mt-xs">
                  <!-- Unidade -->
                  <q-chip dense square icon="store" color="grey-2" text-color="grey-9">
                    {{ a.unit || 'Unidade' }}
                  </q-chip>

                  <q-chip dense square :icon="a.serviceIcon" color="grey-2" text-color="grey-9">
                    {{ a.service }}
                  </q-chip>

                  <q-chip dense square icon="person_outline" color="grey-2" text-color="grey-9">
                    {{ a.collaborator }}
                  </q-chip>
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
                        <q-item clickable @click="view(a)">
                          <q-item-section avatar><q-icon name="visibility" /></q-item-section>
                          <q-item-section>Ver detalhes</q-item-section>
                        </q-item>

                        <q-item v-if="canEdit(a)" clickable @click="reschedule(a)">
                          <q-item-section avatar><q-icon name="event_available" /></q-item-section>
                          <q-item-section>Remarcar</q-item-section>
                        </q-item>

                        <q-separator v-if="canEdit(a)" />

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

      <!-- Paginação -->
      <q-separator />

      <q-card-section class="row items-center justify-between">
        <div class="text-caption text-grey-7">
          Exibindo {{ appointments.length }} de {{ meta.total }}
        </div>

        <q-pagination
          v-model="page"
          :max="meta.totalPages || 1"
          :max-pages="7"
          boundary-numbers
          direction-links
          :disable="loadingList"
          @update:model-value="changePage"
        />
      </q-card-section>
    </q-card>

    <!-- Dialog criar/editar/visualizar -->
    <AppointmentEditorDialog
      v-model="dlg.open"
      :mode="dlg.mode"
      :value="dlg.value"
      :units="unitsForDialog"
      :services="services"
      :staff="staffForDialog"
      :appointments="appointments"
      :staffByServiceId="staffByServiceId"
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
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import AppointmentEditorDialog from 'components/AppointmentEditorDialog.vue'

import { useServicesStore } from 'src/stores/tenant/services'
import { useStaffStore } from 'src/stores/tenant/staff'
import { useUnitsStore } from 'src/stores/tenant/units'
import { useAppointmentsStore } from 'src/stores/tenant/appointments'

defineOptions({ name: 'AppointmentsPage' })

/* ---------------- stores ---------------- */
const servicesStore = useServicesStore()
const staffStore = useStaffStore()
const unitsStore = useUnitsStore()
const appointmentsStore = useAppointmentsStore()

const { services } = storeToRefs(servicesStore)
const { staff } = storeToRefs(staffStore)
const { units } = storeToRefs(unitsStore)
const { appointments, meta, loadingList } = storeToRefs(appointmentsStore)

/* ---------------- units helpers ---------------- */
const unitsForDialog = computed(() =>
  (units.value || []).filter(u => u.is_active === true)
)

const unitById = computed(() => {
  const map = new Map()
  for (const u of (units.value || [])) map.set(Number(u.id), u)
  return map
})

/* ---------------- pagination (backend) ---------------- */
const page = ref(Number(meta.value?.page || 1))

watch(
  () => meta.value?.page,
  (p) => {
    const next = Number(p || 1)
    if (next !== page.value) page.value = next
  }
)

async function changePage (p) {
  const next = Number(p || 1)
  if (next === Number(meta.value?.page || 1)) return
  await appointmentsStore.fetchAppointments({ page: next })
}

/* ---------------- staff/services helpers ---------------- */
const activeStaff = computed(() =>
  (staff.value || []).filter(s => s.status === 'active')
)

const serviceById = computed(() => {
  const map = new Map()
  for (const s of (services.value || [])) map.set(Number(s.id), s)
  return map
})

const staffById = computed(() => {
  const map = new Map()
  for (const p of (staff.value || [])) map.set(Number(p.id), p)
  return map
})

function getStaffForService (serviceId) {
  const s = serviceById.value.get(Number(serviceId))
  const ids = Array.isArray(s?.collaboratorIds) ? s.collaboratorIds.map(Number) : []
  if (!ids.length) return []
  return activeStaff.value.filter(p => ids.includes(Number(p.id)))
}

const staffByServiceId = computed(() => {
  const out = {}
  for (const s of (services.value || [])) {
    out[Number(s.id)] = getStaffForService(s.id)
  }
  return out
})

const staffForDialog = computed(() => {
  const serviceId =
    dlg?.value?.service_id ??
    dlg?.value?.serviceId ??
    null

  if (serviceId) {
    const filtered = getStaffForService(serviceId)
    return filtered.length ? filtered : activeStaff.value
  }

  return activeStaff.value
})

function getServiceIcon (serviceId) {
  const s = serviceById.value.get(Number(serviceId))
  return (typeof s?.icon === 'string' && s.icon.trim()) ? s.icon.trim() : 'content_cut'
}

/* ---------------- appointments (enriched) ---------------- */
const appointmentsEnriched = computed(() => {
  return (appointments.value || []).map(a => {
    const serviceId = Number(a.service_id ?? a.serviceId ?? 0)
    const collabId = Number(a.collaborator_id ?? a.collaboratorId ?? 0)
    const unitId = Number(a.unit_id ?? a.unitId ?? 0)

    const s = serviceById.value.get(serviceId)
    const c = staffById.value.get(collabId)
    const u = unitById.value.get(unitId)

    return {
      ...a,
      unit: u?.name || 'Unidade não encontrada',
      service: s?.title || 'Serviço não encontrado',
      serviceIcon: getServiceIcon(serviceId),
      collaborator: c?.name || 'Colaborador não encontrado',
      customer: a.customer_name ?? a.customerName ?? a.customer ?? ''
    }
  })
})

/* ---------------- dialog (create/edit/view) ---------------- */
const dlg = reactive({
  open: false,
  mode: 'create',
  value: null
})

function openNewAppointment () {
  appointmentsStore.resetCurrentAppointment()
  dlg.mode = 'create'
  dlg.value = null
  dlg.open = true
}

async function onSaveAppointment (payload) {
  let resp
  if (dlg.mode === 'edit' && dlg.value?.id) {
    resp = await appointmentsStore.updateAppointment(dlg.value.id, payload)
  } else {
    resp = await appointmentsStore.createAppointment(payload)
  }

  if (resp?.ok) {
    await appointmentsStore.fetchAppointments({ page: meta.value?.page || 1 })
  }
}

/* ---------------- rules/actions ---------------- */
const todayISO = () => new Date().toISOString().slice(0, 10)

function isPastDate (a) {
  return String(a?.date || '') < todayISO()
}

function isFinalStatus (a) {
  return a?.status === 'done' || a?.status === 'cancelled'
}

function canEdit (a) {
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
    unit_id: a.unit_id ?? a.unitId ?? null,
    service_id: a.service_id ?? a.serviceId ?? null,
    collaborator_id: a.collaborator_id ?? a.collaboratorId ?? null,

    dateBR: isoToBR(a.date),
    start: a.start ?? '',
    end: a.end ?? '',
    price: a.price ?? 0,

    customer_name: a.customer_name ?? a.customerName ?? a.customer ?? '',
    status: a.status ?? 'pending'
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

/* ---------------- cancel dialog ---------------- */
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
    await appointmentsStore.fetchAppointments({ page: meta.value?.page || 1 })
  }
}

/* ---------------- filters (local) ---------------- */
const f = ref({ q: '', status: 'all', collab: 'all', service: 'all', from: '', to: '' })

const statusOpts = [
  { label: 'Todos', value: 'all' },
  { label: 'Pendente', value: 'pending' },
  { label: 'Confirmado', value: 'confirmed' },
  { label: 'Concluído', value: 'done' },
  { label: 'Cancelado', value: 'cancelled' }
]

const statusMap = {
  pending: { label: 'Pendente', bg: 'orange-1', text: 'orange-10' },
  confirmed: { label: 'Confirmado', bg: 'green-1', text: 'green-9' },
  done: { label: 'Concluído', bg: 'grey-2', text: 'grey-9' },
  cancelled: { label: 'Cancelado', bg: 'red-1', text: 'red-10' }
}

const collabOpts = computed(() => {
  const set = Array.from(new Set((appointmentsEnriched.value || []).map(a => a.collaborator)))
    .filter(Boolean)
    .sort()

  return [{ label: 'Todos', value: 'all' }, ...set.map(x => ({ label: x, value: x }))]
})

const serviceOpts = computed(() => {
  const set = Array.from(new Set((appointmentsEnriched.value || []).map(a => a.service)))
    .filter(Boolean)
    .sort()

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

const isoToLocalDate = (iso) => {
  if (!iso) return null
  const [y, m, d] = String(iso).split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d, 12, 0, 0)
}

const fmtDateLong = (iso) => {
  const dt = isoToLocalDate(iso)
  if (!dt) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long'
  }).format(dt)
}

const filteredFlat = computed(() => {
  const q = f.value.q.trim().toLowerCase()
  const from = parseBR(f.value.from)
  const to = parseBR(f.value.to)

  const norm = (dt) => (dt ? new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 12, 0, 0) : null)
  const fromN = norm(from)
  const toN = norm(to)

  return (appointmentsEnriched.value || [])
    .filter(a => {
      const okQ = !q || [a.customer, a.service, a.collaborator, a.unit]
        .some(t => String(t || '').toLowerCase().includes(q))

      const okS = f.value.status === 'all' || a.status === f.value.status
      const okC = f.value.collab === 'all' || a.collaborator === f.value.collab
      const okV = f.value.service === 'all' || a.service === f.value.service

      const d = isoToLocalDate(a.date)
      const okFrom = !fromN || (d && d >= fromN)
      const okTo = !toN || (d && d <= toN)

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

/* ---------------- lifecycle ---------------- */
onMounted(async () => {
  servicesStore.loadFromSession()
  staffStore.loadFromSession?.()
  unitsStore.loadFromSession?.()
  appointmentsStore.loadFromSession?.()

  await Promise.all([
    servicesStore.fetchServices(),
    staffStore.fetchStaff(),
    unitsStore.fetchUnits?.(),
    appointmentsStore.fetchAppointments({ page: meta.value?.page || 1 })
  ])
})
</script>

<style scoped>
.filter-card { border-radius: 14px; box-shadow: 0 6px 16px rgba(0,0,0,.05); }
.item-row {
  border: 1px solid #eef0f3;
  border-radius: 12px;
  padding: 8px 6px;
}
.rounded-borders { border-radius: 12px; }
</style>
