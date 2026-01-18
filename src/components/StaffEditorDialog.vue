<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    persistent
  >
    <q-card class="editor-card">
      <!-- Título -->
      <q-card-section class="row items-center q-gutter-sm">
        <q-icon name="person_outline" />
        <div class="text-subtitle1 text-weight-bold">
          {{ mode === 'create' ? 'Novo Colaborador' : 'Editar Colaborador' }}
        </div>
        <q-space />
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <q-separator />

      <!-- Form -->
      <q-form class="q-pa-md" @submit.prevent="onSubmit">
        <div
          class="q-pa-md rounded-borders bg-grey-1 q-mb-md"
          style="border:1px solid #ECECEC"
        >
          <!-- Linha de status -->
          <div class="row items-center justify-between q-mb-md">
            <div class="text-subtitle1 text-weight-bold">
              Dados do Colaborador
            </div>

            <q-toggle
              v-model="local.status"
              :true-value="'active'"
              :false-value="'inactive'"
              color="positive"
              dense
              :label="local.status === 'active' ? 'Ativo' : 'Inativo'"
            />
          </div>

          <div class="row q-col-gutter-md q-mt-md">
            <q-input
              class="col-12 col-md-6"
              v-model="local.name"
              label="Nome Completo *"
              outlined
              dense
              :rules="[v => !!v || 'Campo obrigatório']"
            />
            <q-input
              class="col-12 col-md-6"
              v-model="local.role"
              label="Especialidade *"
              outlined
              dense
              :rules="[v => !!v || 'Campo obrigatório']"
            />

            <!-- ✅ NEW: Modo de atendimento -->
            <q-select
              class="col-12 col-md-6 staff-attendance-select"
              v-model="local.attendance_mode"
              :options="attendanceModeOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              outlined
              dense
              hide-bottom-space
              label="Tipo de atendimento *"
              :display-value="selectedAttendanceLabel(local.attendance_mode)"
              :rules="[v => !!v || 'Campo obrigatório']"
            >
              <template #prepend>
                <q-icon :name="attendanceIcon(local.attendance_mode)" />
              </template>
            </q-select>

            <q-input
              class="col-12 col-md-6"
              v-model="local.photoUrl"
              label="URL da Foto (Opcional)"
              outlined
              dense
            />
          </div>

          <q-banner class="q-mt-md bg-blue-1 text-blue-10" rounded>
            <div class="text-subtitle2 text-weight-medium q-mb-xs">
              Como funciona
            </div>
            <ul class="q-pl-md q-mb-none">
              <li><b>Somente Unidade</b>: agenda tradicional por unidade.</li>
              <li><b>Somente Domicílio</b>: agenda com endereço do cliente (não exige unidade no horário).</li>
              <li><b>Ambos</b>: o colaborador pode atender nos dois formatos.</li>
            </ul>
          </q-banner>

          <!-- Serviços -->
          <div class="q-mt-lg">
            <div class="text-subtitle1 text-weight-bold q-mb-sm">
              Serviços que este colaborador pode realizar
            </div>

            <!-- Estado vazio -->
            <q-banner
              v-if="!filteredServices || filteredServices.length === 0"
              rounded
              class="bg-grey-2 text-grey-9"
            >
              Nenhum serviço cadastrado.
              <div class="q-mt-xs text-caption">
                Cadastre um serviço no menu <b>Serviços &gt; Novo serviço</b>.
              </div>
            </q-banner>

            <!-- Lista -->
            <q-list
              v-else
              bordered
              class="rounded-borders"
              style="max-height: 280px; overflow: auto;"
            >
              <q-item
                v-for="s in filteredServices"
                :key="s.id"
                tag="label"
              >
                <q-item-section side>
                  <q-checkbox v-model="local.serviceIds" :val="Number(s.id)" />
                </q-item-section>

                <q-item-section>
                  <q-item-label class="text-weight-medium">
                    {{ s.title }}
                  </q-item-label>

                  <q-item-label caption>
                    <span v-if="s.duration">Duração: {{ s.duration }}min</span>
                    <span v-if="s.price != null" class="q-ml-sm">
                      • R$ {{ Number(s.price).toFixed(2) }}
                    </span>
                    <span v-if="s.status" class="q-ml-sm">
                      • {{ s.status === 'active' ? 'Ativo' : 'Inativo' }}
                    </span>

                    <!-- opcional: mostra tipo do serviço se vier -->
                    <span v-if="s.attendance_mode" class="q-ml-sm">
                      • {{ attendanceChipLabel(s.attendance_mode) }}
                    </span>
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- Horários -->
          <div class="q-mt-md" ref="workRef">
            <div class="row items-center q-gutter-sm q-mb-sm">
              <q-icon name="schedule" color="orange-8" />
              <div class="text-subtitle1 text-weight-bold">
                Horários de Trabalho
              </div>
            </div>

            <!-- Se for domicílio, avisa que unidade não é obrigatória -->
            <q-banner
              v-if="local.attendance_mode === 'client_location'"
              class="q-mb-md bg-purple-1 text-purple-10"
              rounded
            >
              Este colaborador está configurado como <b>Somente Domicílio</b>.
              <div class="text-caption q-mt-xs">
                Nos intervalos abaixo, a seleção de <b>Unidade</b> não será obrigatória.
              </div>
            </q-banner>

            <div class="row q-col-gutter-md">
              <div
                v-for="d in days"
                :key="d.key"
                class="col-12 col-md-6"
              >
                <div
                  class="q-pa-sm rounded-borders"
                  style="border:1px solid #ECECEC"
                >
                  <!-- Cabeçalho dia + toggle fechado -->
                  <div class="row items-center justify-between q-mb-sm">
                    <div class="text-body2 text-weight-medium">
                      {{ d.label }}
                    </div>

                    <q-toggle
                      v-model="local.schedule[d.key].closed"
                      color="negative"
                      dense
                      :label="local.schedule[d.key].closed ? 'Fechado' : 'Aberto'"
                    />
                  </div>

                  <!-- Replicar horários (popup) -->
                  <div
                    class="row justify-end q-mb-sm"
                    v-if="!local.schedule[d.key].closed"
                  >
                    <q-btn
                      flat
                      dense
                      size="sm"
                      icon="content_copy"
                      label="Replicar"
                    >
                      <q-menu
                        anchor="bottom right"
                        self="top right"
                        :offset="[0, 8]"
                        max-width="200px"
                        class="q-pa-sm"
                      >
                        <div class="text-subtitle2 text-weight-medium q-mb-sm">
                          Replicar para...
                        </div>

                        <q-option-group
                          v-model="replicateTargets[d.key]"
                          type="checkbox"
                          :options="replicateOptions(d.key)"
                          dense
                          class="replicate-options"
                        />

                        <q-separator class="q-my-sm" />

                        <div class="row justify-end q-gutter-sm">
                          <q-btn
                            flat
                            size="sm"
                            label="Limpar"
                            @click="replicateTargets[d.key] = []"
                          />
                          <q-btn
                            color="deep-purple-6"
                            size="sm"
                            icon="content_copy"
                            :disable="!replicateTargets[d.key]?.length"
                            label="Aplicar"
                            v-close-popup
                            @click="applyReplicate(d.key)"
                          />
                        </div>
                      </q-menu>
                    </q-btn>
                  </div>

                  <!-- Intervalos -->
                  <div
                    v-if="!local.schedule[d.key].closed"
                    class="column q-gutter-xs"
                  >
                    <div
                      v-for="(interval, idx) in local.schedule[d.key].intervals"
                      :key="idx"
                      class="row q-col-gutter-sm items-center"
                    >
                      <q-select
                        class="col-4"
                        v-model="interval.start"
                        :options="timeOptions"
                        label="Início"
                        dense
                        outlined
                        emit-value
                        map-options
                      />

                      <q-select
                        class="col-4"
                        v-model="interval.end"
                        :options="timeOptions"
                        label="Fim"
                        dense
                        outlined
                        emit-value
                        map-options
                      />

                      <!-- Unidade: desabilita se for domicílio-only -->
                      <q-select
                        class="col-3 staff-unit-select"
                        v-model="interval.unit_id"
                        :options="unitOptions"
                        label="Unidade"
                        dense
                        outlined
                        emit-value
                        map-options
                        clearable
                        :disable="local.attendance_mode === 'client_location'"
                        :display-value="selectedUnitLabel(interval.unit_id)"
                      />

                      <div class="col-1 flex flex-center">
                        <q-btn
                          icon="delete"
                          flat
                          round
                          color="negative"
                          size="sm"
                          @click="removeInterval(d.key, idx)"
                          :disable="local.schedule[d.key].intervals.length === 1"
                        />
                      </div>
                    </div>

                    <q-btn
                      flat
                      size="sm"
                      class="q-mt-xs"
                      icon="add"
                      label="Adicionar intervalo"
                      @click="addInterval(d.key)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <q-banner class="q-mt-md bg-orange-1 text-orange-10" rounded>
              <div class="text-subtitle2 text-weight-medium q-mb-xs">
                Como configurar:
              </div>
              <ul class="q-pl-md q-mb-none">
                <li>Use os seletores para escolher os horários de início e fim.</li>
                <li v-if="local.attendance_mode !== 'client_location'">
                  Em cada intervalo, selecione a <b>Unidade</b> onde o colaborador estará.
                </li>
                <li v-else>
                  Como é <b>Somente Domicílio</b>, não é necessário selecionar unidade nos intervalos.
                </li>
                <li>
                  Clique em <b>Adicionar intervalo</b> para configurar horário de
                  almoço ou turnos diferentes.
                </li>
                <li>
                  Use o toggle para marcar o dia como <b>Fechado</b>.
                </li>
                <li>
                  Use <b>Replicar para...</b> para copiar o horário de um dia para outros dias.
                </li>
              </ul>
            </q-banner>
          </div>
        </div>

        <!-- Ações -->
        <div class="row justify-end q-gutter-sm">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            color="deep-purple-6"
            icon="save"
            :label="mode === 'create' ? 'Criar Colaborador' : 'Atualizar Colaborador'"
            type="submit"
          />
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { reactive, watch, ref, nextTick, defineExpose, computed } from 'vue'
import { useQuasar } from 'quasar'

