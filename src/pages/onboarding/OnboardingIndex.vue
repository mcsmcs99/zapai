<template>
  <q-page class="q-pa-md">
    <q-card flat bordered class="q-pa-lg" style="max-width: 980px; margin: 0 auto">
      <div class="row items-center justify-between q-mb-md">
        <div class="text-h6">Configuração inicial</div>
        <div class="text-caption text-grey-7">Passo {{ step }} de 3</div>
      </div>

      <!-- Stepper só como feedback visual -->
      <q-stepper v-model="step" flat animated header-nav>
        <q-step :name="1" title="Empresa" icon="business" />
        <q-step :name="2" title="Plano" icon="workspace_premium" />
        <q-step :name="3" title="Checkout" icon="payments" />
      </q-stepper>

      <component
        :is="currentComp"
        class="q-mt-md"
        @next="goNext"
        @back="goBack"
        @finish="finishWizard"
      />
    </q-card>
  </q-page>
</template>

<script setup>

defineOptions({ name: 'OnboardingIndex' })

import { computed } from 'vue'
import { useRouter } from 'vue-router'
import StepCompany from './StepCompany.vue'
import StepPlan from './StepPlan.vue'
import StepCheckout from './StepCheckout.vue'
import { useOnboardingStore } from 'src/stores/onboarding'
import { useAuthStore } from 'src/stores/auth'

const router = useRouter()
const ob = useOnboardingStore()
const auth = useAuthStore()

const step = computed({
  get: () => ob.step,
  set: (v) => { ob.step = v }
})

const currentComp = computed(() => {
  switch (step.value) {
    case 1: return StepCompany
    case 2: return StepPlan
    case 3: return StepCheckout
    default: return StepCompany
  }
})

function goNext () {
  if (step.value < 3) step.value++
}

function goBack () {
  if (step.value > 1) step.value--
}

async function finishWizard () {
  // após o checkout/aprovação, atualizar o usuário e liberar o app
  await auth.refreshMe?.() // se tiver método para recarregar o user
  router.replace({ name: 'dashboard' })
}
</script>
