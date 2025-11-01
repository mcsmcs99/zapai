<template>
  <q-form @submit.prevent="onSubmit" ref="formRef" class="q-gutter-md">
    <div class="row q-col-gutter-md">
      <q-input class="col-12 col-md-6" v-model="ob.company.unique_key" label="Identificador (slug)" :rules="[req]" outlined dense />
      <q-select class="col-12 col-md-6" v-model="ob.company.document_type" :options="docTypes" label="Tipo de documento" :rules="[req]" outlined dense />
      <q-input class="col-12 col-md-6" v-model="ob.company.document_number" label="Número do documento" :rules="[req]" outlined dense />
      <q-input class="col-12 col-md-6" v-model="ob.company.company_name" label="Razão social" :rules="[req]" outlined dense />
      <q-input class="col-12 col-md-6" v-model="ob.company.company_fantasy_name" label="Nome fantasia" outlined dense />
      <q-input class="col-12 col-md-6" v-model="ob.company.phone_fix" label="Telefone fixo" outlined dense />
      <q-input class="col-12 col-md-6" v-model="ob.company.phone_cellular" label="Celular" outlined dense />
      <q-input class="col-12 col-md-6" v-model="ob.company.link_instagram" label="Instagram" outlined dense />
      <q-input class="col-12 col-md-6" v-model="ob.company.link_facebook" label="Facebook" outlined dense />
      <q-input class="col-12 col-md-6" v-model="ob.company.link_whatsapp" label="WhatsApp" outlined dense />
    </div>

    <div class="row justify-between q-mt-md">
      <q-space />
      <q-btn unelevated color="primary" :loading="loading" type="submit" label="Avançar" />
    </div>
  </q-form>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useOnboardingStore } from 'src/stores/onboarding'
// import api from 'src/services/api' // quando ligar com backend

const $q = useQuasar()
const ob = useOnboardingStore()

const loading = ref(false)
const formRef = ref(null)
const docTypes = ['cpf', 'cnpj']
const req = v => !!v || 'Obrigatório'

async function onSubmit () {
  const ok = await formRef.value.validate()
  if (!ok) return
  try {
    loading.value = true
    // chame sua API se quiser pré-criar a empresa aqui
    // await api.post('/groups/draft', ob.company)
    // ob.company.id = response.data.id
    emit('next')
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.response?.data?.message || 'Erro ao salvar.' })
  } finally {
    loading.value = false
  }
}
const emit = defineEmits(['next', 'back'])
</script>