defineOptions({ name: 'StaffEditorDialog' })

const $q = useQuasar()

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

function uniqIds (raw) {
  const arr = Array.isArray(raw) ? raw : []
  return [...new Set(arr.map(Number).filter(Number.isFinite))]
}

function normalizeAttendanceMode (raw) {
  const v = String(raw || '').trim()
  if (v === 'fixed' || v === 'client_location' || v === 'mixed') return v
  return 'fixed'
}

/**
 * Converte qualquer formato de schedule (string antiga ou objeto novo)
 * Agora suporta unit_id por intervalo.
 */
function normalizeSchedule (rawSchedule = {}) {
  const result = {}

  for (const key of DAY_KEYS) {
    const v = rawSchedule[key]

    // formato novo (objeto)
    if (v && typeof v === 'object' && 'closed' in v && Array.isArray(v.intervals)) {
      result[key] = {
        closed: !!v.closed,
        intervals: v.intervals.map(it => ({
          start: it.start ?? null,
          end: it.end ?? null,
          unit_id: it.unit_id != null ? Number(it.unit_id) : null
        }))
      }
      continue
    }

    // formato antigo (string)
    if (typeof v === 'string') {
      const trimmed = v.trim()

      if (!trimmed || trimmed.toLowerCase() === 'fechado') {
        result[key] = { closed: true, intervals: [] }
        continue
      }

      const intervals = trimmed
        .split(',')
        .map(s => s.trim())
        .map(seg => {
          const [start, end] = seg.split('-').map(t => t.trim())
          if (!start || !end) return null
          return { start, end, unit_id: null }
        })
        .filter(Boolean)

      result[key] = {
        closed: intervals.length === 0,
        intervals: intervals.length
          ? intervals
          : [{ start: null, end: null, unit_id: null }]
      }
      continue
    }

    result[key] = { closed: true, intervals: [] }
  }

  return result
}

