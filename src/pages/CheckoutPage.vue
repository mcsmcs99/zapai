<template>
  <div class="q-pa-md checkout">
    <div class="row items-start q-col-gutter-lg">
      <!-- Left: Stepper / Forms -->
      <div class="col-12 col-md-8">
        <q-card flat bordered>
          <q-card-section>
            <div class="row items-center">
              <q-btn flat dense icon="arrow_back" class="q-mr-sm" @click="goBack"/>
              <div class="text-h6">Checkout</div>
              <q-space />
              <div class="text-positive text-body2"><q-icon name="lock" class="q-mr-xs"/>Pagamento Seguro</div>
            </div>
          </q-card-section>

          <q-separator/>

          <q-card-section>
            <q-stepper v-model="step" color="primary" animated flat header-nav>
              <!-- Step 1: Dados de Cobrança -->
              <q-step :name="1" title="Dados de Cobrança" :done="step > 1" icon="looks_one">
                <q-form ref="billingForm" @submit.prevent="goToPayment">
                  <div class="row q-col-gutter-md">
                    <div class="col-12">
                      <div class="text-subtitle1 q-mb-sm"><q-icon name="public" class="q-mr-sm"/>Informações de Cobrança</div>
                    </div>

                    <div class="col-12 col-md-6">
                      <q-input v-model="billing.firstName" label="Nome *" dense :rules="[rules.required]"/>
                    </div>
                    <div class="col-12 col-md-6">
                      <q-input v-model="billing.lastName" label="Sobrenome *" dense :rules="[rules.required]"/>
                    </div>

                    <div class="col-12 col-md-6">
                      <q-input v-model="billing.email" type="email" label="Email *" dense :rules="[rules.required, rules.email]"/>
                    </div>
                    <div class="col-12 col-md-6">
                      <q-input v-model="billing.phone" label="Telefone" dense mask="(##) #####-####" unmasked-value/>
                    </div>

                    <div class="col-12">
                      <q-input v-model="billing.company" label="Empresa (Opcional)" dense/>
                    </div>

                    <div class="col-12 col-md-6">
                      <q-select v-model="billing.country" :options="countries" emit-value map-options dense label="País *" :rules="[rules.required]"/>
                    </div>

                    <div class="col-12">
                      <q-input v-model="billing.address" label="Endereço *" dense :rules="[rules.required]"/>
                    </div>

                    <div class="col-12 col-md-4">
                      <q-input v-model="billing.city" label="Cidade *" dense :rules="[rules.required]"/>
                    </div>
                    <div class="col-12 col-md-4">
                      <q-input v-model="billing.state" label="Estado/Região" dense/>
                    </div>
                    <div class="col-12 col-md-4">
                      <q-input v-model="billing.zip" label="CEP/Zip *" dense :rules="[rules.required]" mask="#####-###" fill-mask unmasked-value/>
                    </div>

                    <div class="col-12">
                      <q-btn color="primary" type="submit" label="Continuar para Pagamento" :loading="loading.billing" class="full-width"/>
                    </div>
                  </div>
                </q-form>
              </q-step>

              <!-- Step 2: Pagamento -->
              <q-step :name="2" title="Pagamento" :done="step > 2" icon="looks_two">
                <div class="text-subtitle1 q-mb-md"><q-icon name="credit_card" class="q-mr-sm"/>Método de Pagamento</div>

                <q-card flat bordered class="q-mb-md">
                  <q-item clickable @click="payment.method = 'card'" :class="cardHeaderClass('card')">
                    <q-item-section avatar>
                      <q-icon name="credit_card"/>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-weight-medium">Cartão de Crédito</q-item-label>
                      <q-item-label caption>Visa, Mastercard, American Express</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-card>

                <q-card flat bordered class="q-mb-lg">
                  <q-item clickable @click="payment.method = 'pix'" :class="cardHeaderClass('pix')">
                    <q-item-section avatar>
                      <q-icon name="qr_code_2"/>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-weight-medium">PIX</q-item-label>
                      <q-item-label caption>Pagamento instantâneo - Apenas Brasil</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-card>

                <!-- Dynamic form -->
                <q-form ref="paymentForm" @submit.prevent="goToReview">
                  <div v-if="payment.method === 'card'" class="row q-col-gutter-md">
                    <div class="col-12">
                      <q-input v-model="payment.card.number" label="Número do Cartão *" dense :rules="[rules.required, rules.cardNumber]" mask="#### #### #### ####"/>
                    </div>
                    <div class="col-12">
                      <q-input v-model="payment.card.name" label="Nome no Cartão *" dense :rules="[rules.required]"/>
                    </div>
                    <div class="col-6">
                      <q-input v-model="payment.card.exp" label="Data de Validade *" dense mask="##/##" :rules="[rules.required, rules.cardExp]"/>
                    </div>
                    <div class="col-6">
                      <q-input v-model.number="payment.card.cvv" label="CVV *" type="password" dense :rules="[rules.required, rules.cvv]" mask="###"/>
                    </div>
                    <div class="col-12 flex items-center q-gutter-sm">
                      <q-btn flat label="Voltar" @click="step = 1"/>
                      <q-space/>
                      <q-btn color="primary" type="submit" label="Revisar Pedido" :loading="loading.payment"/>
                    </div>
                  </div>

                  <div v-else class="row q-col-gutter-md">
                    <q-banner class="bg-grey-2 text-grey-9 q-mb-md" rounded>
                      Você receberá um código PIX para pagamento após confirmar o pedido.
                    </q-banner>
                    <div class="col-12 col-md-6">
                      <q-input v-model="payment.pix.cpf" label="CPF" dense mask="###.###.###-##" fill-mask unmasked-value :rules="[rules.cpf]"/>
                    </div>
                    <div class="col-12 col-md-6">
                      <q-input v-model="payment.pix.email" type="email" label="Email para receber o QR Code" dense :rules="[rules.emailOptional]"/>
                    </div>
                    <div class="col-12 flex items-center q-gutter-sm">
                      <q-btn flat label="Voltar" @click="step = 1"/>
                      <q-space/>
                      <q-btn color="primary" type="submit" label="Revisar Pedido" :loading="loading.payment"/>
                    </div>
                  </div>
                </q-form>
              </q-step>

              <!-- Step 3: Confirmar -->
              <q-step :name="3" title="Confirmar" icon="looks_3">
                <div class="text-subtitle1 q-mb-md">Confirmar Pedido</div>

                <q-card flat bordered class="q-mb-lg">
                  <q-card-section>
                    <div class="text-body1 text-weight-medium q-mb-sm">Dados de Cobrança</div>
                    <div class="text-body2 text-grey-8">
                      <div>{{ billing.firstName }} {{ billing.lastName }}</div>
                      <div>{{ billing.email }}</div>
                      <div>{{ billing.address }}</div>
                      <div>{{ billing.city }}, {{ billing.state }} {{ formattedZip }} </div>
                      <div>{{ countryLabel }}</div>
                    </div>
                  </q-card-section>
                </q-card>

                <q-card flat bordered class="q-mb-lg">
                  <q-card-section>
                    <div class="text-body1 text-weight-medium q-mb-sm">Método de Pagamento</div>
                    <div class="text-body2 text-grey-8">
                      <span v-if="payment.method==='pix'">PIX</span>
                      <span v-else>Cartão •••• {{ payment.card.number.slice(-4) }}</span>
                    </div>
                  </q-card-section>
                </q-card>

                <div class="row">
                  <div class="col-12 flex items-center q-gutter-sm">
                    <q-btn flat label="Voltar" @click="step = 2"/>
                    <q-space/>
                    <q-btn color="positive" :label="`Finalizar Compra - ${formatCurrency(orderTotal)}`" :loading="loading.place" @click="placeOrder"/>
                  </div>
                </div>
              </q-step>
            </q-stepper>
          </q-card-section>
        </q-card>
      </div>

      <!-- Right: Order Summary -->
      <div class="col-12 col-md-4">
        <q-card flat bordered class="q-mb-md">
          <q-card-section class="text-subtitle1">Resumo do Pedido</q-card-section>
          <q-separator/>
          <q-card-section class="q-gutter-xs">
            <div class="row items-center">
              <div class="col">{{ tokens }} Tokens</div>
              <div class="col-auto text-weight-medium">{{ formatCurrency(orderTotal) }}</div>
            </div>
            <div class="text-caption text-grey-7">Preço por token
              <span class="float-right">{{ formatCurrency(pricePerToken) }}</span>
            </div>
            <q-separator spaced/>
            <div class="row items-center text-body1">
              <div class="col text-weight-medium">Total</div>
              <div class="col-auto text-positive text-weight-bold">{{ formatCurrency(orderTotal) }}</div>
            </div>
            <q-banner rounded class="bg-grey-2 q-mt-md"><q-icon name="lock" class="q-mr-sm"/>Pagamento 100% Seguro</q-banner>
          </q-card-section>
        </q-card>

        <q-card flat bordered>
          <q-card-section class="text-subtitle1">Suporte 24/7</q-card-section>
          <q-separator/>
          <q-card-section>
            <div class="text-body2 text-grey-8 q-mb-md">Precisa de ajuda? Entre em contato conosco a qualquer hora.</div>
            <q-btn outline color="primary" label="Contatar Suporte" class="full-width" @click="contactSupport"/>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Success Dialog -->
    <q-dialog v-model="success">
      <q-card style="max-width: 520px">
        <q-card-section class="row items-center q-gutter-sm">
          <q-icon name="check_circle" color="positive" size="md"/>
          <div class="text-h6">Pedido Confirmado</div>
        </q-card-section>
        <q-card-section>
          <div class="text-body1">Recebemos seu pedido de {{ tokens }} tokens no valor de {{ formatCurrency(orderTotal) }}.</div>
          <div v-if="payment.method==='pix'" class="text-body2 text-grey-7 q-mt-sm">
            Enviamos o QR Code PIX para <b>{{ payment.pix.email || billing.email }}</b>.
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Fechar" v-close-popup/>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'

