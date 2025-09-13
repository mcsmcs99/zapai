<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent>
    <q-card class="dlg-card">
      <q-card-section class="row items-center q-gutter-sm">
        <div class="text-subtitle1 text-weight-bold">Adicionar Assinante</div>
        <q-space/><q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>
      <q-separator />

      <q-form class="q-pa-md" @submit.prevent="onSubmit">
        <div class="row q-col-gutter-md">
          <q-input class="col-12" v-model="local.name" outlined dense label="Nome do Cliente *" :rules="[v=>!!v||'Informe o nome']"/>
          <q-input class="col-12" v-model="local.phone" outlined dense mask="(##) #####-####" fill-mask label="Telefone do Cliente *" :rules="[v=>!!v||'Informe o telefone']"/>

          <q-select
            class="col-12"
            v-model="local.planId" :options="planOpts" emit-value map-options
            outlined dense label="Plano *" :rules="[v=>!!v||'Selecione um plano']"
          />

          <q-input class="col-12" outlined dense v-model="local.startAt" label="Data de Início da Assinatura *" :rules="[v=>!!v||'Informe a data']" readonly>
            <template #append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="local.startAt" mask="DD/MM/YYYY"/>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>

        <div class="row justify-end q-gutter-sm q-mt-lg">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="deep-purple-5" icon="save" label="Adicionar Assinante" type="submit" />
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { reactive, computed, watch } from 'vue'
defineOptions({ name: 'SubscriberDialog' })

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  plans: { type: Array, default: () => [] } // [{id, name, price, cycle...}]
})
const emit = defineEmits(['update:modelValue','save'])

const local = reactive({ name:'', phone:'', planId:null, startAt: today() })

const planOpts = computed(() => props.plans.map(p => ({ label: p.name, value: p.id })))

watch(() => props.modelValue, (v)=>{ if(v) Object.assign(local, { name:'', phone:'', planId: props.plans[0]?.id || null, startAt: today() }) })

function today () {
  const d = new Date()
  return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear()
}

function nextRenewal (startAt, cycle='monthly') {
  const [dd,mm,yy] = startAt.split('/').map(Number)
  const d = new Date(yy, mm-1, dd)
  if (cycle === 'yearly') d.setFullYear(d.getFullYear()+1)
  else if (cycle === 'quarterly') d.setMonth(d.getMonth()+3)
  else d.setMonth(d.getMonth()+1)
  return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear()
}

function onSubmit () {
  const plan = props.plans.find(p => p.id === local.planId)
  const payload = {
    name: local.name.trim(),
    phone: local.phone,
    planId: local.planId,
    startAt: local.startAt,
    nextRenewal: nextRenewal(local.startAt, plan?.cycle || 'monthly')
  }
  emit('save', payload)
  emit('update:modelValue', false)
}
</script>

<style scoped>
.dlg-card { min-width: 560px; max-width: 95vw; border-radius: 14px; }
@media (max-width: 620px){ .dlg-card{ min-width:auto } }
</style>