function normalizeStaff (v = {}) {
  const cloned = JSON.parse(JSON.stringify(v || {}))

  // compat service_ids -> serviceIds
  if (cloned.serviceIds === undefined && cloned.service_ids !== undefined) {
    cloned.serviceIds = cloned.service_ids
  }
  delete cloned.service_ids

  // compat photo_url -> photoUrl
  if (cloned.photoUrl === undefined && cloned.photo_url !== undefined) {
    cloned.photoUrl = cloned.photo_url
  }
  delete cloned.photo_url

  // ✅ NEW: attendance_mode
  if (cloned.attendance_mode === undefined && cloned.attendanceMode !== undefined) {
    cloned.attendance_mode = cloned.attendanceMode
  }
  delete cloned.attendanceMode
  cloned.attendance_mode = normalizeAttendanceMode(cloned.attendance_mode)

  if (!cloned.status) cloned.status = 'active'
  cloned.serviceIds = uniqIds(cloned.serviceIds)
  cloned.schedule = normalizeSchedule(cloned.schedule)

  return cloned
}

// ---- props / state -------------------------------------------

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: 'edit' }, // 'create' | 'edit'
  value: {
    type: Object,
    default: () => ({
      id: null,
      name: '',
      role: '',
      photoUrl: '',
      status: 'active',
      attendance_mode: 'fixed',
      serviceIds: [],
      schedule: {
        mon: '08:30-17:30',
        tue: '08:30-17:30',
        wed: '08:30-17:30',
        thu: '08:30-17:30',
        fri: '08:30-17:30',
        sat: '08:30-15:00',
        sun: 'Fechado'
      }
    })
  },
  services: { type: Array, default: () => [] },
  units: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue', 'save'])

