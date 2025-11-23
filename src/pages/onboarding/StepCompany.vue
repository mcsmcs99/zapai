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
        :rules="[req]"
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
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useOnboardingStore } from 'src/stores/onboarding'
import { useMask } from 'src/composables/useMask'
import { useCountriesStore } from 'src/stores/countries'

const $q = useQuasar()
const ob = useOnboardingStore()
const emit = defineEmits(['next', 'back'])

const loading = ref(false)
const formRef = ref(null)
const req = v => !!v || 'Obrigatório'

// máscaras dinâmicas por região (Brasil, EUA, etc.)
const { mask: docMask } = useMask('document')
const { mask: whatsMask } = useMask('whatsapp')
const { mask: phoneMask } = useMask('phone')

// --- countries store ---
const countriesStore = useCountriesStore()

// lista completa e lista filtrada para o select
const allCountries = ref([])
const countryOptions = ref([])

// carrega TODOS os países ao montar
onMounted(async () => {
  if (!countriesStore.items.length) {
    await countriesStore.fetchCountries({
      status: 'active',
      order: 'name',
      dir: 'asc',
      pageSize: 9999 // garante que a API possa retornar todos
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
    emit('next')
  } catch (e) {
    console.error(e)
    $q.notify({ type: 'negative', message: 'Erro ao continuar.' })
  } finally {
    loading.value = false
  }
}
</script>
