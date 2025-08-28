<template>
  <q-page padding class="q-gutter-md">

    <!-- Título + contador -->
    <div class="row items-start items-md-center q-col-gutter-sm">
      <div class="col">
        <div class="text-h4 text-weight-bold">Conversas</div>
        <div class="text-subtitle2 text-grey-7">
          Monitore e gerencie todas as conversas dos seus assistentes
        </div>
      </div>
      <div class="col-auto">
        <q-badge
          rounded
          color="indigo-1"
          text-color="indigo-10"
          :label="`${conversations.length} conversas totais`"
          class="q-px-md q-py-xs"
        />
      </div>
    </div>

    <div class="row q-col-gutter-lg">

      <!-- COL ESQUERDA: lista -->
      <div class="col-12 col-md-4">
        <q-card flat bordered class="list-card">
          <q-card-section class="row items-center q-gutter-sm">
            <q-icon name="chat_bubble_outline" />
            <div class="text-subtitle1 text-weight-bold">Conversas Recentes</div>
          </q-card-section>
          <q-separator />

          <q-card-section class="row q-col-gutter-sm">
            <q-input
              class="col-12"
              dense outlined clearable debounce="300"
              v-model="filters.q"
              placeholder="Buscar por nome ou telefone…"
            >
              <template #prepend><q-icon name="search" /></template>
            </q-input>

            <q-select
              class="col-12"
              dense outlined emit-value map-options
              v-model="filters.status"
              :options="statusOptions"
              label="Todos os Status"
            />
          </q-card-section>

          <q-separator />

          <q-list separator>
            <q-item
              v-for="c in filtered"
              :key="c.id"
              clickable
              @click="select(c.id)"
              :class="['conv-list-item', { active: c.id === selectedId }]"
            >
              <q-item-section avatar top>
                <q-avatar color="green-2" text-color="green-10">
                  <q-icon name="person" />
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <div class="row items-center no-wrap">
                  <q-item-label class="text-weight-medium ellipsis">{{ c.name }}</q-item-label>
                  <q-space />
                  <q-badge :label="c.status" :color="c.statusColor" rounded />
                </div>
                <q-item-label caption class="text-grey-7">Assistente</q-item-label>
                <q-item-label caption class="ellipsis-2-lines">{{ c.preview }}</q-item-label>

                <div class="row items-center text-caption text-grey-7 q-mt-xs q-gutter-md">
                  <div><q-icon name="schedule" class="q-mr-xs" /> {{ c.time }}</div>
                  <div class="row items-center">
                    <q-icon name="star" class="q-mr-xs text-amber-7" />
                    {{ c.rating }}
                  </div>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <!-- COL DIREITA: detalhe -->
      <div class="col-12 col-md-8">
        <!-- Estado vazio -->
        <q-card v-if="!selected" flat bordered class="detail-card flex flex-center column q-pa-xl">
          <q-icon name="sms" size="64px" class="text-grey-5 q-mb-md" />
          <div class="text-subtitle1 text-weight-bold q-mb-xs">Selecione uma conversa</div>
          <div class="text-grey-7">Escolha uma conversa da lista para ver os detalhes e mensagens</div>
        </q-card>

        <!-- Conversa selecionada -->
        <q-card v-else flat bordered class="detail-card">
          <!-- Header da conversa -->
          <q-card-section>
            <div class="row items-center no-wrap">
              <q-avatar color="green-2" text-color="green-10"><q-icon name="person" /></q-avatar>
              <div class="q-ml-md">
                <div class="text-subtitle1 text-weight-bold">{{ selected.name }}</div>
                <div class="text-caption text-grey-7">Assistente</div>
              </div>
              <q-space />
              <q-badge :label="selected.status" :color="selected.statusColor" rounded />
            </div>
          </q-card-section>
          <q-separator />

          <!-- Mensagens -->
          <q-card-section style="min-height: 340px; max-height: 60vh; overflow-y: auto">
            <q-chat-message
              v-for="m in selected.messages"
              :key="m.id"
              :name="m.from"
              :sent="m.sent"
              :bg-color="m.sent ? 'primary' : 'grey-2'"
              :text-color="m.sent ? 'white' : 'dark'"
              :stamp="m.time"
              class="q-mb-sm"
            >
              {{ m.text }}
            </q-chat-message>
          </q-card-section>

          <q-separator />

          <!-- Rodapé -->
          <q-card-section class="row items-center justify-between">
            <div class="text-caption text-grey-7">
              Iniciada em {{ selected.startedAt }}
            </div>
            <div class="row items-center text-caption">
              <div class="q-mr-sm">Avaliação:</div>
              <q-rating v-model="ratingModel" size="18px" color="amber" :max="5" readonly />
            </div>
          </q-card-section>
        </q-card>
      </div>

    </div>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'

defineOptions({ name: 'ConversationsPage' })

/* mock de conversas */
const conversations = ref([
  {
    id: 1,
    name: 'Carlos Mendes',
    preview: 'Agendado! Carlos Mendes, corte + barba hoje às 15h. Até logo!',
    time: 'há 3 dias',
    rating: 4,
    status: 'Resolvido',
    statusColor: 'green-2',
    startedAt: '25/08/2025 às 10:32',
    messages: [
      { id: 'm1', from: 'Cliente', sent: false, text: 'Quanto custa corte + barba?', time: '10:15' },
      { id: 'm2', from: 'Assistente', sent: true,  text: 'O serviço de corte + barba custa R$ 40 e demora cerca de 45 minutos. Quer agendar?', time: '10:15' },
      { id: 'm3', from: 'Cliente', sent: false, text: 'Perfeito! Pode ser hoje às 15h?', time: '10:16' },
      { id: 'm4', from: 'Assistente', sent: true,  text: 'Agendado! Carlos Mendes, corte + barba hoje às 15h. Até logo!', time: '10:16' }
    ]
  },
  {
    id: 2,
    name: 'João Silva',
    preview: 'Temos horários disponíveis às 15h30 e às 16h15. O corte social fica R$ 25. Qual ho…',
    time: 'há 3 dias',
    rating: 5,
    status: 'Ativo',
    statusColor: 'indigo-2',
    startedAt: '25/08/2025 às 10:32',
    messages: [
      { id: 'm1', from: 'Cliente', sent: false, text: 'Oi!', time: '09:00' }
    ]
  }
])

/* filtro + seleção */
const filters = ref({ q: '', status: 'all' })
const statusOptions = [
  { label: 'Todos os Status', value: 'all' },
  { label: 'Ativo', value: 'Ativo' },
  { label: 'Resolvido', value: 'Resolvido' }
]

const filtered = computed(() => {
  const q = filters.value.q.trim().toLowerCase()
  return conversations.value.filter(c => {
    const okQ = !q || [c.name, c.preview].some(v => v.toLowerCase().includes(q))
    const okS = filters.value.status === 'all' || c.status === filters.value.status
    return okQ && okS
  })
})

const selectedId = ref(null)
const selected = computed(() => conversations.value.find(c => c.id === selectedId.value))
const ratingModel = computed(() => selected?.value?.rating ?? 0)

function select(id) { selectedId.value = id }
</script>

<style scoped>
.list-card, .detail-card { border-radius: 14px; box-shadow: 0 6px 16px rgba(0,0,0,.04); }
.conv-list-item.active { background: #EEF7FF; border-left: 3px solid #455CE9; }
.ellipsis-2-lines {
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
</style>
