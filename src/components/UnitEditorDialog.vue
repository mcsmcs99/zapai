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
              <!-- Postal no início (sem País) -->
              <q-input
                class="col-12"
                v-model="local.postal_code"
                outlined
                dense
                label="CEP / Postal Code"
                placeholder="89010-000"
              />

              <!-- Endereço mais “compreensível” -->
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

            <!-- Dica visual: preview do endereço -->
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

defineOptions({ name: 'UnitEditorDialog' })

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: 'create' }, // 'create' | 'edit'
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
  }
)

/**
 * -------- Timezone (select com opções) --------
 */
const tzLoading = ref(false)
const allTimezones = ref([])
const timezoneOptions = ref([])

onMounted(() => {
  allTimezones.value = TZ_LIST.slice()
  timezoneOptions.value = allTimezones.value
})

function filterTimezone (val, update) {
  update(() => {
    if (!val) {
      timezoneOptions.value = allTimezones.value
      return
    }
    const needle = val.toLowerCase()
    timezoneOptions.value = allTimezones.value.filter(o =>
      `${o.label}`.toLowerCase().includes(needle) ||
      `${o.value}`.toLowerCase().includes(needle)
    )
  })
}

/**
 * Endereço: separar "Rua" e "Número" sem criar campo novo no backend.
 * - address_line1 vai ser salvo como "Rua, Número" quando número existir.
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

// Lista ampla (comum) de timezones IANA
const TZ_LIST = [
  { label: 'America/Sao_Paulo (Brasil)', value: 'America/Sao_Paulo' },
  { label: 'America/Fortaleza (Brasil)', value: 'America/Fortaleza' },
  { label: 'America/Manaus (Brasil)', value: 'America/Manaus' },
  { label: 'America/Recife (Brasil)', value: 'America/Recife' },
  { label: 'America/Cuiaba (Brasil)', value: 'America/Cuiaba' },
  { label: 'America/Belem (Brasil)', value: 'America/Belem' },
  { label: 'America/Rio_Branco (Brasil)', value: 'America/Rio_Branco' },
  { label: 'America/New_York (US)', value: 'America/New_York' },
  { label: 'America/Chicago (US)', value: 'America/Chicago' },
  { label: 'America/Denver (US)', value: 'America/Denver' },
  { label: 'America/Los_Angeles (US)', value: 'America/Los_Angeles' },
  { label: 'America/Toronto (CA)', value: 'America/Toronto' },
  { label: 'America/Mexico_City (MX)', value: 'America/Mexico_City' },
  { label: 'America/Buenos_Aires (AR)', value: 'America/Argentina/Buenos_Aires' },
  { label: 'Europe/Lisbon (PT)', value: 'Europe/Lisbon' },
  { label: 'Europe/Madrid (ES)', value: 'Europe/Madrid' },
  { label: 'Europe/London (UK)', value: 'Europe/London' },
  { label: 'Europe/Paris (FR)', value: 'Europe/Paris' },
  { label: 'Europe/Berlin (DE)', value: 'Europe/Berlin' },
  { label: 'Europe/Rome (IT)', value: 'Europe/Rome' },
  { label: 'Europe/Amsterdam (NL)', value: 'Europe/Amsterdam' },
  { label: 'Europe/Zurich (CH)', value: 'Europe/Zurich' },
  { label: 'Africa/Johannesburg (ZA)', value: 'Africa/Johannesburg' },
  { label: 'Africa/Lagos (NG)', value: 'Africa/Lagos' },
  { label: 'Asia/Dubai (AE)', value: 'Asia/Dubai' },
  { label: 'Asia/Riyadh (SA)', value: 'Asia/Riyadh' },
  { label: 'Asia/Kolkata (IN)', value: 'Asia/Kolkata' },
  { label: 'Asia/Bangkok (TH)', value: 'Asia/Bangkok' },
  { label: 'Asia/Singapore (SG)', value: 'Asia/Singapore' },
  { label: 'Asia/Hong_Kong (HK)', value: 'Asia/Hong_Kong' },
  { label: 'Asia/Shanghai (CN)', value: 'Asia/Shanghai' },
  { label: 'Asia/Tokyo (JP)', value: 'Asia/Tokyo' },
  { label: 'Asia/Seoul (KR)', value: 'Asia/Seoul' },
  { label: 'Australia/Sydney (AU)', value: 'Australia/Sydney' },
  { label: 'Australia/Melbourne (AU)', value: 'Australia/Melbourne' },
  { label: 'Pacific/Auckland (NZ)', value: 'Pacific/Auckland' },
  { label: 'UTC', value: 'UTC' }
]
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
