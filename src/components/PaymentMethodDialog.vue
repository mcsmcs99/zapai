<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    persistent
  >
    <q-card class="dlg-card">
      <!-- Cabeçalho -->
      <q-card-section class="row items-center q-gutter-sm">
        <div class="text-subtitle1 text-weight-bold">Alterar Forma de Pagamento</div>
        <q-space />
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>
      <q-separator />

      <!-- Escolha -->
      <q-card-section class="q-pb-none">
        <div class="text-body1 text-weight-medium">Escolha a forma de pagamento:</div>
      </q-card-section>

      <q-card-section>
        <div class="column q-gutter-sm">
          <!-- Cartão -->
          <div
            class="method-box"
            :class="{ 'method-selected': method === 'card' }"
            @click="method = 'card'"
          >
            <div class="row items-center no-wrap">
              <q-icon name="credit_card" class="q-mr-sm" />
              <div>
                <div class="text-body1">Cartão de Crédito</div>
                <div class="text-caption text-grey-7">Pagamento automático mensal</div>
              </div>
              <q-space />
              <q-icon v-if="method==='card'" name="check" color="positive" />
            </div>
          </div>

          <!-- PIX -->
          <div
            class="method-box"
            :class="{ 'method-selected': method === 'pix' }"
            @click="method = 'pix'"
          >
            <div class="row items-center no-wrap">
              <q-icon name="qr_code" class="q-mr-sm" />
              <div>
                <div class="text-body1">PIX</div>
                <div class="text-caption text-grey-7">Pagamento manual mensal via PIX</div>
              </div>
              <q-space />
              <q-icon v-if="method==='pix'" name="check" color="positive" />
            </div>
          </div>

          <!-- Boleto -->
          <div
            class="method-box"
            :class="{ 'method-selected': method === 'boleto' }"
            @click="method = 'boleto'"
          >
            <div class="row items-center no-wrap">
              <q-icon name="assignment" class="q-mr-sm" />
              <div>
                <div class="text-body1">Boleto Bancário</div>
                <div class="text-caption text-grey-7">Boleto mensal enviado por email</div>
              </div>
              <q-space />
              <q-icon v-if="method==='boleto'" name="check" color="positive" />
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- Formulários -->
      <q-card-section class="q-pt-none">
        <!-- Cartão -->
        <div v-show="method==='card'" class="panel panel-card q-pa-md rounded-borders">
          <div class="text-body1 text-weight-medium q-mb-sm">Dados do Cartão de Crédito</div>

          <div class="row q-col-gutter-md">
            <q-input
              class="col-12"
              v-model="form.card.number"
              outlined dense
              label="Número do Cartão"
              placeholder="0000 0000 0000 0000"
              mask="#### #### #### #### ####"
              :rules="[req]"
            />
            <q-input
              class="col-12"
              v-model="form.card.name"
              outlined dense
              label="Nome no Cartão"
              placeholder="NOME COMPLETO"
              :rules="[req]"
            />
            <q-input
              class="col-6 col-sm-4"
              v-model="form.card.expiry"
              outlined dense
              label="Validade"
              placeholder="MM/AA"
              mask="##/##"
              :rules="[req]"
            />
            <q-input
              class="col-6 col-sm-3"
              v-model="form.card.cvv"
              outlined dense
              label="CVV"
              placeholder="000"
              mask="###"
              :rules="[req]"
            />
          </div>
        </div>

        <!-- PIX -->
        <div v-show="method==='pix'" class="panel panel-pix q-pa-md rounded-borders">
          <div class="text-body1 text-weight-medium q-mb-sm">Dados para PIX</div>

          <div class="row q-col-gutter-md">
            <q-input
              class="col-12 col-sm-6"
              v-model="form.pix.cpf"
              outlined dense
              label="CPF"
              placeholder="000.000.000-00"
              mask="###.###.###-##"
              :rules="[req]"
            />
            <q-input
              class="col-12 col-sm-6"
              v-model="form.pix.email"
              outlined dense
              type="email"
              label="Email para Cobrança"
              placeholder="seu@email.com"
              :rules="[req]"
            />
          </div>

          <q-banner class="q-mt-md bg-deep-purple-1 text-deep-purple-10 rounded-borders">
            <template #avatar><q-icon name="info" /></template>
            Todo mês você receberá um QR Code PIX por email para efetuar o pagamento.
          </q-banner>
        </div>

        <!-- Boleto -->
        <div v-show="method==='boleto'" class="panel panel-boleto q-pa-md rounded-borders">
          <div class="text-body1 text-weight-medium q-mb-sm">Dados para Boleto</div>

          <div class="row q-col-gutter-md">
            <q-input
              class="col-12 col-sm-6"
              v-model="form.boleto.cpf"
              outlined dense
              label="CPF"
              placeholder="000.000.000-00"
              mask="###.###.###-##"
              :rules="[req]"
            />
            <q-input
              class="col-12"
              v-model="form.boleto.address"
              outlined dense
              label="Endereço Completo"
              placeholder="Rua, número, bairro, cidade, estado, CEP"
              :rules="[req]"
            />
          </div>

          <q-banner class="q-mt-md bg-amber-1 text-amber-10 rounded-borders">
            <template #avatar><q-icon name="info" /></template>
            O boleto será enviado por email todo mês com 5 dias de antecedência do vencimento.
          </q-banner>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Ações -->
      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancelar" v-close-popup />
        <q-btn
          color="positive"
          label="Salvar Alteração"
          :disable="!canSave"
          @click="save"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue'
defineOptions({ name: 'PaymentMethodDialog' })

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  currentMethod: { type: String, default: 'card' } // 'card' | 'pix' | 'boleto'
})
const emit = defineEmits(['update:modelValue', 'save'])

const method = ref('card')
const form = reactive({
  card:   { number: '', name: '', expiry: '', cvv: '' },
  pix:    { cpf: '', email: '' },
  boleto: { cpf: '', address: '' }
})

watch(() => props.modelValue, (v) => {
  if (v) {
    // abre já com a forma atual selecionada
    method.value = props.currentMethod || 'card'
  }
})

const req = v => !!(v && String(v).trim()) || 'Obrigatório'

const canSave = computed(() => {
  if (method.value === 'card') {
    const c = form.card
    return c.number && c.name && c.expiry && c.cvv
  }
  if (method.value === 'pix') {
    const p = form.pix
    return p.cpf && p.email
  }
  if (method.value === 'boleto') {
    const b = form.boleto
    return b.cpf && b.address
  }
  return false
})

function save () {
  const payload = { method: method.value, data: JSON.parse(JSON.stringify(form[method.value])) }
  emit('save', payload)
  emit('update:modelValue', false)
}
</script>

<style scoped>
.dlg-card { min-width: 720px; max-width: 95vw; border-radius: 16px; }
@media (max-width: 780px){ .dlg-card { min-width: auto } }

.method-box {
  border: 1px solid #e7e7e7;
  border-radius: 10px;
  padding: 14px;
  background: #fff;
  cursor: pointer;
}
.method-selected {
  border-color: #B3E6C9;
  background: #F1FBF6;
  box-shadow: 0 0 0 1px rgba(34,197,94,.1) inset;
}

.panel { border: 1px solid #ECECEC; }
.panel-card   { background: #EEF5FF; border-color: #D8E8FF; }
.panel-pix    { background: #F7EDFF; border-color: #EAD8FF; }
.panel-boleto { background: #FFF6E7; border-color: #F6E2BB; }
</style>