// Props (adjust as needed)
const tokens = 100
const pricePerToken = 0.15

// Stepper
const step = ref(1)
const $q = useQuasar()

// Forms refs
const billingForm = ref(null)
const paymentForm = ref(null)

// Loading flags
const loading = ref({ billing: false, payment: false, place: false })
const success = ref(false)

// Billing state
const billing = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  company: '',
  country: 'BR',
  address: '',
  city: '',
  state: '',
  zip: ''
})

const countries = [
  { label: 'Brasil', value: 'BR' },
  { label: 'Estados Unidos', value: 'US' },
  { label: 'Portugal', value: 'PT' }
]

// Payment state
const payment = ref({
  method: 'card',
  card: { number: '', name: '', exp: '', cvv: '' },
  pix: { cpf: '', email: '' }
})

// Helpers / Rules
const rules = {
  required: v => !!(v || v === 0) || 'Obrigatório',
  email: v => /.+@.+\..+/.test(v) || 'Email inválido',
  emailOptional: v => !v || /.+@.+\..+/.test(v) || 'Email inválido',
  cardNumber: v => /^\d{4} \d{4} \d{4} \d{4}$/.test(v) || 'Número inválido',
  cardExp: v => /^\d{2}\/\d{2}$/.test(v) || 'MM/YY',
  cvv: v => /^\d{3}$/.test(String(v)) || 'CVV inválido',
  cpf: v => !v || /^\d{11}$/.test(v) || 'CPF inválido'
}

