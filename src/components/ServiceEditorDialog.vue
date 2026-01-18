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
              <q-icon :name="iconName" />
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

            <!-- Linha 1: Nome + Ícone -->
            <q-input
              class="col-12 col-md-6"
              v-model="local.title"
              outlined
              dense
              hide-bottom-space
              label="Nome do Serviço *"
              :rules="[v => !!v || 'Informe o nome']"
            />

            <q-select
              class="col-12 col-md-6 service-icon-select"
              v-model="local.icon"
              :options="filteredIconOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              outlined
              dense
              clearable
              use-input
              input-debounce="0"
              hide-bottom-space
              label="Ícone do Serviço"
              :display-value="selectedIconLabel(local.icon)"
              @filter="filterIcons"
            >
              <!-- ícone dentro do campo (mantém altura igual ao q-input) -->
              <template #prepend>
                <q-icon :name="iconName" />
              </template>

              <!-- opções com preview -->
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section side>
                    <q-icon :name="scope.opt.value" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <!-- Linha 2: Preço + Duração -->
            <q-input
              class="col-12 col-md-6"
              v-model.number="local.price"
              type="number"
              min="0"
              step="0.01"
              outlined
              dense
              hide-bottom-space
              label="Preço (R$) *"
              :rules="[v => v >= 0 || 'Inválido']"
            />

            <q-input
              class="col-12 col-md-6"
              v-model.number="local.duration"
              type="number"
              min="1"
              outlined
              dense
              hide-bottom-space
              label="Duração (minutos) *"
              :rules="[v => v > 0 || 'Inválido']"
            />

            <!-- Tipo de atendimento (gatilho do menu) -->
            <q-select
              class="col-12 service-attendance-select"
              v-model="local.attendance_mode"
              :options="attendanceModeOptions"
              emit-value
              map-options
              outlined
              dense
              hide-bottom-space
              label="Tipo de atendimento *"
              :rules="[v => !!v || 'Selecione o tipo de atendimento']"
            >
              <template #prepend>
                <q-icon name="place" />
              </template>

              <template #hint>
                Define se este serviço aparece no agendamento por unidade, domicílio, ou em ambos.
              </template>
            </q-select>

            <!-- Descrição -->
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

          <!-- Unidades (só faz sentido quando aceita agendamento por unidade) -->
          <div class="q-mt-xl">
            <div class="row items-center q-gutter-sm q-mb-sm">
              <div class="text-subtitle1 text-weight-bold">
                Unidades onde este serviço estará disponível
              </div>
              <q-badge
                v-if="!acceptsFixed"
                outline
                color="grey-7"
                class="q-ml-sm"
              >
                Não obrigatório (serviço não atende por unidade)
              </q-badge>
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
              :class="{ 'is-disabled-section': !acceptsFixed }"
            >
              <q-item v-for="u in units" :key="u.id" tag="label">
                <q-item-section side>
                  <q-checkbox
                    v-model="local.unitIds"
                    :val="Number(u.id)"
                    :disable="!acceptsFixed"
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

            <div v-if="!acceptsFixed" class="text-caption text-grey-7 q-mt-sm">
              Este serviço está configurado como <b>domicílio</b>. Por isso, as unidades não precisam ser selecionadas.
            </div>
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
import { reactive, watch, ref, computed } from 'vue'
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

  if (typeof out.icon === 'object' && out.icon?.value) out.icon = out.icon.value
  if (!out.icon || typeof out.icon !== 'string') out.icon = 'content_cut'

  // novo campo (tipo de atendimento)
  // fallback: se backend ainda não mandar, assume "fixed" (comportamento atual)
  if (!out.attendance_mode) out.attendance_mode = 'fixed'

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

const iconName = computed(() => {
  const v = local.icon
  if (typeof v === 'string' && v) return v
  if (v && typeof v === 'object' && v.value) return v.value
  return 'content_cut'
})

const attendanceModeOptions = [
  { label: 'Atendimento por unidade (presencial)', value: 'fixed' },
  { label: 'Atendimento domiciliar (endereço do cliente)', value: 'client_location' },
  { label: 'Ambos (unidade e domicílio)', value: 'mixed' }
]

const acceptsFixed = computed(() => {
  return local.attendance_mode === 'fixed' || local.attendance_mode === 'mixed'
})

// se trocar para domicílio, não faz sentido manter units selecionadas
watch(
  () => local.attendance_mode,
  (val) => {
    if (val === 'client_location') {
      local.unitIds = []
    }
  }
)

