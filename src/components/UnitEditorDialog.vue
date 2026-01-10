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
          {{ mode === 'create' ? 'Nova Unidade' : 'Editar Unidade' }}
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
              <q-icon name="store" />
              <div class="text-subtitle1 text-weight-bold">Dados da unidade</div>
            </div>

            <q-space />

            <q-toggle
              v-model="local.is_active"
              color="positive"
              dense
              :label="local.is_active ? 'Ativa' : 'Inativa'"
            />
          </div>

          <!-- Básico -->
          <div class="row q-col-gutter-md">
            <q-input
              class="col-12"
              v-model="local.name"
              outlined
              dense
              label="Nome da unidade *"
              placeholder="Ex: Barbearia Centro"
              :rules="[v => !!v || 'Informe o nome']"
            />

            <q-input
              class="col-12 col-md-6"
              v-model="local.phone"
              outlined
              dense
              label="Telefone"
              placeholder="+5547999999999"
              :mask="phoneMask"
              fill-mask
            />

            <q-input
              class="col-12 col-md-6"
              v-model="local.email"
              outlined
              dense
              label="Email"
              placeholder="contato@empresa.com"
            />

            <!-- Timezone como select -->
            <q-select
              class="col-12"
              v-model="local.timezone"
              :options="timezoneOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              use-input
              fill-input
              hide-selected
              input-debounce="200"
              outlined
              dense
              clearable
              label="Timezone"
              hint="IANA timezone (importante para agenda)"
              :loading="tzLoading"
              @filter="filterTimezone"
            />
          </div>

          <!-- Endereço -->
          <div class="q-mt-lg">
            <div class="text-subtitle1 text-weight-bold q-mb-sm">
              Endereço
            </div>

            <div class="row q-col-gutter-md">
              <q-input
                class="col-12"
                v-model="local.postal_code"
                outlined
                dense
                label="CEP / Postal Code"
                placeholder="89010-000"
              />

              <q-input
                class="col-12 col-md-8"
                v-model="local.address_line1"
                outlined
                dense
                label="Rua / Avenida"
                placeholder="Ex: Rua 7 de Setembro"
              />

              <q-input
                class="col-12 col-md-4"
                v-model="addressNumber"
                outlined
                dense
                label="Número"
                placeholder="Ex: 123"
              />

              <q-input
                class="col-12"
                v-model="local.address_line2"
                outlined
                dense
                label="Complemento"
                placeholder="Ex: Sala 502, Apto 12, Bloco B"
              />

              <q-input
                class="col-12 col-md-4"
                v-model="local.sublocality"
                outlined
                dense
                label="Bairro / Distrito"
                placeholder="Centro"
              />

              <q-input
                class="col-12 col-md-4"
                v-model="local.locality"
                outlined
                dense
                label="Cidade"
                placeholder="Blumenau"
              />

              <q-input
                class="col-12 col-md-4"
                v-model="local.administrative_area"
                outlined
                dense
                label="Estado / Província / Região"
                placeholder="SC"
              />
            </div>

            <div class="q-mt-sm text-caption text-grey-7">
              <q-icon name="info" class="q-mr-xs" />
              <span class="text-weight-medium">Pré-visualização:</span>
              {{ addressPreview }}
            </div>
          </div>

          <!-- Geo / Places -->
          <div class="q-mt-lg">
            <div class="text-subtitle1 text-weight-bold q-mb-sm">
              Localização (opcional)
            </div>

            <div class="row q-col-gutter-md">
              <q-input
                class="col-12 col-md-4"
                v-model.number="local.latitude"
                type="number"
                step="0.00000001"
                outlined
                dense
                label="Latitude"
              />

              <q-input
                class="col-12 col-md-4"
                v-model.number="local.longitude"
                type="number"
                step="0.00000001"
                outlined
                dense
                label="Longitude"
              />

              <q-input
                class="col-12 col-md-4"
                v-model="local.place_id"
                outlined
                dense
                label="Place ID"
                placeholder="Google Place ID (opcional)"
              />
            </div>
          </div>

          <!-- Links (unit_links) -->
          <div class="q-mt-lg">
            <div class="row items-center q-mb-sm">
              <div class="text-subtitle1 text-weight-bold">Links</div>
              <q-space />
              <q-btn
                flat
                icon="add"
                label="Adicionar link"
                @click="addLink"
              />
            </div>

            <q-banner
              v-if="!local.unit_links || local.unit_links.length === 0"
              rounded
              class="bg-grey-2 text-grey-9"
            >
              Nenhum link cadastrado.
              <div class="q-mt-xs text-caption">
                Adicione links como Google Maps, Waze, Instagram, Website, etc.
              </div>
            </q-banner>

            <div v-else class="q-gutter-md">
              <q-card
                v-for="(l, idx) in local.unit_links"
                :key="l.id || idx"
                flat
                bordered
                class="rounded-borders"
              >
                <q-card-section class="row q-col-gutter-md items-start">
                  <q-select
                    class="col-12 col-md-3"
                    v-model="l.type"
                    :options="linkTypeOptions"
                    emit-value
                    map-options
                    outlined
                    dense
                    label="Tipo *"
                    :rules="[v => !!v || 'Obrigatório']"
                  />

                  <q-input
                    class="col-12 col-md-3"
                    v-model="l.provider"
                    outlined
                    dense
                    label="Provider"
                    placeholder="uber, 99, bolt..."
                  />

                  <q-input
                    class="col-12 col-md-6"
                    v-model="l.url"
                    outlined
                    dense
                    label="URL *"
                    placeholder="https://..."
                    :rules="[v => !!v || 'Obrigatório']"
                  />

                  <q-input
                    class="col-12 col-md-6"
                    v-model="l.label"
                    outlined
                    dense
                    label="Label"
                    placeholder="Ex: Abrir no Maps"
                  />

                  <div class="col-12 col-md-3">
                    <q-toggle
                      v-model="l.is_primary"
                      dense
                      label="Principal"
                    />
                    <div class="text-caption text-grey-6">
                      (por tipo)
                    </div>
                  </div>

                  <div class="col-12 col-md-3 row justify-end">
                    <q-btn
                      flat
                      color="negative"
                      icon="delete"
                      label="Remover"
                      @click="removeLink(idx)"
                    />
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>

        <!-- Ações -->
        <div class="row justify-end q-gutter-sm q-mt-lg">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            color="primary"
            icon="save"
            :label="mode === 'create' ? 'Criar Unidade' : 'Salvar Alterações'"
            type="submit"
          />
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { reactive, ref, watch, computed, onMounted } from 'vue'
import { useCountriesStore } from 'src/stores/countries'
import { useMask } from 'src/composables/useMask'
import { getRegionFromCountryName } from 'src/utils/region-from-country'
import { useTimezones } from 'src/composables/useTimezones'