const local = reactive(normalizeStaff(props.value))

watch(
  () => props.value,
  (v) => Object.assign(local, normalizeStaff(v)),
  { deep: true }
)

/**
 * ✅ AJUSTE ÚNICO PEDIDO:
 * - Não filtra por attendance_mode (nem do colaborador, nem do serviço).
 * - Único filtro: serviço ativo.
 * - Mantém o restante do arquivo igual.
 */
const filteredServices = computed(() => {
  const list = Array.isArray(props.services) ? props.services : []
  return list.filter(s => String(s?.status || 'active') === 'active')
})

const days = [
  { key: 'mon', label: 'Segunda-feira' },
  { key: 'tue', label: 'Terça-feira' },
  { key: 'wed', label: 'Quarta-feira' },
  { key: 'thu', label: 'Quinta-feira' },
  { key: 'fri', label: 'Sexta-feira' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' }
]

const unitOptions = computed(() =>
  (props.units || [])
    .filter(u => u.is_active === true)
    .map(u => ({ label: u.name, value: Number(u.id) }))
)

function selectedUnitLabel (unitId) {
  if (unitId == null) return ''
  const id = Number(unitId)
  const found = unitOptions.value.find(o => o.value === id)
  return found?.label || `Unidade #${id}`
}

const timeOptions = computed(() => {
  const out = []
  const STEP = 15
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += STEP) {
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      out.push(`${hh}:${mm}`)
    }
  }
  return out
})

const workRef = ref(null)

