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

      <q-btn color="deep-purple-6" icon="add" label="Novo Colaborador"
             unelevated rounded @click="openCreate()" />
    </div>

    <!-- Grid de cards -->
    <div class="row q-col-gutter-xl q-mt-sm">
      <div v-for="p in people" :key="p.id" class="col-12 col-sm-6 col-md-4">
        <q-card flat bordered class="person-card">
          <q-card-section class="row items-start no-wrap">
            <q-avatar size="44px" color="deep-purple-5" text-color="white" rounded>
              {{ initials(p.name) }}
            </q-avatar>

            <div class="q-ml-md col">
              <div class="row items-center no-wrap">
                <div class="text-subtitle1 text-weight-bold ellipsis">{{ p.name }}</div>
                <q-space/>
                <q-btn flat round dense icon="more_vert">
                  <q-menu>
                    <q-list style="min-width: 170px">
                      <q-item clickable @click="openEdit(p)">
                        <q-item-section avatar><q-icon name="edit" /></q-item-section>
                        <q-item-section>Editar</q-item-section>
                      </q-item>
                      <q-item clickable @click="toggleActive(p)">
                        <q-item-section avatar>
                          <q-icon :name="p.active ? 'pause' : 'play_arrow'" />
                        </q-item-section>
                        <q-item-section>{{ p.active ? 'Desativar' : 'Ativar' }}</q-item-section>
                      </q-item>
                      <q-separator />
                      <q-item clickable class="text-negative" @click="confirmRemove(p)">
                        <q-item-section avatar><q-icon name="delete" /></q-item-section>
                        <q-item-section>Excluir</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </div>

              <q-badge rounded color="deep-purple-1" text-color="deep-purple-8"
                       :label="p.role" class="q-mt-xs" />
            </div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <div class="row items-center">
              <q-icon name="schedule" class="q-mr-sm text-grey-7" />
              <div class="text-grey-7">Horários</div>
              <q-space />
              <div class="text-weight-medium"> {{ p.workDays }} dias/semana </div>
            </div>
          </q-card-section>

          <q-separator inset />

          <q-card-actions align="center" class="q-pa-md">
            <q-btn outline color="grey-8" label="Ver Agenda" class="full-width" @click="openAgenda(p)" />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Dialog Remover -->
    <q-dialog v-model="rm.open">
      <q-card style="min-width:360px">
        <q-card-section class="row items-center q-gutter-sm">
          <q-icon name="warning" color="negative" />
          <div class="text-subtitle1 text-weight-bold">Excluir colaborador</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          Tem certeza que deseja excluir <b>{{ rm.row?.name }}</b>?
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="negative" label="Excluir" @click="remove()" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- MODAL COMPLETA (criar/editar/agenda) -->
    <StaffEditorDialog
      ref="editorRef"
      v-model="editor.open"
      :mode="editor.mode"
      :value="editor.value"
      @save="saveStaff"
    />
  </q-page>
</template>

<script setup>
import { ref, reactive } from 'vue'
import StaffEditorDialog from 'components/StaffEditorDialog.vue'
defineOptions({ name: 'StaffPage' })

const people = ref([
  { id: 1, name: 'João Silva',   role: 'Barbeiro',             workDays: 6, active: true,
    photoUrl: '', schedule: baseSchedule() },
  { id: 2, name: 'Maria Santos', role: 'Cabeleireira',         workDays: 6, active: true,
    photoUrl: '', schedule: baseSchedule() },
  { id: 3, name: 'Ana Costa',    role: 'Manicure e Pedicure',  workDays: 6, active: true,
    photoUrl: '', schedule: baseSchedule() },
  { id: 4, name: 'Pedro Oliveira', role: 'Barbeiro Especialista', workDays: 6, active: true,
    photoUrl: '', schedule: baseSchedule() },
  { id: 5, name: 'Carla Mendes', role: 'Esteticista',          workDays: 6, active: true,
    photoUrl: '', schedule: baseSchedule() },
  { id: 6, name: 'Eduards',      role: 'Barbeiro',             workDays: 6, active: true,
    photoUrl: '', schedule: baseSchedule() }
])

function baseSchedule () {
  return { mon:'08:30-17:30', tue:'08:30-17:30', wed:'08:30-17:30',
           thu:'08:30-17:30', fri:'08:30-17:30', sat:'08:30-15:00', sun:'Fechado' }
}

const initials = (n) => (n || '').split(' ').filter(Boolean).slice(0,2).map(p => p[0]).join('').toUpperCase()

/* ------- editor (modal completa) ------- */
const editor = reactive({
  open: false,
  mode: 'create', // 'create' | 'edit'
  value: { id: null, name: '', role: '', photoUrl: '', schedule: baseSchedule() }
})
const editorRef = ref(null)

function openCreate () {
  editor.mode = 'create'
  editor.value = { id: null, name: '', role: '', photoUrl: '', schedule: baseSchedule() }
  editor.open  = true
}
function openEdit (row) {
  editor.mode = 'edit'
  editor.value = JSON.parse(JSON.stringify(row))
  editor.open  = true
}
function openAgenda (row) {
  openEdit(row)
  // foca na seção de horários quando a modal abrir
  setTimeout(() => editorRef.value?.focusWork(), 60)
}
function saveStaff (data) {
  if (editor.mode === 'create') {
    const id = Math.max(0, ...people.value.map(p => p.id)) + 1
    people.value.push({ ...data, id, workDays: 6, active: true })
  } else {
    const i = people.value.findIndex(p => p.id === data.id)
    if (i > -1) people.value[i] = { ...people.value[i], ...data }
  }
}

/* ------- remover / ativar ------- */
const rm = reactive({ open: false, row: null })
function confirmRemove (row) { rm.row = row; rm.open = true }
function remove () {
  people.value = people.value.filter(p => p.id !== rm.row.id)
  rm.open = false
}
function toggleActive (p) { p.active = !p.active }
</script>

<style scoped>
.person-card { border-radius: 14px; box-shadow: 0 6px 16px rgba(0,0,0,.06); }
.full-width { width: 100%; }
</style>
