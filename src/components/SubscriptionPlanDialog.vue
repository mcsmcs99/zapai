<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent>
    <q-card class="dlg-card">
      <q-card-section class="row items-center q-gutter-sm">
        <div class="text-subtitle1 text-weight-bold">
          {{ mode === 'create' ? 'Novo Plano de Assinatura' : 'Editar Plano de Assinatura' }}
        </div>
        <q-space/><q-btn flat round dense icon="close" v-close-popup/>
      </q-card-section>
      <q-separator/>

      <q-form class="q-pa-md" @submit.prevent="onSubmit">
        <div class="row q-col-gutter-md">
          <q-input class="col-12" v-model="local.name" outlined dense label="Nome do Plano *" :rules="[v=>!!v||'Informe o nome']" />
          <q-input class="col-12" v-model="local.description" type="textarea" autogrow outlined dense label="Descrição" />

          <q-input class="col-12 col-sm-6" v-model.number="local.price" type="number" min="0" step="0.01" outlined dense label="Preço (R$) *" :rules="[v=>v>=0||'Inválido']">
            <template #prepend><q-icon name="attach_money"/></template>
          </q-input>

          <q-select class="col-12 col-sm-6" v-model="local.cycle" :options="cycleOptions" outlined dense emit-value map-options label="Ciclo de Cobrança *"/>

          <div class="col-12">
            <div class="text-subtitle2 q-mb-xs">Serviços Inclusos</div>
            <q-option-group
              v-model="local.services"
              :options="serviceOptions"
              type="checkbox"
              color="deep-purple"
              class="q-pa-sm bg-grey-1 rounded-borders"
            />
          </div>

          <div class="col-12 row items-center">
            <q-toggle v-model="local.active" label="Plano Ativo" />
          </div>
        </div>

        <div class="row justify-end q-gutter-sm q-mt-lg">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="deep-purple-5" icon="save" :label="mode==='create' ? 'Salvar Plano' : 'Salvar Alterações'" type="submit" />
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { reactive, watch } from 'vue'
defineOptions({ name: 'SubscriptionPlanDialog' })

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: 'create' }, // 'create' | 'edit'
  value: {
    type: Object,
    default: () => ({
      id: null, name: '', description: '', price: 0, cycle: 'monthly', active: true, services: []
    })
  }
})
const emit = defineEmits(['update:modelValue','save'])

const local = reactive(JSON.parse(JSON.stringify(props.value)))
watch(() => props.value, v => Object.assign(local, JSON.parse(JSON.stringify(v))))

const cycleOptions = [
  { label:'Mensal', value:'monthly' },
  { label:'Trimestral', value:'quarterly' },
  { label:'Anual', value:'yearly' }
]

// catálogo simples (troque por seu banco de serviços)
const serviceOptions = [
  { label:'Pedicure (R$ 22,00)', value:'Pedicure (R$ 22,00)' },
  { label:'Limpeza de Pele (R$ 80,00)', value:'Limpeza de Pele (R$ 80,00)' },
  { label:'Massagem Relaxante (R$ 70,00)', value:'Massagem Relaxante (R$ 70,00)' },
  { label:'Corte + Barba (R$ 40,00)', value:'Corte + Barba (R$ 40,00)' },
  { label:'Peeling Facial (R$ 100,00)', value:'Peeling Facial (R$ 100,00)' },
  { label:'Barba Completa (R$ 20,00)', value:'Barba Completa (R$ 20,00)' },
  { label:'Corte Social Masculino (R$ 25,00)', value:'Corte Social Masculino (R$ 25,00)' },
]

function onSubmit () {
  emit('save', JSON.parse(JSON.stringify(local)))
  emit('update:modelValue', false)
}
</script>

<style scoped>
.dlg-card { min-width: 760px; max-width: 95vw; border-radius: 14px; }
@media (max-width: 780px){ .dlg-card{ min-width:auto } }
</style>