async function focusWork () {
  await nextTick()
  workRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
defineExpose({ focusWork })

function addInterval (dayKey) {
  const intervals = local.schedule[dayKey].intervals
  const last = intervals[intervals.length - 1]
  intervals.push({
    start: null,
    end: null,
    unit_id: last?.unit_id ?? null
  })
}

function removeInterval (dayKey, idx) {
  const arr = local.schedule[dayKey].intervals
  if (arr.length > 1) arr.splice(idx, 1)
}

// ---- replicação de horários ----------------------------------

const replicateTargets = reactive({
  mon: [],
  tue: [],
  wed: [],
  thu: [],
  fri: [],
  sat: [],
  sun: []
})

function dayLabelByKey (key) {
  return days.find(d => d.key === key)?.label ?? key
}

function replicateOptions (fromDayKey) {
  return days
    .filter(d => d.key !== fromDayKey)
    .map(d => ({ label: d.label, value: d.key }))
}

function cloneDaySchedule (day) {
  return {
    closed: !!day?.closed,
    intervals: Array.isArray(day?.intervals)
      ? day.intervals.map(it => ({
          start: it.start ?? null,
          end: it.end ?? null,
          unit_id: it.unit_id != null ? Number(it.unit_id) : null
        }))
      : []
  }
}

function applyReplicate (fromDayKey) {
  const targets = replicateTargets[fromDayKey] || []
  if (!targets.length) return

  const source = cloneDaySchedule(local.schedule[fromDayKey])

  for (const dayKey of targets) {
    if (!local.schedule[dayKey]) {
      local.schedule[dayKey] = { closed: true, intervals: [] }
    }

    local.schedule[dayKey].closed = source.closed
    local.schedule[dayKey].intervals = source.intervals.map(it => ({ ...it }))
  }

  $q.notify({
    type: 'positive',
    message: `Horário de ${dayLabelByKey(fromDayKey)} replicado para: ${targets
      .map(dayLabelByKey)
      .join(', ')}.`
  })

  replicateTargets[fromDayKey] = []
}

function validateSchedule () {
  for (const d of days) {
    const day = local.schedule[d.key]
    if (!day) continue

    if (day.closed) continue

    const rawIntervals = Array.isArray(day.intervals) ? day.intervals : []
    if (!rawIntervals.length) {
      $q.notify({
        type: 'negative',
        message: `Adicione ao menos um intervalo em ${d.label}.`
      })
      return false
    }

    const intervals = [...rawIntervals].sort((a, b) =>
      (a.start || '').localeCompare(b.start || '')
    )

    for (let i = 0; i < intervals.length; i++) {
      const { start, end, unit_id } = intervals[i]

      if (!start || !end || start >= end) {
        $q.notify({
          type: 'negative',
          message: `Horário inválido em ${d.label}. Verifique início e fim.`
        })
        return false
      }

      // ✅ NEW: só exige unidade se NÃO for domicílio-only
      if (local.attendance_mode !== 'client_location') {
        const unitIdNum = Number(unit_id)
        if (!Number.isFinite(unitIdNum) || unitIdNum <= 0) {
          $q.notify({
            type: 'negative',
            message: `Selecione a unidade em ${d.label} (${start} - ${end}).`
          })
          return false
        }
      }

      if (i > 0) {
        const prev = intervals[i - 1]
        if (start < prev.end) {
          $q.notify({
            type: 'negative',
            message: `Intervalos sobrepostos em ${d.label}.`
          })
          return false
        }
      }
    }
  }

  return true
}

function attendanceIcon (mode) {
  if (mode === 'client_location') return 'home'
  if (mode === 'mixed') return 'swap_horiz'
  return 'store'
}

const attendanceModeOptions = [
  { label: 'Somente Unidade', value: 'fixed' },
  { label: 'Somente Domicílio', value: 'client_location' },
  { label: 'Ambos', value: 'mixed' }
]

function selectedAttendanceLabel (val) {
  const found = attendanceModeOptions.find(o => o.value === val)
  return found?.label || ''
}

function attendanceChipLabel (mode) {
  if (mode === 'client_location') return 'Domicílio'
  if (mode === 'mixed') return 'Ambos'
  return 'Unidade'
}

function onSubmit () {
  if (!validateSchedule()) return

  const payload = normalizeStaff(local)
  emit('save', payload)
  emit('update:modelValue', false)
}
</script>

<style scoped>
.editor-card {
  min-width: 720px;
  max-width: 92vw;
  border-radius: 14px;
}
@media (max-width: 760px) {
  .editor-card {
    min-width: auto;
  }
}
.replicate-options :deep(.q-option-group) {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ✅ trava layout do select (igual seu icon select) */
.staff-attendance-select,
.staff-unit-select {
  min-width: 0;
}
</style>
