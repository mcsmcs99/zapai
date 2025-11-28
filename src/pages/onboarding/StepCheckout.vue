<template>
  <div>
    <div class="text-subtitle1 q-mb-sm">Checkout</div>
    <div class="text-caption q-mb-md">
      Plano selecionado: <b>{{ ob.plan?.name }}</b>
    </div>

    <q-form @submit.prevent="onPay">
      <q-select
        v-model="payment.type"
        :options="allowedPayTypes"
        label="Tipo de pagamento"
        outlined
        dense
        class="q-mb-md"
      />
      <q-btn
        unelevated
        color="primary"
        :loading="loading"
        type="submit"
        label="Completar pagamento"
      />
    </q-form>

    <div class="row justify-start q-mt-lg">
      <q-btn flat color="grey-7" label="Voltar" @click="emit('back')" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useOnboardingStore } from 'src/stores/onboarding'

const $q = useQuasar()
const ob = useOnboardingStore()
const emit = defineEmits(['finish', 'back'])

const payment = ref({ type: 'pix' })
const loading = ref(false)

// tipos suportados globalmente
const basePayTypes = ['credit_card', 'pix', 'billet']

// opções filtradas de acordo com o plano (plans_payment_methods)
const allowedPayTypes = computed(() => {
  const cfg = ob.plan?.plans_payment_methods
  console.log(ob.plan)
  // se não veio config no plano, libera todos
  if (!cfg) {
    return basePayTypes
  }

  let obj = cfg

  // pode vir como string JSON do backend
  if (typeof cfg === 'string') {
    try {
      obj = JSON.parse(cfg)
    } catch (e) {
      console.error('Erro ao parsear plans_payment_methods', e)
      return basePayTypes
    }
  }

  if (typeof obj !== 'object' || obj === null) {
    return basePayTypes
  }

  // mantém só os tipos que estão marcados como true no JSON
  const filtered = basePayTypes.filter(key => obj[key])

  // se por algum motivo não sobrar nada, volta pro default (todos)
  return filtered.length ? filtered : basePayTypes
})

// garante que o v-model tenha sempre um valor permitido
watch(
  allowedPayTypes,
  (types) => {
    if (!types?.length) return

    if (!types.includes(payment.value.type)) {
      payment.value.type = types[0]
    }
  },
  { immediate: true }
)

async function onPay () {
  try {
    loading.value = true
    ob.payment = payment.value
    emit('finish') // o pai chama finalizeCheckout()
  } catch (e) {
    console.log(e)
    $q.notify({ type: 'negative', message: 'Falha no pagamento.' })
  } finally {
    loading.value = false
  }
}
</script>
