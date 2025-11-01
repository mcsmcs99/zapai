<template>
  <div>
    <div class="text-subtitle1 q-mb-sm">Checkout</div>
    <div class="text-caption q-mb-md">
      Plano selecionado: <b>{{ ob.plan?.name || '-' }}</b>
    </div>

    <!-- seu formulário/integração de pagamento aqui -->
    <q-form @submit.prevent="onPay">
      <q-select v-model="payment.type" :options="payTypes" label="Tipo de pagamento" outlined dense class="q-mb-md" />
      <q-btn unelevated color="primary" :loading="loading" type="submit" label="Completar pagamento" />
    </q-form>

    <div class="row justify-start q-mt-lg">
      <q-btn flat color="grey-7" label="Voltar" @click="emit('back')" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useOnboardingStore } from 'src/stores/onboarding'
// import api from 'src/services/api'

const $q = useQuasar()
const ob = useOnboardingStore()
const emit = defineEmits(['finish','back'])

const payment = ref({ type: 'pix' })
const payTypes = ['pix','credit_card','boleto']
const loading = ref(false)

async function onPay () {
  try {
    loading.value = true
    // Exemplo de payload consolidado:
    const payload = {
      company: ob.company,
      plan: ob.plan,
      payment: payment.value
    }
    // await api.post('/onboarding/checkout', payload)
    console.log(payload)
    $q.notify({ type: 'positive', message: 'Pagamento aprovado!' })
    emit('finish')
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.response?.data?.message || 'Falha no pagamento.' })
  } finally {
    loading.value = false
  }
}
</script>