const orderTotal = computed(() => Number((tokens * pricePerToken).toFixed(2)))
const countryLabel = computed(() => countries.find(c => c.value === billing.value.country)?.label || '')
const formattedZip = computed(() => billing.value.zip && billing.value.zip.length === 8
  ? billing.value.zip.replace(/(\d{5})(\d{3})/, '$1-$2')
  : billing.value.zip
)

function formatCurrency (v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function cardHeaderClass (key) {
  return payment.value.method === key ? 'bg-blue-1' : ''
}

function goBack () {
  if (step.value === 1) return $q.notify({ type: 'info', message: 'Você já está no início.' })
  step.value--
}

async function goToPayment () {
  const ok = await billingForm.value.validate()
  if (!ok) return
  loading.value.billing = true
  setTimeout(() => { loading.value.billing = false; step.value = 2 }, 600)
}

async function goToReview () {
  const ok = await paymentForm.value.validate()
  if (!ok) return
  loading.value.payment = true
  setTimeout(() => { loading.value.payment = false; step.value = 3 }, 600)
}

function contactSupport () {
  $q.notify({ type: 'info', message: 'Abrindo suporte…' })
}

function placeOrder () {
  loading.value.place = true
  setTimeout(() => {
    loading.value.place = false
    success.value = true
    // here you could emit an event or call your API
  }, 900)
}
</script>

<style scoped>
.checkout .q-stepper__tab--active .q-stepper__title,
.checkout .q-stepper__tab--done .q-stepper__title { font-weight: 600; }
</style>
