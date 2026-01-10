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
            <q-input
              class="col-12"
              v-model="local.photoUrl"
              label="URL da Foto (Opcional)"
              outlined
              dense
            />
          </div>

          <!-- Serviços -->
          <div class="q-mt-lg">
            <div class="text-subtitle1 text-weight-bold q-mb-sm">
              Serviços que este colaborador pode realizar
            </div>

            <!-- Estado vazio -->
            <q-banner
              v-if="!services || services.length === 0"
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
                v-for="s in services"
                :key="s.id"
                tag="label"
              >
                <q-item-section side>
                  <!-- importante: val numérico -->
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
                        class="col-5"
                        v-model="interval.start"
                        :options="timeOptions"
                        label="Início"
                        dense
                        outlined
                        emit-value
                        map-options
                      />

                      <q-select
                        class="col-5"
                        v-model="interval.end"
                        :options="timeOptions"
                        label="Fim"
                        dense
                        outlined
                        emit-value
                        map-options
                      />

                      <div class="col-2 flex flex-center">
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
                <li>
                  Clique em <b>Adicionar intervalo</b> para configurar horário de
                  almoço ou turnos diferentes.
                </li>
                <li>
                  Use o toggle para marcar o dia como <b>Fechado</b>.
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

/**
 * Converte qualquer formato de schedule (string antiga ou objeto novo)
 */
function normalizeSchedule (rawSchedule = {}) {
  const result = {}

  for (const key of DAY_KEYS) {
    const v = rawSchedule[key]

    if (v && typeof v === 'object' && 'closed' in v && Array.isArray(v.intervals)) {
      result[key] = {
        closed: !!v.closed,
        intervals: v.intervals.map(it => ({
          start: it.start ?? null,
          end: it.end ?? null
        }))
      }
      continue
    }

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
          return { start, end }
        })
        .filter(Boolean)

      result[key] = {
        closed: intervals.length === 0,
        intervals: intervals.length ? intervals : [{ start: null, end: null }]
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
  services: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'save'])

const local = reactive(normalizeStaff(props.value))

watch(
  () => props.value,
  (v) => Object.assign(local, normalizeStaff(v)),
  { deep: true }
)

const days = [
  { key: 'mon', label: 'Segunda-feira' },
  { key: 'tue', label: 'Terça-feira' },
  { key: 'wed', label: 'Quarta-feira' },
  { key: 'thu', label: 'Quinta-feira' },
  { key: 'fri', label: 'Sexta-feira' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' }
]

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
  local.schedule[dayKey].intervals.push({ start: null, end: null })
}

function removeInterval (dayKey, idx) {
  const arr = local.schedule[dayKey].intervals
  if (arr.length > 1) arr.splice(idx, 1)
}

function validateSchedule () {
  for (const d of days) {
    const day = local.schedule[d.key]
    if (day.closed) continue

    const intervals = [...day.intervals].sort((a, b) =>
      (a.start || '').localeCompare(b.start || '')
    )

    for (let i = 0; i < intervals.length; i++) {
      const { start, end } = intervals[i]

      if (!start || !end || start >= end) {
        $q.notify({
          type: 'negative',
          message: `Horário inválido em ${d.label}. Verifique início e fim.`
        })
        return false
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
</style>
