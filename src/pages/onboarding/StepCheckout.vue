<template>
  <div>
    <div class="text-subtitle1 q-mb-sm">Checkout</div>
    <div class="text-caption q-mb-md">
      Plano selecionado: <b>{{ ob.plan?.title || '-' }}</b>
    </div>

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

const $q = useQuasar()
const ob = useOnboardingStore()
const emit = defineEmits(['finish','back'])

const payment = ref({ type: 'pix' })
const payTypes = ['pix','credit_card','boleto']
const loading = ref(false)

async function onPay () {
  try {
    loading.value = true
    // Se quiser mandar o tipo de pagamento pro pai:
    ob.payment = payment.value
    emit('finish')     // o pai envia para o backend
  } catch (e) {
    console.log(e)
    $q.notify({ type: 'negative', message: 'Falha no pagamento.' })
  } finally {
    loading.value = false
  }
}
</script>
