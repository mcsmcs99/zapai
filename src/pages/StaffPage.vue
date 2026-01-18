<template>
  <q-page padding class="q-gutter-md">
    <!-- Título + ação -->
    <div class="row items-center justify-between">
      <div>
        <div class="text-h4 text-weight-bold">Colaboradores</div>
        <div class="text-subtitle2 text-grey-7">
          Gerencie a equipe que realiza os atendimentos
        </div>
      </div>

      <q-btn
        color="deep-purple-6"
        icon="add"
        label="Novo Colaborador"
        unelevated
        rounded
        @click="openCreate"
      />
    </div>

    <!-- Grid de cards -->
    <div class="row q-col-gutter-xl q-mt-sm">
      <div
        v-for="p in staffList"
        :key="p.id"
        class="col-12 col-sm-6 col-md-4"
      >
        <q-card flat bordered class="person-card">
          <q-card-section class="row items-start no-wrap">
            <q-avatar
              size="44px"
              color="deep-purple-5"
              text-color="white"
              rounded
            >
              {{ initials(p.name) }}
            </q-avatar>

            <div class="q-ml-md col">
              <div class="row items-center no-wrap">
                <div class="text-subtitle1 text-weight-bold ellipsis">
                  {{ p.name }}
                </div>
                <q-space />
                <q-btn flat round dense icon="more_vert">
                  <q-menu>
                    <q-list style="min-width: 170px">
                      <q-item clickable @click="openEdit(p)">
                        <q-item-section avatar>
                          <q-icon name="edit" />
                        </q-item-section>
                        <q-item-section>Editar</q-item-section>
                      </q-item>

                      <q-item clickable @click="toggleActive(p)">
                        <q-item-section avatar>
                          <q-icon
                            :name="p.status === 'active'
                              ? 'pause'
                              : 'play_arrow'"
                          />
                        </q-item-section>
                        <q-item-section>
                          {{ p.status === 'active' ? 'Desativar' : 'Ativar' }}
                        </q-item-section>
                      </q-item>

                      <q-separator />

                      <q-item
                        clickable
                        class="text-negative"
                        @click="confirmRemove(p)"
                      >
                        <q-item-section avatar>
                          <q-icon name="delete" />
                        </q-item-section>
                        <q-item-section>Excluir</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </div>

              <div class="row items-center q-gutter-xs q-mt-xs">
                <q-badge
                  rounded
                  color="deep-purple-1"
                  text-color="deep-purple-8"
                  :label="p.role"
                />

                <!-- ✅ NEW: badge do tipo de atendimento -->
                <q-badge
                  rounded
                  :color="attendanceColor(p.attendance_mode)"
                  :text-color="attendanceTextColor(p.attendance_mode)"
                  :label="attendanceLabel(p.attendance_mode)"
                />
              </div>
            </div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <div class="row items-center">
              <q-icon name="schedule" class="q-mr-sm text-grey-7" />
              <div class="text-grey-7">Horários</div>
              <q-space />
              <div class="text-weight-medium">
                {{ workDays(p.schedule) }} dias/semana
              </div>
            </div>
          </q-card-section>

          <q-separator inset />

          <q-card-actions align="center" class="q-pa-md">
            <q-btn
              outline
              color="grey-8"
              label="Ver Agenda"
              class="full-width"
              @click="openAgenda(p)"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Dialog Remover -->
    <q-dialog v-model="rm.open">
      <q-card style="min-width:360px">
        <q-card-section class="row items-center q-gutter-sm">
          <q-icon name="warning" color="negative" />
          <div class="text-subtitle1 text-weight-bold">
            Excluir colaborador
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          Tem certeza que deseja excluir <b>{{ rm.row?.name }}</b>?
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="negative" label="Excluir" @click="remove" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- MODAL COMPLETA (criar/editar/agenda) -->
    <StaffEditorDialog
      ref="editorRef"
      v-model="editor.open"
      :mode="editor.mode"
      :value="staffStore.currentStaff"
      :services="servicesForEditor"
      :units="units"
      @save="saveStaff"
    />
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import StaffEditorDialog from 'components/StaffEditorDialog.vue'
import { useStaffStore } from 'src/stores/tenant/staff'
import { useServicesStore } from 'src/stores/tenant/services'
import { useUnitsStore } from 'src/stores/tenant/units'