const iconOptions = [
  { label: 'Tesoura (Barbearia)', value: 'content_cut' },
  { label: 'Salão / Beleza', value: 'spa' },
  { label: 'Rosto / Beauty', value: 'face' },
  { label: 'Mãos / Unhas', value: 'pan_tool' },
  { label: 'Bem-estar', value: 'mood' },
  { label: 'Relax', value: 'hot_tub' },
  { label: 'Perfume / Flor', value: 'local_florist' },
  { label: 'Saúde / Clínica', value: 'local_hospital' },
  { label: 'Farmácia', value: 'local_pharmacy' },
  { label: 'Acessibilidade', value: 'accessible' },
  { label: 'Primeiros socorros', value: 'healing' },
  { label: 'Informação médica', value: 'info' },
  { label: 'Academia', value: 'fitness_center' },
  { label: 'Corrida', value: 'directions_run' },
  { label: 'Bicicleta', value: 'directions_bike' },
  { label: 'Piscina', value: 'pool' },
  { label: 'Esporte', value: 'sports_soccer' },
  { label: 'Restaurante', value: 'restaurant' },
  { label: 'Café', value: 'local_cafe' },
  { label: 'Pizza', value: 'local_pizza' },
  { label: 'Fast-food', value: 'fastfood' },
  { label: 'Bolo / Doces', value: 'cake' },
  { label: 'Mercado', value: 'shopping_cart' },
  { label: 'Entrega / Motoboy', value: 'local_shipping' },
  { label: 'Loja', value: 'store' },
  { label: 'Ferramentas', value: 'build' },
  { label: 'Construção', value: 'domain' },
  { label: 'Limpeza', value: 'delete_sweep' },
  { label: 'Pintura', value: 'format_paint' },
  { label: 'Chave', value: 'vpn_key' },
  { label: 'Carro', value: 'directions_car' },
  { label: 'Lavagem', value: 'local_car_wash' },
  { label: 'Gasolina', value: 'local_gas_station' },
  { label: 'Pet', value: 'pets' },
  { label: 'Agenda', value: 'event' },
  { label: 'Horário', value: 'schedule' },
  { label: 'Atendimento', value: 'support_agent' },
  { label: 'Pessoas / Equipe', value: 'groups' },
  { label: 'Dinheiro', value: 'attach_money' },
  { label: 'Cartão', value: 'credit_card' },
  { label: 'Recibo', value: 'receipt' },
  { label: 'Marketing', value: 'trending_up' },
  { label: 'Link', value: 'link' },
  { label: 'Configurações', value: 'settings' },
  { label: 'Escola', value: 'school' },
  { label: 'Livro', value: 'menu_book' },
  { label: 'Casa', value: 'home' },
  { label: 'Local', value: 'place' },
  { label: 'Mapa', value: 'map' }
]

const filteredIconOptions = ref([...iconOptions])

function filterIcons (val, update) {
  update(() => {
    const v = (val || '').toLowerCase().trim()
    filteredIconOptions.value = !v
      ? [...iconOptions]
      : iconOptions.filter(o =>
          o.label.toLowerCase().includes(v) || o.value.toLowerCase().includes(v)
        )
  })
}

function selectedIconLabel (iconValue) {
  if (typeof iconValue === 'string') {
    const found = iconOptions.find(o => o.value === iconValue)
    return found?.label || iconValue
  }
  if (iconValue && typeof iconValue === 'object') {
    return iconValue.label || iconValue.value || 'content_cut'
  }
  return 'content_cut'
}

function onSubmit () {
  emit('save', normalizeService(local))
  emit('update:modelValue', false)
}
</script>

<style scoped>
.editor-card {
  width: 760px;
  max-width: 92vw;
  border-radius: 14px;
}

@media (max-width: 780px) {
  .editor-card {
    width: 92vw;
    min-width: auto;
  }
}

/* trava layout do select */
.service-icon-select {
  min-width: 0;
}

/* trava o select de tipo de atendimento (evita resize por label maior/menor) */
.service-attendance-select {
  min-width: 0;
}

/* força o campo a não ficar “pulando” com textos diferentes */
.service-attendance-select :deep(.q-field__control) {
  white-space: nowrap;
}

/* e evita que o texto do valor “estique” a linha */
.service-attendance-select :deep(.q-field__native),
.service-attendance-select :deep(.q-field__input),
.service-attendance-select :deep(.q-field__control-container) {
  min-width: 0;
}

/* opcional: mostra ellipsis se o label for grande */
.service-attendance-select :deep(.q-field__native span),
.service-attendance-select :deep(.q-field__input) {
  overflow: hidden;
  text-overflow: ellipsis;
}

.is-disabled-section {
  opacity: 0.65;
}
</style>
