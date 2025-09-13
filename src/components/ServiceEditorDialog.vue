<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent>
    <q-card class="editor-card">
      <!-- Título -->
      <q-card-section class="row items-center q-gutter-sm">
        <div class="text-subtitle1 text-weight-bold">
          {{ mode === 'create' ? 'Novo Serviço' : 'Editar Serviço' }}
        </div>
        <q-space />
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <q-separator />

      <!-- Conteúdo -->
      <q-form class="q-pa-md" @submit.prevent="onSubmit">
        <div class="q-pa-md rounded-borders bg-grey-1" style="border:1px solid #ECECEC">
          <div class="row items-center q-gutter-sm q-mb-md">
            <q-icon name="content_cut" />
            <div class="text-subtitle1 text-weight-bold">Novo Serviço</div>
          </div>

          <div class="row q-col-gutter-md">
            <q-input
              class="col-12 col-md-8"
              v-model="local.title"
              outlined dense
              label="Nome do Serviço *"
              placeholder="Ex: Corte Social, Barba, Manicure"
              :rules="[v => !!v || 'Informe o nome']"
            />
            <q-input
              class="col-12 col-md-4"
              v-model.number="local.price"
              type="number"
              min="0" step="0.01"
              outlined dense
              label="Preço (R$) *"
              :rules="[v => v >= 0 || 'Inválido']"
            />
            <q-input
              class="col-12"
              v-model.number="local.duration"
              type="number"
              min="1"
              outlined dense
              label="Duração (minutos) *"
              :rules="[v => v > 0 || 'Inválido']"
            />
            <q-input
              class="col-12"
              v-model="local.description"
              type="textarea"
              autogrow outlined
              label="Descrição"
              placeholder="Descrição detalhada do serviço..."
            />
          </div>

          <!-- Colaboradores -->
          <div class="q-mt-lg">
            <div class="text-subtitle1 text-weight-bold q-mb-sm">
              Colaboradores que podem realizar este serviço
            </div>
            <q-list bordered class="rounded-borders" style="max-height: 280px; overflow: auto;">
              <q-item v-for="c in collaborators" :key="c.id" tag="label">
                <q-item-section side>
                  <q-checkbox v-model="local.collaboratorIds" :val="c.id" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-medium">{{ c.name }}</q-item-label>
                  <q-item-label caption>{{ c.role }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>

        <!-- Ações -->
        <div class="row justify-end q-gutter-sm q-mt-lg">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" icon="save"
                 :label="mode === 'create' ? 'Criar Serviço' : 'Salvar Alterações'"
                 type="submit" />
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { reactive, watch } from 'vue'
defineOptions({ name: 'ServiceEditorDialog' })

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: 'create' }, // 'create' | 'edit'
  value: {
    type: Object,
    default: () => ({
      id: null,
      title: '',
      price: 0,
      duration: 30,
      description: '',
      collaboratorIds: []
    })
  },
  collaborators: {
    type: Array,
    default: () => [] // [{id, name, role}]
  }
})
const emit = defineEmits(['update:modelValue', 'save'])

const local = reactive(JSON.parse(JSON.stringify(props.value)))
watch(() => props.value, v => Object.assign(local, JSON.parse(JSON.stringify(v))))

function onSubmit () {
  emit('save', JSON.parse(JSON.stringify(local)))
  emit('update:modelValue', false)
}
</script>

<style scoped>
.editor-card { min-width: 760px; max-width: 92vw; border-radius: 14px; }
@media (max-width: 780px) { .editor-card { min-width: auto; } }
</style>