defineOptions({ name: 'UnitEditorDialog' })

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: 'create' }, // 'create' | 'edit'
  company: { type: Object, required: true },
  value: {
    type: Object,
    default: () => ({
      id: null,
      name: '',
      phone: null,
      email: null,
      is_active: true,
      timezone: null,
      address_line1: null,
      address_line2: null,
      sublocality: null,
      locality: null,
      administrative_area: null,
      postal_code: null,
      latitude: null,
      longitude: null,
      place_id: null,
      unit_links: []
    })
  }
})

const emit = defineEmits(['update:modelValue', 'save'])

const local = reactive(JSON.parse(JSON.stringify(props.value)))

watch(
  () => props.value,
  v => {
    Object.assign(local, JSON.parse(JSON.stringify(v || {})))
    addressNumber.value = extractNumberFromLine1(local.address_line1)
  },
  { deep: true }
)

/**
 * -------- País da COMPANY -> região -> máscara telefone --------
 */
const countriesStore = useCountriesStore()
const allCountries = ref([])

const companyCountryId = computed(() => props.company?.country_id || null)

const currentCountry = computed(() => {
  if (!companyCountryId.value || !allCountries.value.length) return null
  return allCountries.value.find(c => c.id === companyCountryId.value) || null
})

// aqui a gente usa sua função existente (mesma ideia do CompanyDialog)
const countryCode = computed(() => {
  // precisa ser alpha2 (BR/US/PT...). Se não achar, cai no BR.
  return getRegionFromCountryName(currentCountry.value?.name) || 'BR'
})

const { mask: phoneMask } = useMask('phone', countryCode)

