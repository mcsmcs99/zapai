<template>
  <q-page padding class="q-gutter-md">

    <!-- Cabeçalho da página -->
    <div class="row items-center q-gutter-sm">
      <q-btn flat round icon="arrow_back" @click="$router.back()" />
      <div>
        <div class="text-h4 text-weight-bold">Meu Perfil</div>
        <div class="text-subtitle2 text-grey-7">
          Gerencie suas informações pessoais e configurações da conta
        </div>
      </div>
    </div>

    <!-- Card principal -->
    <q-card class="q-mt-md profile-card" flat bordered>

      <!-- Título -->
      <q-card-section class="row items-center q-gutter-sm">
        <div class="text-h6 text-weight-bold q-mb-none">
          <q-icon name="person_outline" class="q-mr-sm" />
          Informações Pessoais
        </div>
      </q-card-section>

      <!-- Header com avatar + nome + papel -->
      <q-separator />
      <q-card-section>
        <div class="row items-center q-gutter-md">
          <q-avatar size="72px" color="primary" text-color="white">
            {{ initials }}
          </q-avatar>

          <div>
            <div class="text-subtitle1 text-weight-medium">
              {{ form.displayName }}
            </div>
            <div class="row items-center q-gutter-xs">
              <q-badge color="primary" outline>{{ roleLabel }}</q-badge>
              <q-badge :color="statusColor" outline>{{ statusLabel }}</q-badge>
            </div>
            <div class="text-caption text-grey-7 q-mt-xs">
              ID: {{ form.id }} &nbsp;•&nbsp; Chave: {{ form.unique_key }}
            </div>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-form @submit.prevent="onSubmit">

        <!-- BLOCO 1: Dados básicos -->
        <q-card-section class="row q-col-gutter-lg">
          <div class="col-12 col-md-6">
            <div class="text-caption text-weight-medium q-mb-xs">Nome Completo</div>
            <q-input
              v-model="form.name"
              dense
              outlined
              :rules="[v => !!v || 'Informe seu nome completo']"
              hint="Esse será o nome exibido nas telas do sistema"
            />
          </div>

          <div class="col-12 col-md-6">
            <div class="text-caption text-weight-medium q-mb-xs">Email</div>
            <q-input
              v-model="form.email"
              dense
              outlined
              :readonly="true"
              hint="Email não pode ser alterado"
            />
          </div>
        </q-card-section>

        <q-separator inset />

        <!-- BLOCO 2: Acesso e permissões (ligado ao model User) -->
        <q-card-section>
          <div class="text-subtitle2 text-weight-bold q-mb-md">
            Configurações da Conta
          </div>

          <div class="row q-col-gutter-lg">
            <!-- Tipo de usuário (User.type) -->
            <div class="col-12 col-md-6">
              <div class="text-caption text-weight-medium q-mb-xs">Tipo de Usuário</div>
              <q-select
                v-model="form.type"
                :options="userTypeOptions"
                dense
                outlined
                emit-value
                map-options
                :readonly="!canEditAdminFields"
                :hint="canEditAdminFields
                  ? 'Defina o perfil de acesso do usuário'
                  : 'Campo somente leitura para este usuário'"
              />
            </div>

            <!-- Status (User.status) -->
            <div class="col-12 col-md-6">
              <div class="text-caption text-weight-medium q-mb-xs">Status da Conta</div>
              <q-select
                v-model="form.status"
                :options="statusOptions"
                dense
                outlined
                emit-value
                map-options
                :readonly="!canEditAdminFields"
                :hint="canEditAdminFields
                  ? 'Controle a situação da conta'
                  : 'Campo somente leitura para este usuário'"
              />
            </div>
          </div>
        </q-card-section>

        <q-separator inset />

        <!-- BLOCO 3: Segurança + Empresa atual -->
        <q-card-section>

          <!-- Segurança -->
          <div class="text-subtitle2 text-weight-bold q-mb-sm">
            Segurança
          </div>
          <div class="row items-center justify-between q-mb-md">
            <div class="text-body2 text-grey-7 q-mr-md">
              A senha não é exibida por segurança. Use o botão abaixo para alterá-la.
            </div>
            <q-btn
              flat
              color="primary"
              icon="vpn_key"
              label="Alterar senha"
              @click="goToChangePassword"
            />
          </div>

          <q-separator inset class="q-my-sm" />

          <!-- Empresa atual -->
          <div class="text-subtitle2 text-weight-bold q-mb-sm">
            Empresa atual
          </div>
          <div class="row items-center justify-between">
            <div class="text-body2 text-grey-7 q-mr-md">
              Visualize e edite os dados da empresa vinculada ao seu acesso atual.
            </div>
            <q-btn
              flat
              color="primary"
              icon="business"
              label="Dados da empresa"
              @click="openCompanyDialog"
            />
          </div>
        </q-card-section>

        <q-separator />

        <!-- Ações -->
        <q-card-actions align="right" class="q-pa-lg">
          <q-btn flat label="Cancelar" @click="$router.back()" />
          <q-btn
            color="primary"
            icon="save"
            label="Salvar Alterações"
            type="submit"
            :loading="saving"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-page>

  <!-- Dialog de troca de senha -->
  <ChangePasswordDialog
    v-model="showChangePasswordDialog"
    @confirm="handleChangePassword"
  />

  <!-- Dialog de empresa atual -->
  <CurrentCompanyDialog
    v-model="showCompanyDialog"
    v-if="currentCompany"
    :company="currentCompany"
    @save="handleSaveCompany"
  />
</template>

