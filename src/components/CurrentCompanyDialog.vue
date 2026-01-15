<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    persistent
  >
    <q-card class="company-dialog-card">
      <!-- HEADER -->
      <q-card-section class="row items-center company-dialog-header">
        <q-avatar size="52px" color="primary" text-color="white" class="q-mr-md">
          <q-icon name="apartment" />
        </q-avatar>

        <div class="column">
          <div class="row items-center q-gutter-sm">
            <div class="text-subtitle1 text-weight-bold">
              {{ headerTitle }}
            </div>
            <q-badge color="primary" outline>
              Empresa atual
            </q-badge>
          </div>

          <div class="row items-center q-gutter-sm q-mt-xs text-caption text-grey-7">
            <span v-if="headerCompany.document_number">
              CNPJ: {{ headerCompany.document_number }}
            </span>
            <span v-else class="text-grey-6">
              CNPJ não informado
            </span>
          </div>

          <div class="text-caption text-grey-6 q-mt-xs">
            Edite as informações cadastrais e de contato da empresa vinculada ao seu usuário.
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- BODY -->
      <q-card-section class="company-dialog-body">
        <q-form @submit.prevent="onSubmit" ref="formRef" class="q-gutter-md">
          <div class="row q-col-gutter-md company-fields-grid">
            <!-- País -->
            <q-select
              class="col-12 col-md-6 company-field"
              v-model="localCompany.country_id"
              :options="countryOptions"
              option-value="id"
              option-label="name"
              label="País"
              emit-value
              map-options
              use-input
              fill-input
              hide-selected
              input-debounce="300"
              outlined
              dense
              lazy-rules="ondemand"
              hide-bottom-space
              :loading="countriesStore.loading"
              clearable
              @filter="filterCountries"
              @update:model-value="onCountryChange"
            />

            <!-- Locale -->
            <q-select
              class="col-12 col-md-3 company-field"
              v-model="localCompany.locale_id"
              :options="localeOptions"
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
              label="Locale"
              :loading="localeLoading"
              :disable="!localCompany.country_id || !allLocales.length"
              @filter="filterLocale"
              @update:model-value="val => { localCompany.locale_id = val ?? null }"
            />

            <!-- Moeda -->
            <q-select
              class="col-12 col-md-3 company-field"
              v-model="localCompany.currency_id"
              :options="currencyOptions"
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
              label="Moeda"
              :loading="currencyLoading"
              :disable="!localCompany.country_id || !allCurrencies.length"
              @filter="filterCurrency"
              @update:model-value="val => { localCompany.currency_id = val ?? null }"
            />

            <q-input
              class="col-12 col-md-6 company-field"
              v-model="localCompany.company_name"
              label="Razão social"
              :rules="[req]"
              outlined
              dense
              lazy-rules="ondemand"
              hide-bottom-space
            />

            <q-input
              class="col-12 col-md-6 company-field"
              v-model="localCompany.company_fantasy_name"
              label="Nome fantasia"
              outlined
              dense
              lazy-rules="ondemand"
              hide-bottom-space
            />

            <q-input
              class="col-12 col-md-6 company-field"
              v-model="localCompany.document_number"
              label="CNPJ"
              :mask="docMask"
              fill-mask
              outlined
              dense
              :rules="[req, cnpjLocalRule]"
              lazy-rules="ondemand"
              hide-bottom-space
            />

            <q-input
              class="col-12 col-md-6 company-field"
              v-model="localCompany.link_whatsapp"
              label="WhatsApp"
              :mask="whatsMask"
              fill-mask
              outlined
              dense
              :rules="[req]"
              lazy-rules="ondemand"
              hide-bottom-space
            />

            <q-input
              class="col-12 col-md-6 company-field"
              v-model="localCompany.link_instagram"
              label="Link Instagram"
              outlined
              dense
              lazy-rules="ondemand"
              hide-bottom-space
            />

            <q-input
              class="col-12 col-md-6 company-field"
              v-model="localCompany.link_facebook"
              label="Link Facebook"
              outlined
              dense
              lazy-rules="ondemand"
              hide-bottom-space
            />

            <q-input
              class="col-12 col-md-6 company-field"
              v-model="localCompany.phone_fix"
              label="Telefone fixo"
              :mask="phoneMask"
              fill-mask
              outlined
              dense
              lazy-rules="ondemand"
              hide-bottom-space
            />
          </div>

          <div class="row justify-end q-mt-md q-gutter-sm">
            <q-btn
              flat
              label="Fechar"
              color="grey-7"
              :disable="loading"
              @click="$emit('update:modelValue', false)"
            />
            <q-btn
              unelevated
              color="primary"
              :loading="loading"
              type="submit"
              label="Salvar alterações"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, onMounted, computed, reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useCountriesStore } from 'src/stores/countries'