defineOptions({ name: 'StaffPage' })

const staffStore = useStaffStore()
const servicesStore = useServicesStore()
const unitsStore = useUnitsStore()

const { staff: staffList } = storeToRefs(staffStore)
const { units: unitsRef } = storeToRefs(unitsStore)

/* Unidades disponíveis = units ativas do tenant */
const units = computed(() =>
  (unitsRef.value || []).filter(u => u.is_active === true)
)

/* ------- helpers ------- */
const initials = n =>
  (n || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0])
    .join('')
    .toUpperCase()

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
function workDays (schedule) {
  if (!schedule) return 0
  return DAY_KEYS.reduce((acc, key) => {
    const day = schedule[key]
    return acc + (day && day.closed === false ? 1 : 0)
  }, 0)
}

/* --- helpers attendance mode (mantidos) --- */
function normalizeAttendanceMode (raw) {
  const v = String(raw || '').trim()
  if (v === 'fixed' || v === 'client_location' || v === 'mixed') return v
  return 'fixed'
}

function attendanceLabel (modeRaw) {
  const mode = normalizeAttendanceMode(modeRaw)
  if (mode === 'client_location') return 'Domicílio'
  if (mode === 'mixed') return 'Ambos'
  return 'Unidade'
}

function attendanceColor (modeRaw) {
  const mode = normalizeAttendanceMode(modeRaw)
  if (mode === 'client_location') return 'purple-1'
  if (mode === 'mixed') return 'blue-1'
  return 'teal-1'
}

function attendanceTextColor (modeRaw) {
  const mode = normalizeAttendanceMode(modeRaw)
  if (mode === 'client_location') return 'purple-10'
  if (mode === 'mixed') return 'blue-10'
  return 'teal-10'
}

/**
 * ✅ AJUSTE PEDIDO:
 * Não filtrar serviços por tipo de atendimento ao enviar pro editor.
 * Aqui só repassa a lista completa do store (sem filtro por attendance_mode).
 * (Se quiser manter só ativos, isso já é feito no dialog agora.)
 */
const servicesForEditor = computed(() => servicesStore.services || [])

/* ------- editor (modal completa) ------- */
const editor = reactive({
  open: false,
  mode: 'create' // 'create' | 'edit'
})
const editorRef = ref(null)

function openCreate () {
  editor.mode = 'create'
  staffStore.resetCurrentStaff()
  editor.open = true
}

async function openEdit (row) {
  editor.mode = 'edit'
  await staffStore.fetchStaffById(row.id)
  editor.open = true
}

async function openAgenda (row) {
  await openEdit(row)
  setTimeout(() => editorRef.value?.focusWork?.(), 60)
}

async function saveStaff (data) {
  staffStore.setCurrentStaff(data)

  const resp = await staffStore.saveCurrentStaff()
  if (!resp.ok) return

  if (resp.ok && editor.mode === 'create') {
    await staffStore.fetchStaff()
  }
}

/* ------- remover / ativar ------- */
const rm = reactive({ open: false, row: null })

function confirmRemove (row) {
  rm.row = row
  rm.open = true
}

async function remove () {
  if (!rm.row) return

  const resp = await staffStore.deleteStaff(rm.row.id)
  if (resp.ok) {
    rm.open = false
    rm.row = null
  }
}

async function toggleActive (p) {
  const newStatus = p.status === 'active' ? 'inactive' : 'active'
  staffStore.setCurrentStaff({ ...p, status: newStatus })
  await staffStore.saveCurrentStaff()
}

/* ------- lifecycle ------- */
onMounted(async () => {
  staffStore.loadFromSession()
  servicesStore.loadFromSession?.()
  unitsStore.loadFromSession?.()

  await Promise.all([
    staffStore.fetchStaff(),
    servicesStore.fetchServices(),
    unitsStore.fetchUnits?.()
  ])
})
</script>

<style scoped>
.person-card {
  border-radius: 14px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
}
.full-width {
  width: 100%;
}
</style>
