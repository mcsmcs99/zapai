<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent>
    <q-card class="dlg-card q-pa-md">

      <!-- Cabeçalho -->
      <div class="row items-center q-gutter-sm q-mb-sm">
        <div class="text-h6 text-weight-bold">Comprar Tokens Extras</div>
        <q-space />
        <q-btn flat round dense icon="close" v-close-popup />
      </div>

      <div class="row items-center q-gutter-sm q-mb-md">
        <q-icon name="emoji_events" color="amber-8" />
        <div class="text-subtitle1 text-weight-bold">Comprar Tokens</div>
      </div>
      <div class="text-body2 text-grey-7 q-mb-md">
        Tokens extras para aumentar seu limite mensal de mensagens
      </div>

      <!-- Pacotes Populares -->
      <div class="text-body2 text-weight-medium q-mb-sm">Pacotes Populares:</div>
      <div class="row q-col-gutter-md q-mb-md">
        <div v-for="p in packs" :key="p.qty" class="col-12 col-sm-3">
          <q-card
            class="pkg-card cursor-pointer"
            :class="{ 'pkg-selected': qty === p.qty }"
            @click="selectPack(p)"
            flat bordered
          >
            <q-card-section class="column items-center">
              <div class="text-h5 text-weight-bold">{{ p.qty }}</div>
              <div class="text-caption text-grey-7">Pacote {{ p.name }}</div>
              <q-badge v-if="p.off" class="q-mt-xs" color="green-2" text-color="green-10" :label="p.off" rounded />
              <div class="text-weight-bold text-positive q-mt-sm">{{ money(p.price) }}</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Quantidade personalizada -->
      <div class="row items-center q-gutter-sm q-mb-sm">
        <div class="text-body2 text-weight-medium">Ou escolha uma quantidade personalizada:</div>
        <q-space />
        <q-badge color="grey-2" text-color="grey-9" rounded>Min: 50 tokens</q-badge>
      </div>

      <q-input
        v-model.number="qtyInput"
        outlined dense
        type="number" min="50" step="50"
        @update:model-value="onQtyTyping"
        @blur="applyQtyInput"
        class="q-mb-md"
      >
        <template #append><q-icon name="unfold_more" /></template>
      </q-input>

      <!-- Resumo -->
      <q-card flat class="summary-card q-pa-md q-mb-md">
        <div class="row items-center q-gutter-sm q-mb-sm">
          <q-icon name="receipt_long" />
          <div class="text-subtitle1 text-weight-bold">Resumo da Compra</div>
          <q-badge
            v-if="offerLabel"
            class="q-ml-sm"
            color="green-2"
            text-color="green-10"
            :label="offerLabel"
            rounded
          />
        </div>

        <div class="row q-col-gutter-md text-body2">
          <div class="col-12 col-sm-6 row items-center">
            <div class="text-grey-7">Quantidade de tokens:</div>
            <q-space /><div class="text-weight-medium">{{ qty }}</div>
          </div>

          <div class="col-12 col-sm-6 row items-center">
            <div class="text-grey-7">Preço por token:</div>
            <q-space /><div class="text-weight-medium">{{ money(pricePerToken) }}</div>
          </div>

          <div v-if="volumeSavings > 0" class="col-12 row items-center">
            <div class="text-grey-7">Economia por volume:</div>
            <q-space /><div class="text-weight-bold text-positive">-{{ money(volumeSavings) }}</div>
          </div>
        </div>

        <q-separator class="q-my-sm" />
        <div class="row items-center">
          <div class="text-h6 text-weight-bold">Subtotal:</div>
          <q-space /><div class="text-h6 text-weight-bold">{{ money(subtotal) }}</div>
        </div>
      </q-card>

      <!-- Forma de pagamento -->
      <div class="text-body2 text-weight-medium q-mb-sm">Forma de Pagamento:</div>

      <div class="pay-box q-mb-sm" :class="{ 'pay-selected': payMethod === 'pix' }" @click="payMethod = 'pix'">
        <div class="row items-center q-gutter-sm">
          <q-icon name="qr_code" />
          <div class="text-body1">PIX</div>
          <q-badge color="green-2" text-color="green-10" label="5% OFF" rounded class="q-ml-sm" />
        </div>
        <div class="text-caption text-grey-7">Aprovação instantânea</div>
        <q-icon v-if="payMethod==='pix'" name="check" class="pay-check" />
      </div>

      <div class="pay-box q-mb-sm" :class="{ 'pay-selected': payMethod === 'card' }" @click="payMethod = 'card'">
        <div class="row items-center q-gutter-sm">
          <q-icon name="credit_card" />
          <div class="text-body1">Cartão de Crédito</div>
        </div>
        <div class="text-caption text-grey-7">Parcelamento disponível</div>
        <q-icon v-if="payMethod==='card'" name="check" class="pay-check" />
      </div>

      <div class="pay-box q-mb-md" :class="{ 'pay-selected': payMethod === 'boleto' }" @click="payMethod = 'boleto'">
        <div class="row items-center q-gutter-sm">
          <q-icon name="assignment" />
          <div class="text-body1">Boleto Bancário</div>
        </div>
        <div class="text-caption text-grey-7">Vencimento em 3 dias</div>
        <q-icon v-if="payMethod==='boleto'" name="check" class="pay-check" />
      </div>

      <!-- Total -->
      <q-banner v-if="payDiscount > 0" class="bg-green-1 text-green-10 q-mb-md rounded-borders">
        Total a Pagar: Desconto de {{ Math.round(payDiscount * 100) }}% aplicado!
        <template #avatar><q-icon name="local_offer" /></template>
        <template #action><div class="text-h6 text-weight-bold">{{ money(total) }}</div></template>
      </q-banner>
      <q-banner v-else class="bg-grey-1 text-grey-9 q-mb-md rounded-borders">
        Total a Pagar
        <template #action><div class="text-h6 text-weight-bold">{{ money(total) }}</div></template>
      </q-banner>

      <!-- Ações -->
      <div class="row justify-end q-gutter-sm">
        <q-btn flat label="Cancelar" v-close-popup />
        <q-btn color="amber-8" text-color="black" icon="bolt" label="Prosseguir para Checkout" @click="checkout" />
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
defineOptions({ name: 'BuyTokensDialog' })

