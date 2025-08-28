<template>
  <q-page padding class="q-gutter-md">

    <!-- Título -->
    <div class="text-h3 text-weight-bold">Dashboard do Administrador</div>

    <!-- KPIs -->
    <div class="row q-col-gutter-lg q-mt-md">
      <div v-for="card in kpis" :key="card.key" class="col-12 col-sm-6 col-md-3">
        <q-card class="kpi-card">
          <q-card-section class="row items-center no-wrap">
            <div class="kpi-icon" :class="card.bg">
              <q-icon :name="card.icon" size="26px"/>
            </div>
            <div class="q-ml-md">
              <div class="text-subtitle2 text-grey-7">{{ card.title }}</div>
              <div class="text-h5 text-weight-bold">{{ card.value }}</div>
            </div>
          </q-card-section>
          <q-separator/>
          <q-card-section class="q-pt-sm">
            <q-badge v-if="card.badge" :label="card.badge.label" :color="card.badge.color" :text-color="card.badge.text" rounded/>
            <div v-else class="text-caption text-grey-7">{{ card.note }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Visão Geral -->
    <q-card class="panel-card q-mt-lg" flat bordered>
      <q-card-section class="text-h6 text-weight-bold">Visão Geral</q-card-section>
      <q-separator/>
      <q-card-section class="text-body2 text-grey-8">
        Aqui você pode adicionar gráficos e outras informações relevantes para a gestão do seu negócio.
      </q-card-section>
    </q-card>

  </q-page>
</template>

<script setup>
import { ref } from 'vue'

defineOptions({ name: 'AdminDashboardPage' })

// Mock inicial — troque pelos valores reais da sua API
const currency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const kpis = ref([
  {
    key: 'mrr',
    title: 'Receita Mensal (MRR)',
    value: currency(0),
    icon: 'payments',
    note: '↑ 5% último mês',
    bg: 'bg-green'
  },
  {
    key: 'companies',
    title: 'Total de Empresas',
    value: '2',
    icon: 'apartment',
    note: '2 novas este mês',
    bg: 'bg-blue'
  },
  {
    key: 'active',
    title: 'Empresas Ativas',
    value: '1',
    icon: 'show_chart',
    badge: { label: '1 em trial', color: 'purple-1', text: 'purple-9' },
    bg: 'bg-purple'
  },
  {
    key: 'arpu',
    title: 'Ticket Médio',
    value: currency(0),
    icon: 'north_east',
    badge: { label: 'Estável', color: 'orange-1', text: 'orange-9' },
    bg: 'bg-orange'
  }
])
</script>

<style scoped>
.kpi-card {
  border-radius: 14px;
  box-shadow: 0 6px 16px rgba(0,0,0,.06);
}
.kpi-icon {
  width: 56px; height: 56px; border-radius: 12px;
  display: grid; place-items: center;
  color: #0b1b13;
}
.bg-green  { background: radial-gradient(120px 60px at 80% 10%, rgba(35,181,115,.18), transparent 60%), #E8F7EF; }
.bg-blue   { background: radial-gradient(120px 60px at 70% 20%, rgba(69,92,233,.18),  transparent 60%), #EEF2FF; }
.bg-purple { background: radial-gradient(120px 60px at 70% 20%, rgba(144,97,249,.18), transparent 60%), #F4EDFF; }
.bg-orange { background: radial-gradient(120px 60px at 70% 20%, rgba(255,149,0,.18),  transparent 60%), #FFF4EA; }

.panel-card {
  border-radius: 14px;
  box-shadow: 0 6px 16px rgba(0,0,0,.05);
}
</style>