import { useMask } from 'src/composables/useMask'
import { getRegionFromCountryName } from 'src/utils/region-from-country'
import { cnpjRule } from 'src/utils/validators/cnpj'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  company: { type: Object, required: true }
})

const emit = defineEmits(['update:modelValue', 'save'])

const $q = useQuasar()
const loading = ref(false)
const formRef = ref(null)
const req = v => !!v || 'Obrigatório'

// agora salvamos FK (ids)
const localCompany = reactive({
  id: null,
  country_id: null,
  locale_id: null,
  currency_id: null,
  company_name: '',
  company_fantasy_name: '',
  document_number: '',
  link_whatsapp: '',
  link_instagram: '',
  link_facebook: '',
  phone_fix: ''
})

const headerCompany = reactive({
  company_name: '',
  company_fantasy_name: '',
  document_number: ''
})

const headerTitle = computed(() => {
  return headerCompany.company_fantasy_name || headerCompany.company_name || 'Empresa atual'
})

// --- countries store ---
const countriesStore = useCountriesStore()

const allCountries = ref([])
const countryOptions = ref([])

function filterCountries (val, update) {
  update(() => {
    if (!val) return (countryOptions.value = allCountries.value)
    const needle = val.toLowerCase()
    countryOptions.value = allCountries.value.filter(c => c.name.toLowerCase().includes(needle))
  })
}

const currentCountry = computed(() => {
  if (!localCompany.country_id || !allCountries.value.length) return null
  return allCountries.value.find(c => c.id === localCompany.country_id) || null
})

const currentRegion = computed(() => getRegionFromCountryName(currentCountry.value?.name))

// máscaras
const { mask: docMask } = useMask('document', currentRegion)
const { mask: whatsMask } = useMask('whatsapp', currentRegion)
const { mask: phoneMask } = useMask('phone', currentRegion)

const cnpjLocalRule = (value) => {
  if (currentRegion.value !== 'BR') return true
  return cnpjRule(value)
}

// ------- Locale / Moeda (select com busca) -------
const localeLoading = ref(false)
const currencyLoading = ref(false)

const allLocales = ref([])
const localeOptions = ref([])

const allCurrencies = ref([])
const currencyOptions = ref([])

function filterLocale (val, update) {
  update(() => {
    if (!val) return (localeOptions.value = allLocales.value)
    const needle = val.toLowerCase()
    localeOptions.value = allLocales.value.filter(o =>
      `${o.label}`.toLowerCase().includes(needle) ||
      `${o.value}`.toLowerCase().includes(needle)
    )
  })
}

function filterCurrency (val, update) {
  update(() => {
    if (!val) return (currencyOptions.value = allCurrencies.value)
    const needle = val.toLowerCase()
    currencyOptions.value = allCurrencies.value.filter(o =>
      `${o.label}`.toLowerCase().includes(needle) ||
      `${o.value}`.toLowerCase().includes(needle)
    )
  })
}

