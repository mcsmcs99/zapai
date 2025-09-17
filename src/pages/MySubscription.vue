<template>
  <q-page padding class="q-gutter-md">
    <!-- Título + ações -->
    <div class="row items-center justify-between">
      <div>
        <div class="text-h4 text-weight-bold">Minha Assinatura</div>
        <div class="text-subtitle2 text-grey-7">
          Gerencie seu plano e histórico de pagamentos da plataforma
        </div>
      </div>

      <div class="row q-gutter-sm">
        <q-btn
          class="btn-gold"
          rounded unelevated icon="token" label="Comprar Tokens"
          @click="dlg.buyTokens = true"
        />
        <q-btn
          outline rounded icon="swap_horiz" label="Mudar de Plano"
          @click="dlg.changePlan = true"
        />
        <q-btn
          rounded color="dark" unelevated icon="edit" label="Alterar Pagamento"
          @click="dlg.pay = true"
        />
      </div>
    </div>

    <!-- Assinatura Atual -->
    <q-card flat bordered class="rounded-borders q-mt-md">
      <q-card-section class="row items-center q-gutter-sm">
        <q-icon name="featured_play_list" color="deep-purple-5" />
        <div class="text-h6 text-weight-bold">Assinatura Atual</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div v-if="!currentSub" class="text-grey-7 text-center q-pa-lg">
          Informações da assinatura não disponíveis
        </div>

        <div v-else class="row q-col-gutter-md">
          <div class="col-12 col-sm-4">
            <div class="text-caption text-grey-7">Plano</div>
            <div class="text-subtitle1 text-weight-bold">{{ currentSub.plan }}</div>
          </div>
          <div class="col-6 col-sm-2">
            <div class="text-caption text-grey-7">Valor</div>
            <div class="text-subtitle1 text-weight-bold">{{ money(currentSub.amount) }}</div>
          </div>
          <div class="col-6 col-sm-2">
            <div class="text-caption text-grey-7">Ciclo</div>
            <div class="text-subtitle1 text-weight-bold">{{ currentSub.cycle }}</div>
          </div>
          <div class="col-6 col-sm-2">
            <div class="text-caption text-grey-7">Próx. Vencimento</div>
            <div class="text-subtitle1 text-weight-bold">{{ currentSub.nextDue }}</div>
          </div>
          <div class="col-6 col-sm-2">
            <div class="text-caption text-grey-7">Status</div>
            <q-badge rounded :color="statusMap[currentSub.status].bg" :text-color="statusMap[currentSub.status].text" :label="currentSub.status"/>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Histórico de Pagamentos -->
    <q-card flat bordered class="rounded-borders q-mt-lg">
      <q-card-section class="row items-center q-gutter-sm">
        <q-icon name="receipt_long" color="deep-purple-5" />
        <div class="text-h6 text-weight-bold">Histórico de Pagamentos</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-table
          :rows="rows"
          :columns="columns"
          row-key="id"
          flat
          separator="horizontal"
          :rows-per-page-options="[10,25,50]"
        >
          <template #body-cell-amount="props">
            <q-td :props="props" class="text-weight-medium">{{ money(props.row.amount) }}</q-td>
          </template>

          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge rounded :label="props.row.status"
                       :color="statusMap[props.row.status].bg"
                       :text-color="statusMap[props.row.status].text" />
            </q-td>
          </template>

          <template #no-data>
            <div class="full-width row items-center justify-center q-pa-lg text-grey-7">
              Nenhum pagamento encontrado.
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Dialogs -->
    <BuyTokensDialog
      v-model="dlg.buyTokens"
      @checkout="handleCheckout"
    />
    <ChangePlanDialog
      v-model="dlg.changePlan"
      :current-plan-id="currentSub?.planId || 'basic'"
      :plans="plansCatalog"
      @confirm="handlePlanChange"
    />
    <PaymentMethodDialog
      v-model="dlg.pay"
      :current-method="subscription.paymentMethod"
      @save="handlePaymentSave"
    />
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import BuyTokensDialog from 'components/BuyTokensDialog.vue'
import ChangePlanDialog from 'components/ChangePlanDialog.vue'
import PaymentMethodDialog from 'components/PaymentMethodDialog.vue'

defineOptions({ name: 'MySubscriptionPage' })

/* mocks */

const rows = ref([
  { id: 'h1', plan: 'Plano Básico', reference: 'julho 2025', amount: 49.90, status: 'Pendente', due: '27/09/2025', paidAt: '-' }
])

const columns = [
  { name:'plan',      label:'Plano',            field:'plan',      align:'left',  sortable:true },
  { name:'reference', label:'Mês de Referência',field:'reference', align:'left',  sortable:true },
  { name:'amount',    label:'Valor',            field:'amount',    align:'left',  sortable:true },
  { name:'status',    label:'Status',           field:'status',    align:'left',  sortable:true },
  { name:'due',       label:'Vencimento',       field:'due',       align:'left',  sortable:true },
  { name:'paidAt',    label:'Data do Pagamento',field:'paidAt',    align:'left',  sortable:true }
]

const statusMap = {
  Pago:     { bg: 'green-2',  text: 'green-10' },
  Pendente: { bg: 'yellow-2', text: 'yellow-10' },
  Cancelado:{ bg: 'grey-3',   text: 'grey-9' }
}

const plansCatalog = [
  {
    id: 'basic',
    name: 'Plano Básico',
    price: 49.90,
    limits: { assistants: 1, messages: 500 },
    features: ['1 Assistente IA', '500 Mensagens/mês', 'Dashboard Básico']
  },
  {
    id: 'pro',
    name: 'Plano Profissional',
    price: 99.90,
    limits: { assistants: 5, messages: 2500 },
    features: ['5 Assistentes IA', '2.500 Mensagens/mês', 'Dashboard Avançado', 'Relatórios', 'Suporte Prioritário']
  }
]

// exemplo de assinatura atual
const currentSub = ref({
  planId: 'basic',
  plan: 'Plano Básico',
  amount: 49.90,
  cycle: 'Mensal',
  nextDue: '27/09/2025',
  status: 'Pendente'
})

const dlg = ref({ buyTokens: false, changePlan: false, pay: false })
const money = (v) => new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(v)

const subscription = ref({ paymentMethod: 'card' })

function handleCheckout (payload) {
  // payload: { qty, unit, subtotal, method, discount, total }
  // aqui você chama seu checkout/PIX/Cartão…
  console.log('checkout:', payload)
}

function handlePlanChange ({ id, plan }) {
  // aqui você faz a chamada de API para solicitar a troca
  // e pode refletir na UI local (ex.: banner de “mudança programada”)
  console.log('Trocar para:', id, plan)
}

function handlePaymentSave ({ method, data }) {
  // chame sua API para atualizar
  console.log('Método escolhido:', method, data)
  subscription.value.paymentMethod = method
}
</script>

<style scoped>
.btn-gold {
  background: linear-gradient(90deg, #E2AE0A, #D49A06);
  color: #0b1b13;
}
.rounded-borders { border-radius: 14px; }
</style>
