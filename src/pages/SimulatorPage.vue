<template>
  <q-page padding class="q-gutter-md">

    <!-- Título -->
    <div>
      <div class="text-h4 text-weight-bold">Simulador de Conversas</div>
      <div class="text-subtitle2 text-grey-7">Teste e treine seus assistentes virtuais</div>
    </div>

    <div class="row q-col-gutter-lg q-mt-md">

      <!-- ESQUERDA: escolher assistente -->
      <div class="col-12 col-md-4">
        <q-card flat bordered class="panel">
          <q-card-section class="row items-center q-gutter-sm">
            <q-icon name="smart_toy" />
            <div class="text-subtitle1 text-weight-bold">Escolher Assistente</div>
          </q-card-section>
          <q-separator />

          <q-list padding>
            <q-item
              v-for="a in assistants"
              :key="a.id"
              clickable v-ripple
              :active="a.id === selectedId"
              @click="select(a.id)"
              active-class="assistant-active"
              class="assistant-item"
            >
              <q-item-section avatar top>
                <q-avatar color="primary" text-color="white" rounded>
                  <q-icon name="smart_toy"/>
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-medium ellipsis">{{ a.name }}</q-item-label>
                <q-item-label caption class="text-grey-7">{{ a.segment }}</q-item-label>

                <div class="row q-gutter-xs q-mt-xs">
                  <q-badge color="purple-1" text-color="purple-9" rounded :label="a.persona"/>
                  <q-badge color="green-1"  text-color="green-9"  rounded :label="a.status"/>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <!-- DIREITA: simulação -->
      <div class="col-12 col-md-8">
        <q-card flat bordered class="panel">

          <!-- header do assistente -->
          <q-card-section :class="['row items-center no-wrap', selected ? 'bg-selected' : '']">
            <q-avatar color="primary" text-color="white" rounded>
              <q-icon name="smart_toy"/>
            </q-avatar>
            <div class="q-ml-md">
              <div class="text-subtitle1 text-weight-bold">
                {{ selected?.name || 'Selecione um assistente' }}
              </div>
              <div v-if="selected" class="text-caption text-grey-7">
                Simulação • {{ selected.segment }}
              </div>
            </div>
            <q-space/>
            <q-btn
              v-if="selected"
              flat dense round icon="refresh" :label="$q.screen.gt.sm ? 'Reiniciar' : ''"
              @click="resetChat"
            />
          </q-card-section>

          <!-- área do chat -->
          <q-card-section class="chat-area">
            <!-- estado vazio -->
            <div v-if="!messages.length" class="empty-box">
              <q-icon name="play_circle" size="48px" class="text-primary q-mb-sm"/>
              <div class="text-subtitle1 text-weight-bold">Pronto para simular!</div>
              <div class="text-caption text-grey-7 q-mt-xs text-center" style="max-width:520px">
                Digite uma mensagem abaixo para começar a conversa com o
                <b v-if="selected">{{ selected.name }}</b>
              </div>
            </div>

            <!-- mensagens -->
            <div v-else>
              <q-chat-message
                v-for="m in messages"
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
            </div>
          </q-card-section>

          <q-separator />

          <!-- input -->
          <q-card-section class="row items-center q-col-gutter-sm">
            <q-input
              class="col"
              dense outlined v-model="draft"
              :placeholder="selected ? 'Digite sua mensagem...' : 'Selecione um assistente para iniciar'"
              :disable="!selected"
              @keyup.enter="send"
            />
            <q-btn
              color="positive" round icon="send" unelevated
              :disable="!selected || !draft.trim()" @click="send"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'

defineOptions({ name: 'SimulatorPage' })

/* assistentes mock */
const assistants = ref([
  { id: 1, name: 'Assistente da Barbearia Style', segment: 'Barbearia', persona: 'Amigável', status: 'Ativo' },
  // adicione mais se quiser
])

const selectedId = ref(1)
const selected   = computed(() => assistants.value.find(a => a.id === selectedId.value) || null)

const messages = ref([])
const draft    = ref('')

function select (id) {
  selectedId.value = id
  // mantém conversa atual do mesmo assistente; se quiser limpar, chame resetChat()
}

function resetChat () {
  messages.value = []
  draft.value = ''
}

function send () {
  const text = draft.value.trim()
  if (!text) return
  const now = new Date().toLocaleTimeString().slice(0,5)

  // usuário
  messages.value.push({ id: cryptoRandom(), from: 'Você', sent: false, text, time: now })

  draft.value = ''

  // resposta dummy do assistente (simulação)
  setTimeout(() => {
    const reply = `(${selected.value?.persona}) Entendi: "${text}". Como posso ajudar mais?`
    messages.value.push({ id: cryptoRandom(), from: 'Assistente', sent: true, text: reply, time: new Date().toLocaleTimeString().slice(0,5) })
  }, 400)
}

function cryptoRandom () {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
</script>

<style scoped>
.panel { border-radius: 14px; box-shadow: 0 6px 16px rgba(0,0,0,.04); }
.assistant-item { border-radius: 12px; margin: 4px 8px; }
.assistant-active { background: #F3E8FF; border: 1px solid rgba(124,58,237,.2); } /* lilás clarinho */
.bg-selected { background: #E8F7EF; } /* verde suave do header selecionado */

.chat-area {
  min-height: 360px;
  max-height: 62vh;
  overflow-y: auto;
}
.empty-box {
  border: 2px solid rgba(35,181,115,.25);
  border-radius: 10px;
  min-height: 180px;
  display: grid; place-items: center;
  padding: 24px; text-align: center;
}
</style>
