<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent>
    <q-card class="editor-card">
      <!-- Título -->
      <q-card-section class="row items-center q-gutter-sm">
        <div class="text-subtitle1 text-weight-bold">
          {{ mode === 'create' ? 'Novo Plano' : 'Editar Plano' }}
        </div>
        <q-space />
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <q-separator />

      <!-- Form -->
      <q-form class="q-pa-md" @submit.prevent="onSubmit">
        <div class="q-pa-md rounded-borders bg-grey-1" style="border:1px solid #ECECEC">
          <div class="row items-center q-gutter-sm q-mb-md">
            <q-icon name="sell" />
            <div class="text-subtitle1 text-weight-bold">
              {{ mode === 'create' ? 'Novo Plano' : 'Editar Plano' }}
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <q-input
              class="col-12 col-md-7"
              v-model="local.name"
              outlined dense
              label="Nome do Plano *"
              :rules="[v => !!v || 'Informe o nome']"
            />
            <q-input
              class="col-12 col-md-5"
              v-model.number="local.price"
              type="number" min="0" step="0.01"
              outlined dense
              label="Preço mensal (R$) *"
              :rules="[v => v >= 0 || 'Inválido']"
            />
            <div class="col-12 row items-center">
              <q-toggle v-model="local.popular" label="Marcar como Popular" />
            </div>

            <q-input
              class="col-12 col-sm-6"
              v-model.number="local.limits.assistants"
              type="number" min="1"
              outlined dense
              label="Assistentes IA *"
              :rules="[v => v > 0 || 'Inválido']"
            />
            <q-input
              class="col-12 col-sm-6"
              v-model.number="local.limits.messages"
              type="number" min="0"
              outlined dense
              label="Mensagens/mês *"
              :rules="[v => v >= 0 || 'Inválido']"
            />

            <q-input
              class="col-12"
              v-model="featuresText"
              type="textarea" autogrow outlined
              label="Recursos (um por linha)"
              hint="Cada linha vira um item na lista de recursos"
            />
          </div>
        </div>

        <!-- Ações -->
        <div class="row justify-end q-gutter-sm q-mt-lg">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" icon="save"
                 :label="mode === 'create' ? 'Criar Plano' : 'Salvar Alterações'"
                 type="submit" />
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { reactive, watch, computed } from 'vue'
defineOptions({ name: 'PlanEditorDialog' })

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: 'create' }, // 'create' | 'edit'
  value: {
    type: Object,
    default: () => ({
      id: null,
      name: '',
      price: 0,
      popular: false,
      limits: { assistants: 1, messages: 0 },
      features: [] // array de strings
    })
  }
})
const emit = defineEmits(['update:modelValue', 'save'])

const local = reactive(JSON.parse(JSON.stringify(props.value)))
watch(() => props.value, v => Object.assign(local, JSON.parse(JSON.stringify(v))))

const featuresText = computed({
  get: () => (local.features || []).join('\n'),
  set: (v) => { local.features = v.split('\n').map(s => s.trim()).filter(Boolean) }
})

function onSubmit () {
  // devolve um objeto limpo
  emit('save', JSON.parse(JSON.stringify(local)))
  emit('update:modelValue', false)
}
</script>

<style scoped>
.editor-card { min-width: 760px; max-width: 92vw; border-radius: 14px; }
@media (max-width: 780px) { .editor-card { min-width: auto; } }
</style>
