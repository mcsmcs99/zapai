<template>
  <fieldset class="company-fieldset">
    <legend class="company-legend">
      <div class="text-subtitle1">Escolha sua empresa</div>
      <div class="text-caption text-grey-7">
        Selecione uma empresa para continuar
      </div>
    </legend>

    <div class="fieldset-body">
      <div class="q-my-md">
        <q-skeleton
          v-if="groupsStore.loadingList"
          type="QCard"
          height="120px"
          class="q-mb-md"
        />
        <q-skeleton
          v-if="groupsStore.loadingList"
          type="QCard"
          height="120px"
          class="q-mb-md"
        />
        <q-skeleton
          v-if="groupsStore.loadingList"
          type="QCard"
          height="120px"
        />
      </div>

      <div v-if="!groupsStore.loadingList" class="row q-col-gutter-lg">
        <q-card
          v-for="g in groups"
          :key="g.unique_key || g.id"
          bordered
          flat
          class="company-card col-12 col-md-4"
          @click="selectCompany(g)"
          tabindex="0"
          @keyup.enter.space="selectCompany(g)"
        >
          <div
            class="company-header row items-center justify-between"
            :class="{ 'is-selected': isSelected(g) }"
          >
            <div class="company-title">
              {{ g.company_fantasy_name || g.company_name || 'Empresa sem nome' }}
            </div>
            <div class="row items-center q-gutter-xs">
              <q-badge
                v-if="g.status === 'active'"
                color="positive"
                label="Ativa"
                transparent
              />
              <q-badge
                v-else
                color="grey-6"
                :label="statusLabel(g.status)"
                transparent
              />
            </div>
          </div>

          <q-card-section class="q-pt-md q-pb-sm">
            <div class="text-caption text-grey-7 q-mb-xs">Documento</div>
            <div class="text-body1 text-weight-bold">
              {{ g.document_number || '-' }}
            </div>

            <div class="text-caption text-grey-7 q-mt-md q-mb-xs">Razão social</div>
            <div class="text-body2">
              {{ g.company_name || '-' }}
            </div>
          </q-card-section>

          <q-card-section class="q-pt-sm">
            <div class="readonly-field">
              <div class="row items-center justify-between">
                <div class="row items-center">
                  <q-icon name="phone" class="q-mr-sm" />
                  <span>Telefone</span>
                </div>
                <strong>{{ g.phone_fix || g.phone_cellular || '-' }}</strong>
              </div>
            </div>

            <div class="readonly-field q-mt-sm">
              <div class="row items-center justify-between">
                <div class="row items-center">
                  <q-icon name="chat" class="q-mr-sm" />
                  <span>WhatsApp</span>
                </div>
                <strong>{{ g.link_whatsapp || '-' }}</strong>
              </div>
            </div>

            <q-separator class="q-my-md" />

            <div class="q-mb-sm text-body2">
              <strong>Redes sociais:</strong>
            </div>

            <ul class="features q-mb-none">
              <li>
                <q-icon name="photo_camera" size="16px" class="q-mr-sm text-grey-8" />
                <span>{{ g.link_instagram || 'Instagram não informado' }}</span>
              </li>
              <li class="q-mt-xs">
                <q-icon name="facebook" size="16px" class="q-mr-sm text-grey-8" />
                <span>{{ g.link_facebook || 'Facebook não informado' }}</span>
              </li>
            </ul>
          </q-card-section>
        </q-card>
      </div>

      <div v-if="!groupsStore.loadingList && !groups.length" class="q-mt-md">
        <q-banner rounded class="bg-grey-2 text-grey-8">
          Nenhuma empresa encontrada para o seu usuário.
        </q-banner>
      </div>
    </div>
  </fieldset>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useOnboardingStore } from 'src/stores/onboarding'
import { useGroupsStore } from 'src/stores/groups'
import { useAuthStore } from 'src/stores/auth'

const ob = useOnboardingStore()
const groupsStore = useGroupsStore()
const authStore = useAuthStore()
const router = useRouter()

onMounted(() => {
  groupsStore.fetchGroups()
})

const groups = computed(() => groupsStore.groups || [])

async function selectCompany (g) {
  // atualiza stores locais (UI)
  groupsStore.currentGroup = {
    ...groupsStore.currentGroup,
    ...g
  }

  ob.company = {
    ...ob.company,
    ...g
  }

  // id do usuário logado
  const userId = authStore.user?.id || authStore.currentUser?.id

  if (!userId) {
    // sem usuário logado, não tenta salvar nem redireciona
    return
  }

  // chama API para salvar current_group_id
  const updatedUser = await authStore.updateCurrentGroup(g.id)

  // ⚠️ só redireciona se o update realmente deu certo
  if (updatedUser) {
    router.replace({ name: 'dashboard' })
  }
}

function isSelected (g) {
  return ob.company?.id === g.id || groupsStore.currentGroup?.id === g.id
}

function statusLabel (status) {
  if (!status) return 'Indefinido'
  const map = {
    active: 'Ativa',
    inactive: 'Inativa',
    removed: 'Removida',
    canceled: 'Cancelada'
  }
  return map[status] || status
}
</script>
<style scoped>
.company-fieldset {
  border: 1px solid var(--q-color-grey-4);
  border-radius: 16px;
  padding: 16px 20px 20px;
  margin: 0 auto;
  max-width: 1200px;
  background: #fff;
}

.company-legend {
  padding: 0 8px;
}

.fieldset-body {
  margin-top: 4px;
}

/* já existia, só mantido */
.company-card {
  border-radius: 14px;
  cursor: pointer;
  transition: box-shadow .2s ease, transform .05s ease, border-color .2s ease;
  border: none;
  outline: none;
}
.company-card:hover,
.company-card:focus-visible {
  box-shadow: 0 4px 14px rgba(0,0,0,.06);
}

.company-header.is-selected {
  padding: 12px 14px;
  border-top-left-radius: 14px;
  border-top-right-radius: 14px;
  background: linear-gradient(180deg, #dcffdc, #ffffff 85%);
  border-bottom: 1px solid var(--q-color-grey-4);
}
.company-header {
  padding: 12px 14px;
  border-top-left-radius: 14px;
  border-top-right-radius: 14px;
  background: linear-gradient(180deg, #eef0ff, #ffffff 85%);
  border-bottom: 1px solid var(--q-color-grey-4);
}
.company-title {
  font-weight: 700;
}
.readonly-field {
  border: 1px solid var(--q-color-grey-4);
  border-radius: 10px;
  padding: 10px 12px;
}
.features {
  list-style: none;
  padding: 0;
}
.features li {
  display: flex;
  align-items: center;
}
</style>
