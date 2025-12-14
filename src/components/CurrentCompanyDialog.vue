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
  modelValue: {
    type: Boolean,
    default: false
  },
  company: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'save'])

const $q = useQuasar()
const loading = ref(false)
const formRef = ref(null)
const req = v => !!v || 'Obrigatório'

// --- estado local da empresa (edição do formulário) ---
const localCompany = reactive({
  id: null,
  country_id: null,
  company_name: '',
  company_fantasy_name: '',
  document_number: '',
  link_whatsapp: '',
  link_instagram: '',
  link_facebook: '',
  phone_fix: ''
})

// --- estado usado apenas para exibição no HEADER (último salvo) ---
const headerCompany = reactive({
  company_name: '',
  company_fantasy_name: '',
  document_number: ''
})

// título do header (fantasia > razão social > fallback)
const headerTitle = computed(() => {
  return (
    headerCompany.company_fantasy_name ||
    headerCompany.company_name ||
    'Empresa atual'
  )
})

// sincroniza quando a prop mudar (abrir modal / após salvar no pai)
watch(
  () => props.company,
  (val) => {
    if (!val) return
    // formulário edita uma cópia
    Object.assign(localCompany, val)
    // header mostra apenas o último estado salvo vindo da prop
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

// máscaras dinâmicas com base na região derivada do país
const { mask: docMask } = useMask('document', currentRegion)
const { mask: whatsMask } = useMask('whatsapp', currentRegion)
const { mask: phoneMask } = useMask('phone', currentRegion)

const cnpjLocalRule = (value) => {
  if (currentRegion.value !== 'BR') return true
  return cnpjRule(value)
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
    // envia os dados editados para o pai persistir
    emit('save', { ...localCompany })
    // quem atualiza o header é o pai, ao atualizar a prop `company`
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

/* header com padding alinhado e visual mais parecido com o do perfil */
.company-dialog-header {
  padding: 20px 28px 14px 28px;
}

/* body com respiro */
.company-dialog-body {
  padding: 18px 28px 24px 28px;
}

/* mais espaço entre campos */
.company-fields-grid .company-field {
  margin-bottom: 12px;
}

/* scroll interno se a tela for menor */
.company-dialog-card > .company-dialog-body {
  overflow-y: auto;
}
</style>