/**
 * -------- Timezones (via useTimezones) --------
 */
const tzLoading = ref(false)

// useTimezones devolve um ref `options`
const { options: tzOptions } = useTimezones(countryCode)

// base + lista usada no select
const _tzBase = ref([])
const timezoneOptions = ref([])

watch(
  () => tzOptions.value,
  (list) => {
    timezoneOptions.value = Array.isArray(list) ? list : []
    _tzBase.value = timezoneOptions.value.slice()

    // se o timezone atual não existir na lista, limpa
    if (local.timezone && !_tzBase.value.some(t => t.value === local.timezone)) {
      local.timezone = null
    }
  },
  { immediate: true, deep: true }
)

// como agora as opções são síncronas (vêm da lib), loading fica falso
watch(
  () => countryCode.value,
  () => { tzLoading.value = false },
  { immediate: true }
)

function filterTimezone (val, update) {
  update(() => {
    const base = _tzBase.value

    if (!val) {
      timezoneOptions.value = base
      return
    }
    const needle = val.toLowerCase()
    timezoneOptions.value = base.filter(o =>
      `${o.label}`.toLowerCase().includes(needle) ||
      `${o.value}`.toLowerCase().includes(needle)
    )
  })
}

onMounted(async () => {
  // garante países carregados
  if (!countriesStore.items.length) {
    await countriesStore.fetchCountries({
      status: 'active',
      order: 'name',
      dir: 'asc',
      pageSize: 9999
    })
  }
  allCountries.value = (countriesStore.items || []).slice()
})

/**
 * Endereço: separar "Rua" e "Número" sem criar campo novo no backend.
 */
const addressNumber = ref('')

watch(
  () => addressNumber.value,
  () => {
    local.address_line1 = buildLine1(local.address_line1, addressNumber.value)
  }
)

watch(
  () => local.address_line1,
  (v) => {
    const n = extractNumberFromLine1(v)
    if (n && n !== addressNumber.value) addressNumber.value = n
  }
)

function extractNumberFromLine1 (line1) {
  if (!line1) return ''
  const m = String(line1).match(/(?:,\s*|\s+)(\d+[a-zA-Z0-9\-/]*)\s*$/)
  return m?.[1] || ''
}

function buildLine1 (street, number) {
  const s = String(street || '').trim()
  const streetNoNum = s.replace(/(?:,\s*|\s+)(\d+[a-zA-Z0-9\-/]*)\s*$/, '').trim()

  if (!streetNoNum && !number) return ''
  if (!number) return streetNoNum
  if (!streetNoNum) return `${number}`

  return `${streetNoNum}, ${String(number).trim()}`
}

const addressPreview = computed(() => {
  const parts = [
    local.postal_code,
    local.address_line1,
    local.address_line2,
    local.sublocality,
    local.locality,
    local.administrative_area
  ].filter(Boolean)

  return parts.length ? parts.join(' • ') : '—'
})

/**
 * Links
 */
const linkTypeOptions = [
  { label: 'Google Maps', value: 'google_maps' },
  { label: 'Waze', value: 'waze' },
  { label: 'Ride Hailing', value: 'ride_hailing' },
  { label: 'Website', value: 'website' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Facebook', value: 'facebook' }
]

function addLink () {
  if (!Array.isArray(local.unit_links)) local.unit_links = []
  local.unit_links.push({
    id: null,
    type: 'google_maps',
    provider: null,
    url: '',
    label: null,
    is_primary: false
  })
}

function removeLink (idx) {
  local.unit_links.splice(idx, 1)
}

function normalizePrimaryPerType () {
  const seen = new Set()
  for (const l of local.unit_links || []) {
    if (!l?.is_primary) continue
    if (seen.has(l.type)) l.is_primary = false
    else seen.add(l.type)
  }
}

function onSubmit () {
  normalizePrimaryPerType()
  local.address_line1 = buildLine1(local.address_line1, addressNumber.value)

  emit('save', JSON.parse(JSON.stringify(local)))
  emit('update:modelValue', false)
}
</script>

<style scoped>
.editor-card {
  min-width: 860px;
  max-width: 92vw;
  border-radius: 14px;
}
@media (max-width: 900px) {
  .editor-card {
    min-width: auto;
  }
}
</style>
