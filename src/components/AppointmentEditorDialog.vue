<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    persistent
  >
    <q-card class="editor-card">
      <!-- Header -->
      <q-card-section class="row items-center q-gutter-sm">
        <q-icon name="event" color="primary" />
        <div class="text-subtitle1 text-weight-bold">{{ title }}</div>
        <q-space />
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <q-separator />

      <q-form class="q-pa-md" @submit.prevent="onSubmit">
        <div class="q-pa-md rounded-borders bg-grey-1" style="border:1px solid #ECECEC">

          <!-- Serviço -->
          <q-select
            v-model="local.service_id"
            :options="serviceOptions"
            emit-value
            map-options
            outlined
            dense
            clearable
            label="Serviço *"
            :disable="isView"
            :rules="[v => !!v || 'Selecione um serviço']"
          />

          <!-- Colaborador -->
          <q-select
            class="q-mt-md"
            v-model="local.collaborator_id"
            :options="collaboratorOptions"
            emit-value
            map-options
            outlined
            dense
            clearable
            label="Colaborador *"
            :disable="isView || !local.service_id"
            :rules="[v => !!v || 'Selecione um colaborador']"
          />

          <!-- Data -->
          <q-input
            class="q-mt-md"
            v-model="local.dateBR"
            outlined
            dense
            label="Data *"
            mask="##/##/####"
            clearable
            readonly
            input-class="cursor-pointer"
            :disable="isView || !local.service_id || !local.collaborator_id"
            :rules="[
              v => !!parseBR(v) || 'Informe uma data válida',
              v => {
                const iso = toISOFromBR(v)
                return !iso || iso >= minDateISO || 'Não é permitido selecionar uma data anterior a hoje'
              }
            ]"
          >
            <template #append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date
                    v-model="local.dateBR"
                    mask="DD/MM/YYYY"
                    :options="dateOptions"
                    :default-year-month="minDateISO.slice(0, 7)"
                  />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <!-- Horários -->
          <div class="q-mt-md slots-wrap">
            <div class="text-caption text-grey-7 q-mb-xs">Horário *</div>

            <q-banner
              v-if="!canShowSlots"
              rounded
              class="bg-grey-2 text-grey-9"
            >
              Selecione <b>serviço</b>, <b>colaborador</b> e <b>data</b> para ver os horários.
            </q-banner>

            <q-banner
              v-else-if="slotOptions.length === 0"
              rounded
              class="bg-red-1 text-red-10"
            >
              Nenhum horário disponível para este dia/colaborador.
            </q-banner>

            <q-option-group
              v-else
              v-model="local.start"
              type="radio"
              :options="slotOptions"
              class="slots-group"
              :disable="isView"
            />
          </div>

          <!-- Cliente (nome) -->
          <q-input
            class="q-mt-md"
            v-model="local.customer_name"
            outlined
            dense
            label="Cliente *"
            placeholder="Ex.: João da Silva"
            :disable="isView || !local.start || mode === 'edit'"
            :rules="[v => !!v || 'Informe o nome do cliente']"
            clearable
          />
        </div>

        <!-- Actions -->
        <div class="row justify-end q-gutter-sm q-mt-lg">
          <q-btn flat :label="isView ? 'Fechar' : 'Cancelar'" v-close-popup />

          <q-btn
            v-if="!isView"
            color="primary"
            icon="check"
            label="Confirmar"
            type="submit"
            :disable="!canSubmit"
          />
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { reactive, watch, computed } from 'vue'

defineOptions({ name: 'AppointmentEditorDialog' })

const props = defineProps({
  modelValue: { type: Boolean, default: false },

  mode: { type: String, default: 'create' }, // 'create' | 'edit' | 'view'
  value: { type: Object, default: null },

  services: { type: Array, default: () => [] },
  staff: { type: Array, default: () => [] },
  appointments: { type: Array, default: () => [] },

  // ✅ opcional (se você passar da page, ajuda, mas não é obrigatório)
  staffByServiceId: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['update:modelValue', 'save'])

const isView = computed(() => props.mode === 'view')
const title = computed(() => {
  if (props.mode === 'edit') return 'Remarcar agendamento'
  if (props.mode === 'view') return 'Detalhes do agendamento'
  return 'Novo agendamento'
})

const local = reactive({
  service_id: null,
  collaborator_id: null,
  dateBR: '',
  start: '',
  customer_name: ''
})

function resetLocal () {
  local.service_id = null
  local.collaborator_id = null
  local.dateBR = ''
  local.start = ''
  local.customer_name = ''
}

function fillFromValue (v) {
  local.service_id = v?.service_id ?? v?.serviceId ?? null
  local.collaborator_id = v?.collaborator_id ?? v?.collaboratorId ?? null
  local.dateBR = v?.dateBR ?? ''
  local.start = v?.start ?? ''
  local.customer_name = v?.customer_name ?? v?.customerName ?? ''
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return

    if (props.value) {
      fillFromValue(props.value)
      return
    }

    resetLocal()
    local.dateBR = todayBR()
  }
)

