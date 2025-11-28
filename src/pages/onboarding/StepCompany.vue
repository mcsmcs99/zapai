<template>
  <q-form @submit.prevent="onSubmit" ref="formRef" class="q-gutter-md">
    <div class="row q-col-gutter-md">

      <q-select
        class="col-12 col-md-6"
        v-model="ob.company.country_id"
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

      <q-input
        class="col-12 col-md-6"
        v-model="ob.company.company_name"
        label="Razão social"
        :rules="[req]"
        outlined
        dense
        lazy-rules="ondemand"
        hide-bottom-space
      />

      <q-input
        class="col-12 col-md-6"
        v-model="ob.company.company_fantasy_name"
        label="Nome fantasia"
        outlined
        dense
        lazy-rules="ondemand"
        hide-bottom-space
      />

      <q-input
        class="col-12 col-md-6"
        v-model="ob.company.document_number"
        label="CNPJ"
        :mask="docMask"
        fill-mask
        outlined
        dense
        :rules="[req, cnpjBrasilApiRule]"
        lazy-rules="ondemand"
        hide-bottom-space
      />

      <q-input
        class="col-12 col-md-6"
        v-model="ob.company.link_whatsapp"
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
        class="col-12 col-md-6"
        v-model="ob.company.link_instagram"
        label="Link Instagram"
        outlined
        dense
        lazy-rules="ondemand"
        hide-bottom-space
      />

      <q-input
        class="col-12 col-md-6"
        v-model="ob.company.link_facebook"
        label="Link Facebook"
        outlined
        dense
        lazy-rules="ondemand"
        hide-bottom-space
      />

      <q-input
        class="col-12 col-md-6"
        v-model="ob.company.phone_fix"
        label="Telefone fixo"
        :mask="phoneMask"
        fill-mask
        outlined
        dense
        lazy-rules="ondemand"
        hide-bottom-space
      />

    </div>

    <div class="row justify-between q-mt-md">
      <q-space />
      <q-btn
        unelevated
        color="primary"
        :loading="loading"
        type="submit"
        label="Avançar"
      />
    </div>
  </q-form>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useOnboardingStore } from 'src/stores/onboarding'
import { useMask } from 'src/composables/useMask'
import { useCountriesStore } from 'src/stores/countries'
import { getRegionFromCountryName } from 'src/utils/region-from-country'
import { fetchCnpj } from 'src/services/brasilapi'

const $q = useQuasar()
const ob = useOnboardingStore()
const emit = defineEmits(['next', 'back'])

const loading = ref(false)
const formRef = ref(null)
const req = v => !!v || 'Obrigatório'

// --- countries store ---
const countriesStore = useCountriesStore()

// lista completa e lista filtrada para o select
const allCountries = ref([])
const countryOptions = ref([])

// país atual (objeto) baseado no country_id
const currentCountry = computed(() => {
  if (!ob.company.country_id || !allCountries.value.length) return null
  return allCountries.value.find(c => c.id === ob.company.country_id) || null
})

// região derivada do país (por enquanto BR/US, mas dá pra expandir fácil)
const currentRegion = computed(() => {
  return getRegionFromCountryName(currentCountry.value?.name)
})

// máscaras dinâmicas com base na região derivada do país
const { mask: docMask } = useMask('document', currentRegion)
const { mask: whatsMask } = useMask('whatsapp', currentRegion)
const { mask: phoneMask } = useMask('phone', currentRegion)

// --- regra assíncrona para validar CNPJ na BrasilAPI ---
const cnpjBrasilApiRule = async (value) => {
  // Se não for BR, não valida na BrasilAPI
  if (currentRegion.value !== 'BR') return true

  const clean = (value || '').replace(/\D/g, '')

  if (!clean) {
    return 'Obrigatório'
  }

  if (clean.length !== 14) {
    return 'CNPJ inválido'
  }

  try {
    await fetchCnpj(clean)
    return true
  } catch (err) {
    if (err.code === 'CNPJ_NOT_FOUND') {
      return 'CNPJ não encontrado na base da Receita'
    }

    if (err.code === 'INVALID_CNPJ') {
      return 'CNPJ inválido'
    }

    // erro genérico da API
    $q.notify({
      type: 'negative',
      message: 'Erro ao validar CNPJ na BrasilAPI. Tente novamente.'
    })
    return 'Não foi possível validar o CNPJ'
  }
}

// carrega TODOS os países ao montar
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

function filterCountries (val, update) {
  update(() => {
    if (!val) {
      countryOptions.value = allCountries.value
      return
    }

    const needle = val.toLowerCase()
    countryOptions.value = allCountries.value.filter(
      c => c.name.toLowerCase().includes(needle)
    )
  })
}

async function onSubmit () {
  const ok = await formRef.value.validate()
  if (!ok) return

  loading.value = true
  try {
    const result = await ob.saveCompany()

    if (!result.ok) {
      // store já deu Notify, só não avança
      return
    }

    emit('next')
  } catch (e) {
    console.error(e)
    // fallback, só se algo estourar fora da action
    $q.notify({ type: 'negative', message: 'Erro ao continuar.' })
  } finally {
    loading.value = false
  }
}
</script>
