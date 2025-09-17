<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    persistent
  >
    <q-card class="dlg-card">

      <q-card-section class="row items-center q-gutter-sm">
        <div class="text-subtitle1 text-weight-bold">Mudar de Plano</div>
        <q-space />
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>
      <q-separator />

      <q-card-section class="q-pt-md q-pb-none">
        <div class="text-body1 text-weight-medium">Escolha seu novo plano:</div>
        <div class="text-caption text-grey-7 q-mt-xs">
          A mudança será aplicada no próximo ciclo de cobrança.
        </div>
      </q-card-section>

      <q-card-section class="q-pt-md">
        <div class="row q-col-gutter-xl">

          <div
            v-for="p in plansToShow"
            :key="p.id"
            class="col-12 col-md-6"
          >
            <q-card
              flat bordered
              class="plan-card cursor-pointer"
              :class="{'plan-selected': selectedId === p.id}"
              @click="selectedId = p.id"
            >
              <!-- tag de plano atual -->
              <q-badge
                v-if="isCurrent(p.id)"
                class="badge-current"
                color="grey-2"
                text-color="grey-9"
                rounded
              >
                Atual
                <q-tooltip>Seu plano atual</q-tooltip>
              </q-badge>

              <q-card-section class="q-pb-none">
                <div class="text-h6 text-weight-bold">{{ p.name }}</div>
                <div class="row items-baseline q-gutter-xs q-mt-sm">
                  <div class="text-h4 text-weight-bold text-positive">
                    {{ money(p.price) }}
                  </div>
                  <div class="text-caption text-grey-7">/mês</div>
                </div>
              </q-card-section>

              <q-card-section class="q-gutter-sm">
                <div class="quota-box row items-center q-pa-sm">
                  <q-icon name="shopping_bag" class="q-mr-sm" />
                  <div class="text-body2">Assistentes</div>
                  <q-space />
                  <div class="text-weight-bold">{{ p.limits.assistants }}</div>
                </div>

                <div class="quota-box row items-center q-pa-sm">
                  <q-icon name="chat_bubble_outline" class="q-mr-sm" />
                  <div class="text-body2">Mensagens/mês</div>
                  <q-space />
                  <div class="text-weight-bold">
                    {{ p.limits.messages.toLocaleString('pt-BR') }}
                  </div>
                </div>

                <q-separator class="q-my-sm" />

                <div class="text-body2 text-weight-medium q-mb-sm">Incluso:</div>
                <div class="q-mb-xs" v-for="(f,i) in p.features.slice(0,3)" :key="i">
                  <q-icon name="check" color="positive" size="16px" class="q-mr-xs" />
                  <span class="text-body2">{{ f }}</span>
                </div>
                <div v-if="p.features.length > 3" class="text-caption text-grey-7">
                  +{{ p.features.length - 3 }} recursos adicionais
                </div>
              </q-card-section>
            </q-card>
          </div>

        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-banner class="bg-amber-1 text-amber-10 rounded-borders">
          <template #avatar><q-icon name="info" /></template>
          <div class="q-gutter-xs">
            <div>• A alteração será efetivada no próximo ciclo de cobrança</div>
            <div>• Você continuará com o plano atual até o vencimento</div>
            <div>• O valor será ajustado automaticamente</div>
          </div>
        </q-banner>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancelar" v-close-popup />
        <q-btn
          color="positive"
          label="Confirmar Mudança"
          :disable="!selectedId || selectedId === currentPlanId"
          @click="confirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
defineOptions({ name: 'ChangePlanDialog' })

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  currentPlanId: { type: [String, Number], default: null }, // <— usado para marcar “Atual”
  plans: {
    type: Array,
    default: () => ([
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
    ])
  }
})
const emit = defineEmits(['update:modelValue', 'confirm'])

const selectedId = ref(null)
watch(() => props.modelValue, v => { if (v) selectedId.value = null })

const plansToShow = computed(() =>
  props.plans.map(p => ({ ...p, features: Array.isArray(p.features) ? p.features : [] }))
)

const isCurrent = (id) => id === props.currentPlanId

function money (v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}
function confirm () {
  const plan = plansToShow.value.find(p => p.id === selectedId.value)
  if (!plan) return
  emit('confirm', { id: plan.id, plan })
  emit('update:modelValue', false)
}
</script>

<style scoped>
.dlg-card { min-width: 960px; max-width: 96vw; border-radius: 16px; }
@media (max-width: 1000px){ .dlg-card { min-width: auto } }

.plan-card { position: relative; border-radius: 14px; transition: all .15s ease; }
.plan-card:hover { box-shadow: 0 8px 18px rgba(0,0,0,.06); transform: translateY(-1px); }
.plan-selected { border: 2px solid #22c55e; box-shadow: 0 0 0 2px rgba(34,197,94,.15) inset; }

.badge-current {
  position: absolute;
  top: 10px;
  right: 10px;
}

.quota-box {
  border: 1px solid rgba(0,0,0,.06);
  border-radius: 10px;
  background: #fff;
}
</style>
