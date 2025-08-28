<template>
  <q-page padding class="q-gutter-md">

    <!-- Título + ações -->
    <div class="row items-start items-md-center q-col-gutter-sm">
      <div class="col-12 col-md">
        <div class="text-h4 text-weight-bold">Meus Assistentes</div>
        <div class="text-subtitle2 text-grey-7">
          Gerencie e configure seus assistentes virtuais
        </div>
      </div>

      <!-- ações à direita (empilha no mobile) -->
      <div class="col-12 col-md-auto row items-center q-gutter-sm justify-end">
        <q-badge
          color="indigo-1"
          text-color="indigo-10"
          :label="`${assistants.length} de ${quota} assistentes`"
          class="q-px-md q-py-xs"
          rounded
        />
        <q-btn
          color="primary"
          icon="add"
          label="Novo Assistente"
          @click="$router.push('/assistentes/novo')"
          class="full-width-xs"
        />
      </div>
    </div>

    <!-- Filtros -->
    <q-card flat bordered class="filters-card q-mt-sm">
      <q-card-section class="row q-col-gutter-md">
        <q-input
          class="col-12 col-md-4"
          dense outlined clearable
          v-model="s.q" placeholder="Buscar assistentes…"
          debounce="300" @update:model-value="filter"
          :aria-label="'Buscar assistentes'"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>

        <q-select
          class="col-12 col-sm-4 col-md-2"
          dense outlined v-model="s.status"
          :options="statusOpts" label="Status" emit-value map-options
          @update:model-value="filter"
        />
        <q-select
          class="col-12 col-sm-4 col-md-3"
          dense outlined v-model="s.segment"
          :options="segmentOpts" label="Segmento" emit-value map-options
          @update:model-value="filter"
        />
        <q-select
          class="col-12 col-sm-4 col-md-3"
          dense outlined v-model="s.persona"
          :options="personaOpts" label="Personalidade" emit-value map-options
          @update:model-value="filter"
        />
      </q-card-section>
    </q-card>

    <!-- Lista de assistentes (grid responsivo) -->
    <div class="row q-col-gutter-lg q-mt-md">
      <div
        v-for="a in filtered"
        :key="a.id"
        class="col-12 col-sm-6 col-md-6 col-lg-4"
      >
        <q-card flat bordered class="assistant-card">
          <q-card-section class="row items-start no-wrap">
            <q-avatar size="44px" color="primary" text-color="white" rounded>
              <q-icon name="smart_toy" />
            </q-avatar>

            <div class="q-ml-md col">
              <div class="row items-center no-wrap">
                <div class="text-subtitle1 text-weight-bold ellipsis">
                  {{ a.name }}
                </div>
                <q-space />
                <q-badge
                  :label="a.status"
                  :color="a.status === 'Ativo' ? 'green-2' : 'grey-3'"
                  :text-color="a.status === 'Ativo' ? 'green-10' : 'grey-8'"
                  rounded
                  class="q-ml-sm"
                />
                <q-btn flat round dense icon="more_vert" class="q-ml-xs">
                  <q-menu>
                    <q-list style="min-width:160px">
                      <q-item clickable @click="$router.push(`/assistentes/${a.id}`)">
                        <q-item-section avatar><q-icon name="settings" /></q-item-section>
                        <q-item-section>Configurar</q-item-section>
                      </q-item>
                      <q-item clickable @click="test(a)">
                        <q-item-section avatar><q-icon name="play_arrow" /></q-item-section>
                        <q-item-section>Testar</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </div>
              <div class="text-caption text-grey-7">{{ a.segment }}</div>
            </div>
          </q-card-section>

          <q-separator inset />

          <q-card-section class="q-gutter-xs">
            <div class="row items-center">
              <div class="col-auto text-grey-7">Personalidade</div>
              <q-space />
              <q-badge rounded color="green-1" text-color="green-9" :label="a.persona" />
            </div>

            <div class="row items-center">
              <div class="col-auto text-grey-7">Serviços</div>
              <q-space />
              <div class="text-weight-medium">{{ a.services }} cadastrados</div>
            </div>

            <div class="q-mt-sm">
              <div class="text-grey-7">Sobre:</div>
              <div class="ellipsis-2-lines">{{ a.about }}</div>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right" class="q-pa-md">
            <q-btn outline color="primary" icon="play_arrow" label="Testar" @click="test(a)" />
            <q-btn color="primary" icon="settings" label="Configurar"
                   @click="$router.push(`/assistentes/${a.id}`)" />
          </q-card-actions>
        </q-card>
      </div>

      <!-- vazio -->
      <div v-if="!filtered.length" class="col-12">
        <q-banner class="bg-grey-1 text-grey-8 q-pa-md" rounded>
          Nenhum assistente encontrado com os filtros atuais.
        </q-banner>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'

defineOptions({ name: 'AssistantsListPage' })

const quota = 1

const assistants = ref([
  {
    id: 1,
    name: 'Assistente da Barbearia Style',
    segment: 'Barbearia',
    status: 'Ativo',
    persona: 'Amigável',
    services: 3,
    about: 'Barbearia moderna no centro da cidade, especializada em cortes…'
  }
  // adicione mais para testar a responsividade
])

const s = ref({
  q: '',
  status: 'all',
  segment: 'all',
  persona: 'all'
})

const statusOpts = [
  { label: 'Todos', value: 'all' },
  { label: 'Ativo', value: 'Ativo' },
  { label: 'Inativo', value: 'Inativo' }
]
const segmentOpts = [
  { label: 'Todas', value: 'all' },
  { label: 'Barbearia', value: 'Barbearia' },
  { label: 'Clínica', value: 'Clínica' },
  { label: 'Oficina', value: 'Oficina' }
]
const personaOpts = [
  { label: 'Todos', value: 'all' },
  { label: 'Amigável', value: 'Amigável' },
  { label: 'Formal', value: 'Formal' },
  { label: 'Descontraído', value: 'Descontraído' }
]

const filtered = computed(() => {
  const q = s.value.q.trim().toLowerCase()
  return assistants.value.filter(a => {
    const okQ = !q || [a.name, a.segment, a.about].some(v => v?.toLowerCase().includes(q))
    const okStatus  = s.value.status  === 'all' || a.status  === s.value.status
    const okSeg     = s.value.segment === 'all' || a.segment === s.value.segment
    const okPersona = s.value.persona === 'all' || a.persona === s.value.persona
    return okQ && okStatus && okSeg && okPersona
  })
})

const filter = () => {/* se quiser chamar API com os filtros */ }

const test = (a) => {
  // abra seu simulador com o id do assistente
  // this.$router.push(`/simulador?assistant=${a.id}`)
  console.log('Testar', a.id)
}
</script>

<style scoped>
.filters-card { border-radius: 14px; }

/* Card com borda verde suave como no print */
.assistant-card {
  border-radius: 14px;
  box-shadow: 0 6px 16px rgba(0,0,0,.04);
  border: 2px solid rgba(35,181,115,.18);
}

/* utilitários */
.ellipsis-2-lines {
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}

/* botão 100% no mobile (como no print) */
.full-width-xs { width: 100%; }
@media (min-width: 600px) { .full-width-xs { width: auto; } }
</style>
