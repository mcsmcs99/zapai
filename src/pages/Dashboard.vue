<template>
  <q-page padding class="q-gutter-md">

    <!-- Título + ações -->
    <div class="row items-center">
      <div class="col">
        <div class="text-h3 text-weight-bold">Dashboard</div>
        <div class="text-subtitle2 text-grey-7">
          Monitore a performance dos seus assistentes virtuais
        </div>
      </div>
      <div class="row q-gutter-sm">
        <q-btn outline color="primary" label="Testar IA" @click="$router.push('/simulador')" />
        <q-btn color="primary" label="Novo Assistente" @click="$router.push('/assistentes/novo')" />
      </div>
    </div>

    <!-- KPIs -->
    <div class="row q-col-gutter-lg q-mt-md">
      <div class="col-12 col-md-3" v-for="card in kpis" :key="card.key">
        <q-card class="kpi-card">
          <q-card-section class="row items-center no-wrap">
            <div class="kpi-icon" :class="card.bg">
              <q-icon :name="card.icon" size="28px" />
            </div>
            <div class="q-ml-md">
              <div class="text-subtitle2 text-grey-7">{{ card.title }}</div>
              <div class="text-h5 text-weight-bold">{{ card.value }}</div>
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pt-sm">
            <q-badge v-if="card.badge" :label="card.badge" color="green-1" text-color="green-8" rounded/>
            <div v-else class="text-caption text-grey-7">
              <q-icon name="trending_up" class="q-mr-xs" /> {{ card.trend }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Conteúdo: Conversas + Status -->
    <div class="row q-col-gutter-lg">
      <!-- Conversas Recentes -->
      <div class="col-12 col-lg-8">
        <q-card class="panel-card">
          <q-card-section class="row items-center">
            <q-icon name="chat_bubble_outline" class="q-mr-sm" />
            <div class="text-h6 text-weight-bold">Conversas Recentes</div>
          </q-card-section>
          <q-separator />

          <q-list separator>
            <q-item v-for="c in conversations" :key="c.id" class="conv-item">
              <q-item-section avatar top>
                <q-avatar color="green-2" text-color="green-10">
                  <q-icon name="person" />
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-medium">{{ c.name }}</q-item-label>
                <q-item-label caption class="ellipsis-2-lines">{{ c.preview }}</q-item-label>

                <div class="row items-center text-caption text-grey-7 q-mt-xs q-gutter-md">
                  <div><q-icon name="schedule" class="q-mr-xs" /> {{ c.time }}</div>
                  <div><q-icon name="mail" class="q-mr-xs" /> {{ c.messages }} mensagens</div>
                  <div><q-icon name="star" class="q-mr-xs text-amber-7" /> {{ c.rating }}</div>
                </div>
              </q-item-section>

              <q-item-section side top>
                <q-badge :color="c.statusColor" :label="c.status" rounded />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <!-- Status dos assistentes -->
      <div class="col-12 col-lg-4">
        <q-card class="panel-card">
          <q-card-section class="row items-center">
            <q-icon name="smart_toy" class="q-mr-sm" />
            <div class="text-h6 text-weight-bold">Status dos Assistentes</div>
          </q-card-section>
          <q-separator />

          <q-list>
            <q-item v-for="a in assistants" :key="a.id">
              <q-item-section avatar>
                <q-btn round dense flat color="primary" icon="play_circle" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium ellipsis">{{ a.name }}</q-item-label>
                <q-item-label caption class="text-grey-7">{{ a.segment }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge color="green-2" text-color="green-10" label="Online" rounded />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'

defineOptions({ name: 'DashboardPage' })

const kpis = ref([
  { key: 'active', title: 'Assistentes Ativos', value: '1 / 1', icon: 'smart_toy', trend: '↑ 12% este mês', bg: 'bg-green' },
  { key: 'today',  title: 'Conversas Hoje',     value: '0',     icon: 'chat_bubble', trend: '↑ 23% vs ontem', bg: 'bg-blue' },
  { key: 'solve',  title: 'Taxa Resolução IA',  value: '100%',  icon: 'task_alt',    badge: 'Excelente!', bg: 'bg-purple' },
  { key: 'csat',   title: 'Satisfação Média',   value: '4.5',   icon: 'trending_up', badge: '⭐ 4,8/5,0', bg: 'bg-orange' }
])

const conversations = ref([
  {
    id: 1,
    name: 'Carlos Mendes',
    preview: 'Agendado! Carlos Mendes, corte + barba hoje às 15h. Até logo!',
    time: 'há 3 dias',
    messages: 4,
    rating: '4/5',
    status: 'Resolvido',
    statusColor: 'green-2'
  },
  {
    id: 2,
    name: 'João Silva',
    preview: 'Temos horários disponíveis às 15h30 e às 16h15. O corte social fica R$ 25. Qual ho…',
    time: 'há 3 dias',
    messages: 4,
    rating: '5/5',
    status: 'Ativo',
    statusColor: 'indigo-2'
  }
])

const assistants = ref([
  { id: 1, name: 'Assistente da …', segment: 'Barbearia' }
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
  color: #0b1b13; /* ícone escuro sobre fundo claro */
}
.bg-green  { background: radial-gradient(120px 60px at 80% 10%, rgba(35,181,115,.18), transparent 60%), #E8F7EF; }
.bg-blue   { background: radial-gradient(120px 60px at 70% 20%, rgba(69,92,233,.18),  transparent 60%), #EEF2FF; }
.bg-purple { background: radial-gradient(120px 60px at 70% 20%, rgba(144,97,249,.18), transparent 60%), #F4EDFF; }
.bg-orange { background: radial-gradient(120px 60px at 70% 20%, rgba(255,149,0,.18),  transparent 60%), #FFF4EA; }

.panel-card {
  border-radius: 14px;
  box-shadow: 0 6px 16px rgba(0,0,0,.05);
}
.conv-item { padding-top: 12px; padding-bottom: 12px; }
</style>