async function fetchCountryOptions (countryId, { applyDefaults = false } = {}) {
  localeLoading.value = true
  currencyLoading.value = true

  try {
    const r = await countriesStore.fetchCountryOptions(countryId)

    const locales = (r?.locales || []).map(l => ({
      value: l.id,
      label: `${l.name} — ${l.code}`
    }))

    const currencies = (r?.currencies || []).map(c => ({
      value: c.id,
      label: c.symbol ? `${c.name} (${c.symbol}) — ${c.code}` : `${c.name} — ${c.code}`
    }))

    allLocales.value = locales
    localeOptions.value = locales

    allCurrencies.value = currencies
    currencyOptions.value = currencies

    // ✅ IMPORTANTE:
    // - Ao ABRIR modal: NÃO aplica defaults (respeita o que veio do backend)
    // - Ao TROCAR país: pode aplicar defaults (se quiser) quando estiver vazio
    const defaults = r?.defaults || {}
    if (applyDefaults) {
      if (!localCompany.locale_id && defaults.locale_id) localCompany.locale_id = defaults.locale_id
      if (!localCompany.currency_id && defaults.currency_id) localCompany.currency_id = defaults.currency_id
    }

    // fallback se vier salvo mas não está nas opções
    if (localCompany.locale_id && !locales.some(o => o.value === localCompany.locale_id)) {
      allLocales.value = [
        { value: localCompany.locale_id, label: `Locale #${localCompany.locale_id}` },
        ...locales
      ]
      localeOptions.value = allLocales.value
    }

    if (localCompany.currency_id && !currencies.some(o => o.value === localCompany.currency_id)) {
      allCurrencies.value = [
        { value: localCompany.currency_id, label: `Currency #${localCompany.currency_id}` },
        ...currencies
      ]
      currencyOptions.value = allCurrencies.value
    }
  } catch (e) {
    console.error(e)

    allLocales.value = []
    localeOptions.value = []
    allCurrencies.value = []
    currencyOptions.value = []
    localCompany.locale_id = null
    localCompany.currency_id = null

    $q.notify({ type: 'negative', message: 'Não foi possível carregar locales e moedas para este país.' })
  } finally {
    localeLoading.value = false
    currencyLoading.value = false
  }
}

async function onCountryChange (val) {
  localCompany.country_id = val ?? null

  // ✅ sempre que trocar país: limpa os campos
  localCompany.locale_id = null
  localCompany.currency_id = null

  // limpa opções também
  allLocales.value = []
  localeOptions.value = []
  allCurrencies.value = []
  currencyOptions.value = []

  if (!localCompany.country_id) return

  // ✅ ao trocar país, você pode optar por aplicar defaults do país novo
  // se NÃO quiser defaults automáticos, troque applyDefaults para false
  await fetchCountryOptions(localCompany.country_id, { applyDefaults: false })
}

// ✅ ao abrir modal: apenas respeita o que veio do backend.
// NÃO aplica defaults daqui.
watch(
  () => props.company,
  async (val) => {
    if (!val) return

    // garante que só vem do backend (sem defaults do front)
    localCompany.id = val.id ?? null
    localCompany.country_id = val.country_id ?? null
    localCompany.locale_id = val.locale_id ?? null
    localCompany.currency_id = val.currency_id ?? null
    localCompany.company_name = val.company_name ?? ''
    localCompany.company_fantasy_name = val.company_fantasy_name ?? ''
    localCompany.document_number = val.document_number ?? ''
    localCompany.link_whatsapp = val.link_whatsapp ?? ''
    localCompany.link_instagram = val.link_instagram ?? ''
    localCompany.link_facebook = val.link_facebook ?? ''
    localCompany.phone_fix = val.phone_fix ?? ''

    headerCompany.company_name = val.company_name || ''
    headerCompany.company_fantasy_name = val.company_fantasy_name || ''
    headerCompany.document_number = val.document_number || ''

    // carrega opções do país, mas SEM aplicar defaults
    if (localCompany.country_id) {
      await fetchCountryOptions(localCompany.country_id, { applyDefaults: false })
    } else {
      allLocales.value = []
      localeOptions.value = []
      allCurrencies.value = []
      currencyOptions.value = []
    }
  },
  { immediate: true, deep: true }
)

onMounted(async () => {
  if (!countriesStore.items.length) {
    await countriesStore.fetchCountries({
      status: 'active',
      order: 'name',
      dir: 'asc',
      pageSize: 9999
    })
  }

  allCountries.value = (countriesStore.items || []).slice()
  countryOptions.value = allCountries.value
})

async function onSubmit () {
  const ok = await formRef.value.validate()
  if (!ok) return

  loading.value = true
  try {
    emit('save', {
      ...localCompany,
      locale_id: localCompany.locale_id ?? null,
      currency_id: localCompany.currency_id ?? null
    })
  } catch (e) {
    console.error(e)
    $q.notify({ type: 'negative', message: 'Erro ao salvar os dados da empresa.' })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.company-dialog-card {
  width: 960px;
  max-width: 98vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.company-dialog-header {
  padding: 20px 28px 14px 28px;
}

.company-dialog-body {
  padding: 18px 28px 24px 28px;
}

.company-fields-grid .company-field {
  margin-bottom: 12px;
}

.company-dialog-card > .company-dialog-body {
  overflow-y: auto;
}
</style>
