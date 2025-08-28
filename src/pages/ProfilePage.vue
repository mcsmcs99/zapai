<template>
  <q-page padding class="q-gutter-md">

    <!-- Cabeçalho da página -->
    <div class="row items-center q-gutter-sm">
      <q-btn flat round icon="arrow_back" @click="$router.back()" />
      <div>
        <div class="text-h4 text-weight-bold">Meu Perfil</div>
        <div class="text-subtitle2 text-grey-7">Gerencie suas informações pessoais</div>
      </div>
    </div>

    <!-- Card principal -->
    <q-card class="q-mt-md profile-card" flat bordered>
      <q-card-section class="row items-center q-gutter-md">
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
            <div class="text-subtitle1 text-weight-medium">{{ form.name }}</div>
            <div class="text-caption text-grey-7">{{ roleLabel }}</div>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Form -->
      <q-form @submit.prevent="onSubmit">
        <q-card-section class="row q-col-gutter-lg">
          <div class="col-12 col-md-6">
            <div class="text-caption text-weight-medium q-mb-xs">Nome Completo</div>
            <q-input v-model="form.name" dense outlined readonly
                     hint="Nome não pode ser alterado aqui" />
          </div>

          <div class="col-12 col-md-6">
            <div class="text-caption text-weight-medium q-mb-xs">Email</div>
            <q-input v-model="form.email" dense outlined readonly
                     hint="Email não pode ser alterado" />
          </div>

          <div class="col-12 col-md-6">
            <div class="text-caption text-weight-medium q-mb-xs">Telefone</div>
            <q-input v-model="form.phone" dense outlined placeholder="(00) 00000-0000"
                     :rules="[v => !!v || 'Informe um telefone']" />
          </div>

          <div class="col-12 col-md-6">
            <div class="text-caption text-weight-medium q-mb-xs">Empresa</div>
            <q-input v-model="form.company" dense outlined placeholder="Nome da sua empresa" />
          </div>
        </q-card-section>

        <q-separator />

        <!-- Ações -->
        <q-card-actions align="right" class="q-pa-lg">
          <q-btn flat label="Cancelar" @click="$router.back()" />
          <q-btn color="primary" icon="save" label="Salvar Alterações"
                 type="submit" :loading="saving" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-page>
</template>

<script setup>
import { reactive, computed, ref, onMounted } from 'vue'

defineOptions({ name: 'ProfilePage' })

// mock: você pode trocar por store ou chamada real de API
const form = reactive({
  name: 'Matheus Correia Dos Santos',
  email: 'mcsmatheusmcs99@gmail.com',
  phone: '',
  company: '',
  role: 'admin' // admin|user
})

const roleLabel = computed(() => form.role === 'admin' ? 'Administrador' : 'Usuário')
const initials = computed(() => {
  const parts = (form.name || '').trim().split(/\s+/).slice(0, 2)
  return parts.map(p => p[0]?.toUpperCase()).join('') || 'U'
})

const saving = ref(false)

// simula carregar do backend
onMounted(async () => {
  // const data = await api.get('/me')
  // Object.assign(form, data)
})

async function onSubmit () {
  try {
    saving.value = true
    // await api.patch('/me', { phone: form.phone, company: form.company })
    this.$q?.notify?.({ type: 'positive', message: 'Perfil atualizado!' })
  } catch (e) {
    this.$q?.notify?.({ type: 'negative', message: 'Não foi possível salvar' })
    console.log(e)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.profile-card {
  border-radius: 16px;
  box-shadow: 0 10px 20px rgba(0,0,0,.04);
}
</style>