// opcional: se trocar dlg.value com o dialog aberto
watch(
  () => props.value,
  (v) => {
    if (props.modelValue && v) fillFromValue(v)
  }
)

/* helpers */
const parseBR = (s) => {
  if (!s) return null
  const [d, m, y] = s.split('/').map(Number)
  if (!d || !m || !y) return null
  return new Date(y, m - 1, d)
}
const toISOFromBR = (s) => {
  const d = parseBR(s)
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}
const weekdayKeyFromISO = (iso) => {
  const d = new Date(iso + 'T00:00:00')
  const map = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  return map[d.getDay()]
}
const toMin = (hhmm) => {
  const [h, m] = String(hhmm || '0:0').split(':').map(Number)
  return (h * 60) + (m || 0)
}
const toHHMM = (mins) => {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
const pad2 = (n) => String(n).padStart(2, '0')
const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}
const minDateISO = computed(() => todayISO())
// QDate: permite somente dias >= hoje
const dateOptions = (iso) => iso >= minDateISO.value
const todayBR = () => {
  const d = new Date()
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`
}

/* dados derivados */
const activeServices = computed(() => (props.services || []).filter(s => s.status === 'active'))
const activeStaff = computed(() => (props.staff || []).filter(s => s.status === 'active'))

const serviceOptions = computed(() =>
  activeServices.value.map(s => ({ label: s.title, value: s.id }))
)

const selectedService = computed(() => {
  const id = local.service_id
  if (!id) return null
  return activeServices.value.find(s => Number(s.id) === Number(id)) || null
})

const selectedCollaborator = computed(() => {
  const id = local.collaborator_id
  if (!id) return null
  return activeStaff.value.find(c => Number(c.id) === Number(id)) || null
})

/**
 * ✅ normaliza ids vindos do serviço:
 * - novo: collaboratorIds (array)
 * - legado: collaborator_ids (array/json)
 */
function getServiceCollaboratorIds (service) {
  if (!service) return []
  const raw =
    service.collaboratorIds ??
    service.collaborator_ids ??
    []

  if (Array.isArray(raw)) return raw.map(Number).filter(n => Number.isFinite(n))

  // fallback: se vier string JSON ou CSV
  if (typeof raw === 'string') {
    const s = raw.trim()
    if (!s) return []
    try {
      const j = JSON.parse(s)
      if (Array.isArray(j)) return j.map(Number).filter(n => Number.isFinite(n))
    } catch (e) {console.warn(e)}
    return s
      .split(',')
      .map(x => Number(String(x).trim()))
      .filter(n => Number.isFinite(n))
  }

  return []
}

const collaboratorOptions = computed(() => {
  if (!selectedService.value) return []

  // ✅ se a page mandou mapa pronto, usa (não é obrigatório)
  const mapped = props.staffByServiceId?.[Number(selectedService.value.id)]
  if (Array.isArray(mapped) && mapped.length) {
    return mapped.map(c => ({ label: c.name, value: c.id }))
  }

  const ids = new Set(getServiceCollaboratorIds(selectedService.value))
  return activeStaff.value
    .filter(c => ids.has(Number(c.id)))
    .map(c => ({ label: c.name, value: c.id }))
})

/**
 * ✅ resets encadeados:
 * - trocou serviço -> zera colaborador e dependências
 * - trocou colaborador -> zera data e slots
 * - trocou data -> zera slot
 *
 * (mantém as lógicas atuais, só evita ficar com seleção inválida)
 */
watch(
  () => local.service_id,
  (newVal, oldVal) => {
    if (!props.modelValue) return
    if (Number(newVal || 0) === Number(oldVal || 0)) return

    local.collaborator_id = null
    local.dateBR = props.mode === 'create' ? todayBR() : ''
    local.start = ''
  }
)

watch(
  () => local.collaborator_id,
  (newVal, oldVal) => {
    if (!props.modelValue) return
    if (Number(newVal || 0) === Number(oldVal || 0)) return

    // colaborador muda -> data/slot precisam ser revalidos
    local.dateBR = props.mode === 'create' ? todayBR() : local.dateBR
    local.start = ''
  }
)

watch(
  () => local.dateBR,
  (newVal, oldVal) => {
    if (!props.modelValue) return
    if (String(newVal || '') === String(oldVal || '')) return
    local.start = ''
  }
)

/** se o colaborador selecionado não estiver mais disponível para o serviço, limpa */
watch(
  () => collaboratorOptions.value,
  (opts) => {
    if (!local.collaborator_id) return
    const ok = (opts || []).some(o => Number(o.value) === Number(local.collaborator_id))
    if (!ok) {
      local.collaborator_id = null
      local.start = ''
    }
  }
)

const canShowSlots = computed(() =>
  !!local.service_id && !!local.collaborator_id && !!toISOFromBR(local.dateBR)
)

const currentAppointmentId = computed(() => props.value?.id ?? null)

const busyRanges = computed(() => {
  if (!canShowSlots.value) return []

  const dateISO = toISOFromBR(local.dateBR)

  const list = Array.isArray(props.appointments)
    ? props.appointments
    : (props.appointments?.data || [])

  return list
    .filter(a => {
      const aDate = a.date
      const aStatus = a.status
      const isActive = aStatus !== 'cancelled'

      const aCollabId = (a.collaborator_id ?? a.collaboratorId)
      const sameCollab = Number(aCollabId) === Number(local.collaborator_id)
      const sameDay = aDate === dateISO

      const isSameRecord =
        currentAppointmentId.value &&
        Number(a.id) === Number(currentAppointmentId.value)

      return sameDay && sameCollab && isActive && !isSameRecord
    })
    .map(a => ({
      startMin: toMin(a.start),
      endMin: toMin(a.end)
    }))
    .filter(r => Number.isFinite(r.startMin) && Number.isFinite(r.endMin) && r.endMin > r.startMin)
})

function overlapsAnyBusy (startMin, endMin) {
  for (const b of busyRanges.value) {
    if (startMin < b.endMin && endMin > b.startMin) return true
  }
  return false
}

const slotOptions = computed(() => {
  if (!canShowSlots.value) return []

  const service = selectedService.value
  const collab = selectedCollaborator.value
  if (!service || !collab) return []

  const duration = Number(service.duration || 0)
  if (!duration || duration <= 0) return []

  const dateISO = toISOFromBR(local.dateBR)
  const dayKey = weekdayKeyFromISO(dateISO)
  const day = (collab.schedule || {})[dayKey]

  if (!day || day.closed) return []

  const isToday = dateISO === todayISO()
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const slots = []

  for (const it of (day.intervals || [])) {
    const start = toMin(it.start)
    const end = toMin(it.end)

    for (let t = start; t + duration <= end; t += duration) {
      const s = toHHMM(t)
      const e = toHHMM(t + duration)

      const isBusy = overlapsAnyBusy(t, t + duration)

      const isPastToday = isToday && t <= nowMin

      const disabled = isBusy || isPastToday

      slots.push({
        label: disabled ? `${s} - ${e} (Indisponível)` : `${s} - ${e}`,
        value: s,
        disable: disabled
      })
    }
  }

  return slots
})

watch(
  () => slotOptions.value,
  (opts) => {
    if (!local.start) return
    const found = (opts || []).find(o => o.value === local.start)
    if (!found || found.disable) local.start = ''
  }
)

const canSubmit = computed(() => {
  if (isView.value) return false
  if (!canShowSlots.value) return false
  if (!local.start) return false

  if (props.mode === 'create' && !local.customer_name.trim()) return false
  return true
})

function onSubmit () {
  const service = selectedService.value
  const dateISO = toISOFromBR(local.dateBR)
  if (!service || !dateISO) return

  const duration = Number(service.duration || 0)
  const startMin = toMin(local.start)
  const endMin = startMin + duration

  if (!duration || duration <= 0) return

  // Hard-block: se conflitar, não salva
  if (overlapsAnyBusy(startMin, endMin)) {
    return
  }

  const payload = {
    service_id: Number(local.service_id),
    collaborator_id: Number(local.collaborator_id),
    date: dateISO,
    start: local.start,
    end: toHHMM(endMin)
  }

  // create: envia customer_name e price
  if (props.mode === 'create') {
    payload.customer_name = local.customer_name.trim()
    payload.price = Number(service.price ?? 0)
  }

  emit('save', payload)
  emit('update:modelValue', false)
}
</script>

<style scoped>
.editor-card {
  min-width: 760px;
  max-width: 92vw;
  border-radius: 14px;
}

@media (max-width: 780px) {
  .editor-card { min-width: auto; }
}

.slots-wrap {
  width: 100%;
  max-width: 520px;
}

.slots-group :deep(.q-option-group) { width: 100%; }
.slots-group :deep(.q-radio) { width: 100%; }
</style>