const props = defineProps({ modelValue: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue', 'checkout'])

/* ---------------- Preços/Tiers ---------------- */
const BASE_PRICE = 0.15 // preço “cheio”
function unitPriceByQty (q) {
  if (q >= 1000) return 0.08   // Premium
  if (q >= 500)  return 0.10   // Popular
  if (q >= 200)  return 0.12   // Econômico
  return 0.15                 // Básico
}

/* Pacotes fixos (como nos cards) */
const packs = [
  { qty: 100,  name: 'Básico',    price: 15.00, off: null      },
  { qty: 200,  name: 'Econômico', price: 24.00, off: '5% OFF'  },
  { qty: 500,  name: 'Popular',   price: 50.00, off: '20% OFF' },
  { qty: 1000, name: 'Premium',   price: 80.00, off: '35% OFF' }
]

/* ---------------- Estado ---------------- */
const qty = ref(100)
const qtyInput = ref(100)
const payMethod = ref('pix')

watch(() => props.modelValue, v => {
  if (v) {
    qty.value = 100
    qtyInput.value = 100
    payMethod.value = 'pix'
  }
})

/* ---------------- Interações da quantidade ---------------- */
function selectPack (p) {
  qty.value = p.qty
  qtyInput.value = p.qty
}

function onQtyTyping (val) {
  // Enquanto digita, já reflete visualmente
  const n = Number(val)
  if (Number.isFinite(n)) qty.value = n
}

function applyQtyInput () {
  let v = Number(qtyInput.value || 0)
  if (isNaN(v)) v = 50
  if (v < 50) v = 50
  v = Math.round(v / 50) * 50
  qty.value = v
  qtyInput.value = v
}

/* ---------------- Cálculos ---------------- */
const pricePerToken = computed(() => unitPriceByQty(Math.max(0, qty.value || 0)))
const subtotal = computed(() => round2(Math.max(0, qty.value || 0) * pricePerToken.value))
const volumeSavings = computed(() => {
  const full = Math.max(0, qty.value || 0) * BASE_PRICE
  return full > subtotal.value ? round2(full - subtotal.value) : 0
})

/* badge de oferta conforme as faixas dos cards */
const offerLabel = computed(() => {
  const q = Math.max(0, qty.value || 0)
  if (q >= 1000) return '35% OFF'
  if (q >= 500)  return '20% OFF'
  if (q >= 200)  return '5% OFF'
  return null
})

/* pagamento */
const payDiscount = computed(() => (payMethod.value === 'pix' ? 0.05 : 0))
const total = computed(() => round2(subtotal.value * (1 - payDiscount.value)))

function round2 (n) { return Math.round(n * 100) / 100 }
function money (v) { return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v) }

/* ---------------- Checkout ---------------- */
function checkout () {
  const payload = {
    qty: Math.max(0, qty.value || 0),
    unit: pricePerToken.value,
    subtotal: subtotal.value,
    method: payMethod.value,
    discount: payDiscount.value,
    total: total.value,
    offer: offerLabel.value
  }
  emit('checkout', payload)
  emit('update:modelValue', false)
}
</script>

<style scoped>
.dlg-card { min-width: 760px; max-width: 95vw; border-radius: 16px; }
@media (max-width: 800px){ .dlg-card { min-width: auto } }

.pkg-card { border-radius: 12px; transition: all .15s ease; }
.pkg-card:hover { box-shadow: 0 6px 14px rgba(0,0,0,.08); transform: translateY(-1px); }
.pkg-selected { border: 2px solid #7C3AED; background: rgba(124,58,237,.06); }

.summary-card {
  border-radius: 12px;
  border: 1px solid #F3E8C7;
  background: linear-gradient(180deg, #FFF7E6 0%, #FFFDF8 100%);
}

.pay-box {
  position: relative;
  border-radius: 10px;
  border: 1px solid #E7E7E7;
  padding: 12px 14px;
  background: #fff;
  cursor: pointer;
}
.pay-selected { border-color: #B3E6C9; background: #F1FBF6; }
.pay-check { position: absolute; right: 10px; top: 10px; color: #16a34a; }
</style>
