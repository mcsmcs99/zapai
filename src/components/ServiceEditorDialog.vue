<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    persistent
  >
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

          <!-- Cabeçalho + status -->
          <div class="row items-center q-gutter-sm q-mb-md">
            <div class="row items-center q-gutter-sm">
              <q-icon name="content_cut" />
              <div class="text-subtitle1 text-weight-bold">
                {{ mode === 'create' ? 'Novo Serviço' : 'Editar Serviço' }}
              </div>
            </div>

            <q-space />

            <q-toggle
              v-model="local.status"
              :true-value="'active'"
              :false-value="'inactive'"
              color="positive"
              dense
              :label="local.status === 'active' ? 'Ativo' : 'Inativo'"
            />
          </div>

          <!-- Campos -->
          <div class="row q-col-gutter-md">
            <q-input
              class="col-12 col-md-8"
              v-model="local.title"
              outlined
              dense
              label="Nome do Serviço *"
              :rules="[v => !!v || 'Informe o nome']"
            />

            <q-input
              class="col-12 col-md-4"
              v-model.number="local.price"
              type="number"
              min="0"
              step="0.01"
              outlined
              dense
              label="Preço (R$) *"
              :rules="[v => v >= 0 || 'Inválido']"
            />

            <q-input
              class="col-12"
              v-model.number="local.duration"
              type="number"
              min="1"
              outlined
              dense
              label="Duração (minutos) *"
              :rules="[v => v > 0 || 'Inválido']"
            />

            <q-input
              class="col-12"
              v-model="local.description"
              type="textarea"
              autogrow
              outlined
              label="Descrição"
            />
          </div>

          <!-- Colaboradores -->
          <div class="q-mt-lg">
            <div class="text-subtitle1 text-weight-bold q-mb-sm">
              Colaboradores que podem realizar este serviço
            </div>

            <q-banner
              v-if="!collaborators.length"
              rounded
              class="bg-grey-2 text-grey-9"
            >
              Nenhum colaborador cadastrado.
            </q-banner>

            <q-list
              v-else
              bordered
              class="rounded-borders"
              style="max-height: 240px; overflow:auto"
            >
              <q-item v-for="c in collaborators" :key="c.id" tag="label">
                <q-item-section side>
                  <q-checkbox
                    v-model="local.collaboratorIds"
                    :val="Number(c.id)"
                  />
                </q-item-section>

                <q-item-section>
                  <q-item-label class="text-weight-medium">
                    {{ c.name }}
                  </q-item-label>
                  <q-item-label caption>{{ c.role }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- Unidades -->
          <div class="q-mt-xl">
            <div class="text-subtitle1 text-weight-bold q-mb-sm">
              Unidades onde este serviço estará disponível
            </div>

            <q-banner
              v-if="!units.length"
              rounded
              class="bg-grey-2 text-grey-9"
            >
              Nenhuma unidade cadastrada.
              <div class="q-mt-xs text-caption">
                Cadastre uma unidade no menu <b>Unidades &gt; Nova unidade</b>.
              </div>
            </q-banner>

            <q-list
              v-else
              bordered
              class="rounded-borders"
              style="max-height: 240px; overflow:auto"
            >
              <q-item v-for="u in units" :key="u.id" tag="label">
                <q-item-section side>
                  <q-checkbox
                    v-model="local.unitIds"
                    :val="Number(u.id)"
                  />
                </q-item-section>

                <q-item-section>
                  <q-item-label class="text-weight-medium">
                    {{ u.name }}
                  </q-item-label>
                  <q-item-label caption>
                    {{ u.locality || u.administrative_area }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

        </div>

        <!-- Ações -->
        <div class="row justify-end q-gutter-sm q-mt-lg">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            color="primary"
            icon="save"
            :label="mode === 'create' ? 'Criar Serviço' : 'Salvar Alterações'"
            type="submit"
          />
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { reactive, watch } from 'vue'
defineOptions({ name: 'ServiceEditorDialog' })

function normalizeIds (raw) {
  if (!raw) return []
  if (!Array.isArray(raw)) return []
  return [...new Set(raw.map(Number).filter(Number.isFinite))]
}

function normalizeService (v = {}) {
  const out = JSON.parse(JSON.stringify(v || {}))

  if (out.collaboratorIds === undefined && out.collaborator_ids !== undefined) {
    out.collaboratorIds = out.collaborator_ids
  }
  if (out.unitIds === undefined && out.unit_ids !== undefined) {
    out.unitIds = out.unit_ids
  }

  out.collaboratorIds = normalizeIds(out.collaboratorIds)
  out.unitIds = normalizeIds(out.unitIds)

  delete out.collaborator_ids
  delete out.unit_ids

  return out
}

const props = defineProps({
  modelValue: Boolean,
  mode: { type: String, default: 'create' },
  value: { type: Object, default: () => ({}) },
  collaborators: { type: Array, default: () => [] },
  units: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue', 'save'])

const local = reactive(normalizeService(props.value))

watch(
  () => props.value,
  v => Object.assign(local, normalizeService(v)),
  { deep: true }
)

function onSubmit () {
  emit('save', normalizeService(local))
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
  .editor-card {
    min-width: auto;
  }
}
</style>
