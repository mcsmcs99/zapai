<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent>
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
        <div class="q-pa-md rounded-borders bg-grey-1 q-mb-md" style="border:1px solid #ECECEC">
          <div class="row items-center q-gutter-sm">
            <q-icon name="badge" />
            <div class="text-subtitle1 text-weight-bold">Editar Colaborador</div>
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

          <!-- Horários -->
          <div class="q-mt-md" ref="workRef">
            <div class="row items-center q-gutter-sm q-mb-sm">
              <q-icon name="schedule" color="orange-8" />
              <div class="text-subtitle1 text-weight-bold">Horários de Trabalho</div>
            </div>

            <div class="row q-col-gutter-md">
              <q-input
                v-for="d in days"
                :key="d.key"
                class="col-12 col-sm-6"
                outlined dense
                :label="d.label"
                v-model="local.schedule[d.key]"
                :placeholder="d.placeholder"
              />
            </div>

            <q-banner class="q-mt-md bg-orange-1 text-orange-10" rounded>
              <div class="text-subtitle2 text-weight-medium q-mb-xs">Dicas para horários:</div>
              <ul class="q-pl-md q-mb-none">
                <li>Use formato 24h: <b>09:00-18:00</b></li>
                <li>Para dias fechados, digite: <b>"Fechado"</b></li>
                <li>Para intervalos: <b>"09:00-12:00, 14:00-18:00"</b></li>
              </ul>
            </q-banner>
          </div>
        </div>

        <!-- Ações -->
        <div class="row justify-end q-gutter-sm">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="deep-purple-6" icon="save" :label="mode === 'create' ? 'Criar Colaborador' : 'Atualizar Colaborador'" type="submit" />
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { reactive, watch, ref, nextTick, defineExpose } from 'vue'
defineOptions({ name: 'StaffEditorDialog' })

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
  }
})
const emit = defineEmits(['update:modelValue', 'save'])

const local = reactive(JSON.parse(JSON.stringify(props.value)))

watch(() => props.value, (v) => {
  Object.assign(local, JSON.parse(JSON.stringify(v)))
})

const days = [
  { key: 'mon', label: 'Segunda-feira', placeholder: '08:30-17:30' },
  { key: 'tue', label: 'Terça-feira',   placeholder: '08:30-17:30' },
  { key: 'wed', label: 'Quarta-feira',  placeholder: '08:30-17:30' },
  { key: 'thu', label: 'Quinta-feira',  placeholder: '08:30-17:30' },
  { key: 'fri', label: 'Sexta-feira',   placeholder: '08:30-17:30' },
  { key: 'sat', label: 'Sábado',        placeholder: '08:30-15:00' },
  { key: 'sun', label: 'Domingo',       placeholder: 'Fechado' }
]

const workRef = ref(null)

/** Exposto para o pai: foca/rola até a seção de horários */
async function focusWork() {
  await nextTick()
  workRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
defineExpose({ focusWork })

function onSubmit () {
  emit('save', JSON.parse(JSON.stringify(local)))
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
  .editor-card { min-width: auto; }
}
</style>