<script setup>
import { reactive, computed, ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'
import { useOnboardingStore } from 'src/stores/onboarding'
import ChangePasswordDialog from 'src/components/ChangePasswordDialog.vue'
import CurrentCompanyDialog from 'src/components/CurrentCompanyDialog.vue'

defineOptions({ name: 'ProfilePage' })

const $q = useQuasar()
const auth = useAuthStore()
const ob = useOnboardingStore() 

const showChangePasswordDialog = ref(false)
const showCompanyDialog = ref(false)
const currentCompany = ref(null)

/**
 * Form ligado diretamente ao model User
 */
const form = reactive({
  id: null,
  unique_key: '',
  name: '',          // valor editável no input
  displayName: '',   // valor exibido no topo / avatar (só muda após salvar)
  email: '',
  type: 'owner',          // super_admin | owner | admin | operational | final_customer
  status: 'active'        // pending_group | pending_verification | active | black_list | removed
})

/**
 * Se o usuário logado é super_admin, você pode permitir edição
 * de type/status.
 * Aqui deixei hardcoded false; você pluga na authStore depois.
 */
const canEditAdminFields = ref(false) // TODO: trocar por verificação de permissão real

const userTypeOptions = [
  { label: 'Super Admin', value: 'super_admin' },
  { label: 'Owner (dono da conta)', value: 'owner' },
  { label: 'Administrador', value: 'admin' },
  { label: 'Operacional', value: 'operational' },
  { label: 'Cliente final', value: 'final_customer' }
]

const statusOptions = [
  { label: 'Pendente de grupo', value: 'pending_group' },
  { label: 'Pendente de verificação', value: 'pending_verification' },
  { label: 'Ativo', value: 'active' },
  { label: 'Black list', value: 'black_list' },
  { label: 'Removido', value: 'removed' }
]

const roleLabel = computed(() => {
  const found = userTypeOptions.find(o => o.value === form.type)
  return found?.label || 'Usuário'
})

const statusLabel = computed(() => {
  const found = statusOptions.find(o => o.value === form.status)
  return found?.label || 'Desconhecido'
})

const statusColor = computed(() => {
  switch (form.status) {
    case 'active': return 'positive'
    case 'pending_group':
    case 'pending_verification': return 'warning'
    case 'black_list':
    case 'removed': return 'negative'
    default: return 'grey-6'
  }
})

const initials = computed(() => {
  const parts = (form.displayName || '').trim().split(/\s+/).slice(0, 2)
  return parts.map(p => p[0]?.toUpperCase()).join('') || 'U'
})

const saving = ref(false)

/**
 * Carrega dados do usuário logado.
 */
onMounted(async () => {
  try {
    // Exemplo mock só pra tela funcionar
    form.id = auth.user?.id || 1
    form.unique_key = auth.user?.unique_key || '8c0b0e2c-1234-4321-aaaa-bbbbccccdddd'
    form.name = auth.user?.name || 'Matheus Correia Dos Santos'
    form.displayName = form.name
    form.email = auth.user?.email || 'mcsmatheusmcs99@gmail.com'
    form.type = auth.user?.type || 'admin'
    form.status = auth.user?.status || 'active'

    // Se quiser amarrar permissão:
    // canEditAdminFields.value = auth.user?.type === 'super_admin'
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Não foi possível carregar os dados do perfil.' })
  }
})

async function onSubmit () {
  try {
    saving.value = true
    const payload = {
      name: form.name,
      type: form.type,
      status: form.status
    }

    const updatedUser = await auth.updateProfile(payload)

    if (updatedUser) {
      form.displayName = updatedUser.name
    }

    $q.notify({ type: 'positive', message: 'Perfil atualizado com sucesso!' })
  } catch (e) {
    console.error(e)
    $q.notify({ type: 'negative', message: 'Não foi possível salvar as alterações.' })
  } finally {
    saving.value = false
  }
}

function goToChangePassword () {
  showChangePasswordDialog.value = true
}

async function handleChangePassword (payload) {
  try {
    const ok = await auth.changePassword(payload)

    if (ok) {
      showChangePasswordDialog.value = false
      $q.notify({ type: 'positive', message: 'Senha alterada com sucesso!' })
    }
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Erro ao alterar a senha.' })
  }
}

/**
 * Abre modal com dados da empresa atual (current_group_id do user)
 */
async function openCompanyDialog () {
  try {
    await ob.loadFromSession()

    const company = ob.company || {}

    const hasMinimalCompany =
      !!company.id && !!company.document_number

    if (!hasMinimalCompany) {
      $q.notify({
        type: 'warning',
        message: 'Nenhuma empresa encontrada para este usuário.'
      })
      return
    }

    // passa uma cópia para a modal não mutar direto o store
    currentCompany.value = { ...company }
    showCompanyDialog.value = true
  } catch (err) {
    console.error(err)
    $q.notify({
      type: 'negative',
      message: 'Não foi possível carregar os dados da empresa.'
    })
  }
}

/**
 * Recebe os dados salvos da empresa a partir do dialog
 */
async function handleSaveCompany (companyPayload) {
  try {
    // se quiser reaproveitar o fluxo do onboarding:
    Object.assign(ob.company, companyPayload)
    await ob.saveCompany()
    currentCompany.value = { ...currentCompany.value, ...companyPayload }
    $q.notify({ type: 'positive', message: 'Dados da empresa atualizados com sucesso!' })
    showCompanyDialog.value = false
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Erro ao salvar os dados da empresa.' })
  }
}
</script>

<style scoped>
.profile-card {
  border-radius: 16px;
  box-shadow: 0 10px 20px rgba(0,0,0,.04);
}
</style>
