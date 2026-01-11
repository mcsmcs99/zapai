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
            />

            <!-- Locale -->
            <q-select
              class="col-12 col-md-3 company-field"
              v-model="localCompany.locale"
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
              @filter="filterLocale"
            />

            <!-- Moeda -->
            <q-select
              class="col-12 col-md-3 company-field"
              v-model="localCompany.currency_code"
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
              @filter="filterCurrency"
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
import { countries as countriesList } from 'countries-list'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  company: { type: Object, required: true }
})

const emit = defineEmits(['update:modelValue', 'save'])

const $q = useQuasar()
const loading = ref(false)
const formRef = ref(null)
const req = v => !!v || 'Obrigatório'

const localCompany = reactive({
  id: null,
  country_id: null,
  locale: null,
  currency_code: null,
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

watch(
  () => props.company,
  (val) => {
    if (!val) return
    Object.assign(localCompany, val)

    if (typeof localCompany.locale === 'undefined') localCompany.locale = null
    if (typeof localCompany.currency_code === 'undefined') localCompany.currency_code = null

    headerCompany.company_name = val.company_name || ''
    headerCompany.company_fantasy_name = val.company_fantasy_name || ''
    headerCompany.document_number = val.document_number || ''
  },
  { immediate: true, deep: true }
)

// --- countries store ---
const countriesStore = useCountriesStore()

const allCountries = ref([])
const countryOptions = ref([])

const currentCountry = computed(() => {
  if (!localCompany.country_id || !allCountries.value.length) return null
  return allCountries.value.find(c => c.id === localCompany.country_id) || null
})

const currentRegion = computed(() => {
  return getRegionFromCountryName(currentCountry.value?.name)
})

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

function filterCountries (val, update) {
  update(() => {
    if (!val) return (countryOptions.value = allCountries.value)
    const needle = val.toLowerCase()
    countryOptions.value = allCountries.value.filter(c => c.name.toLowerCase().includes(needle))
  })
}

/**
 * Helpers seguros
 */
function safeUpper2 (v) {
  const s = String(v || '').trim().toUpperCase()
  return s.length === 2 ? s : ''
}

function extractLanguagesFromLibCountry (libCountry) {
  if (!libCountry) return []
  const langs = libCountry.languages

  if (Array.isArray(langs)) {
    return langs.map(s => String(s).toLowerCase()).filter(Boolean)
  }

  if (langs && typeof langs === 'object') {
    return Object.keys(langs).map(s => String(s).toLowerCase()).filter(Boolean)
  }

  return []
}

function getPrimaryLanguage (langs) {
  return (langs && langs[0]) ? langs[0] : 'en'
}

function getDisplayLocaleForCountry (iso2) {
  const upper = safeUpper2(iso2)
  const libCountry = upper ? countriesList[upper] : null
  const langs = extractLanguagesFromLibCountry(libCountry)
  const primary = getPrimaryLanguage(langs)
  // se o locale ficar inválido, Intl normalmente aceita "en-XX", mas vamos cair pra en-US se der ruim
  return upper ? `${primary}-${upper}` : 'en-US'
}

function makeDisplayNamesSafe (displayLocale) {
  // nunca quebra
  const can = typeof Intl.DisplayNames !== 'undefined'
  if (!can) return { dnLang: null, dnRegion: null, dnCurrency: null }

  const safe = (type) => {
    try {
      return new Intl.DisplayNames([displayLocale], { type })
    } catch (e) {
      console.warn(e)
      // fallback genérico
      try {
        return new Intl.DisplayNames(['en-US'], { type })
      } catch (e2) {
        console.warn(e2)
        return null
      }
    }
  }

  return {
    dnLang: safe('language'),
    dnRegion: safe('region'),
    dnCurrency: safe('currency')
  }
}

function isValidCurrency (currency) {
  // valida com NumberFormat (se for inválida, estoura RangeError)
  try {
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(1)
    return true
  } catch (e) {
    console.warn(e)
    return false
  }
}

function safeCurrencyName (displayLocale, currency) {
  // tenta DisplayNames, se falhar, fallback para o próprio código
  try {
    const { dnCurrency } = makeDisplayNamesSafe(displayLocale)
    const name = dnCurrency?.of(currency)
    return name || currency
  } catch (e) {
    console.warn(e)
    return currency
  }
}

function safeCurrencySymbol (displayLocale, currency) {
  try {
    const parts = new Intl.NumberFormat(displayLocale, { style: 'currency', currency }).formatToParts(1)
    return parts.find(p => p.type === 'currency')?.value || ''
  } catch (e) {
    console.warn(e)
    return ''
  }
}

function buildLocaleOptionsForCountry (iso2) {
  const upper = safeUpper2(iso2)
  if (!upper) return [{ value: 'en-US', label: 'English (United States) — en-US' }]

  const libCountry = countriesList[upper]
  const langs = extractLanguagesFromLibCountry(libCountry)
  const primary = getPrimaryLanguage(langs)

  const displayLocale = `${primary}-${upper}`
  const { dnLang, dnRegion } = makeDisplayNamesSafe(displayLocale)

  let regionName = upper
  try {
    regionName = dnRegion?.of(upper) || upper
  } catch (e) {
    console.warn(e)
    regionName = upper
  }

  const set = new Set()
  set.add(`${primary}-${upper}`)
  langs.forEach(l => set.add(`${l}-${upper}`))
  set.add(`en-${upper}`)

  const values = Array.from(set)

  const mapped = values.map(loc => {
    const [lang] = loc.split('-')
    let langName = lang
    try {
      langName = dnLang?.of(lang) || lang
    } catch (e) {
      console.warn(e)
      langName = lang
    }
    return { value: loc, label: `${langName} (${regionName}) — ${loc}` }
  })

  return mapped.length ? mapped : [{ value: 'en-US', label: 'English (United States) — en-US' }]
}

function buildCurrencyOptionsForCountry (iso2) {
  const upper = safeUpper2(iso2)
  const fallbackDisplay = 'en-US'

  // fallback ABSOLUTO
  const fallback = () => {
    const currency = 'USD'
    const name = safeCurrencyName(fallbackDisplay, currency)
    const symbol = safeCurrencySymbol(fallbackDisplay, currency)
    const label = symbol ? `${name} (${symbol}) — ${currency}` : `${name} — ${currency}`
    return [{ value: currency, label }]
  }

  if (!upper) return fallback()

  const libCountry = countriesList[upper]
  const raw = libCountry?.currency ? String(libCountry.currency).trim().toUpperCase() : ''
  const currency = raw || ''

  if (!currency) return fallback()

  // se currency for inválida pra Intl, cai pro USD
  if (!isValidCurrency(currency)) return fallback()

  const displayLocale = getDisplayLocaleForCountry(upper)

  const name = safeCurrencyName(displayLocale, currency)
  const symbol = safeCurrencySymbol(displayLocale, currency)
  const nice = symbol ? `${name} (${symbol}) — ${currency}` : `${name} — ${currency}`

  return [{ value: currency, label: nice }]
}

function applyCountryDerivedLocaleAndCurrency (iso2) {
  localeLoading.value = true
  currencyLoading.value = true

  try {
    const locales = buildLocaleOptionsForCountry(iso2)
    const currencies = buildCurrencyOptionsForCountry(iso2)

    allLocales.value = locales
    localeOptions.value = locales

    allCurrencies.value = currencies
    currencyOptions.value = currencies

    // defaults coerentes e sempre existentes
    const localeValues = new Set(locales.map(o => o.value))
    if (!localCompany.locale || !localeValues.has(localCompany.locale)) {
      localCompany.locale = locales[0]?.value || 'en-US'
    }

    const currencyValues = new Set(currencies.map(o => o.value))
    if (!localCompany.currency_code || !currencyValues.has(localCompany.currency_code)) {
      localCompany.currency_code = currencies[0]?.value || 'USD'
    }
  } catch (e) {
    console.error('applyCountryDerivedLocaleAndCurrency error', e)

    // fallback “global”
    const locales = [{ value: 'en-US', label: 'English (United States) — en-US' }]
    const currencies = buildCurrencyOptionsForCountry(null)

    allLocales.value = locales
    localeOptions.value = locales
    allCurrencies.value = currencies
    currencyOptions.value = currencies

    localCompany.locale = locales[0].value
    localCompany.currency_code = currencies[0].value
  } finally {
    localeLoading.value = false
    currencyLoading.value = false
  }
}

watch(
  () => currentCountry.value?.iso2,
  (iso2) => {
    if (!iso2) {
      // limpa e deixa fallback leve
      const locales = [{ value: 'en-US', label: 'English (United States) — en-US' }]
      const currencies = buildCurrencyOptionsForCountry(null)

      allLocales.value = locales
      localeOptions.value = locales
      allCurrencies.value = currencies
      currencyOptions.value = currencies

      if (!localCompany.locale) localCompany.locale = locales[0].value
      if (!localCompany.currency_code) localCompany.currency_code = currencies[0].value
      return
    }
    applyCountryDerivedLocaleAndCurrency(iso2)
  },
  { immediate: true }
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
    emit('save', { ...localCompany })
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
