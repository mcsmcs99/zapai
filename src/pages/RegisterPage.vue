<template>
  <q-page class="login-page">
    <div class="center-wrap">
      <div class="content grid">
        <!-- Lado de Marketing -->
        <section class="hero column justify-between">
          <div>
            <div class="hero-title">Crie sua conta 🚀</div>
            <div class="hero-subtitle">
              Comece a gerenciar seus assistentes virtuais e evolua seu atendimento com IA.
            </div>
          </div>

          <div class="metrics row q-col-gutter-md">
            <q-card flat bordered class="metric-card col-12">
              <div class="row items-start q-gutter-sm">
                <q-avatar size="36px" color="primary" text-color="white" icon="verified_user" />
                <div class="col">
                  <div class="metric-title">Cadastro rápido e seguro</div>
                  <div class="metric-desc">Em poucos passos você estará pronto para começar.</div>
                </div>
              </div>
            </q-card>

            <q-card flat bordered class="metric-card col-12">
              <div class="row items-start q-gutter-sm">
                <q-avatar size="36px" color="positive" text-color="white" icon="rocket_launch" />
                <div class="col">
                  <div class="metric-title">Comece gratuito</div>
                  <div class="metric-desc">Teste recursos e convide sua equipe quando quiser.</div>
                </div>
              </div>
            </q-card>
          </div>
        </section>

        <!-- Card de Cadastro -->
        <section class="login-card-wrapper">
          <q-card flat bordered class="login-card">
            <div class="q-pa-lg">
              <div class="text-h6 q-mb-xs">Criar conta</div>
              <div class="text-caption text-secondary q-mb-md">
                Preencha seus dados para começar
              </div>

              <q-form ref="formRef" @submit.prevent="onSubmit">
                <div class="q-gutter-md">
                  <q-input
                    v-model="form.name"
                    label="Nome completo"
                    dense outlined
                    :disable="loading"
                    :rules="[rules.required, rules.min3]"
                    autocomplete="name"
                    lazy-rules="ondemand"
                  >
                    <template #prepend><q-icon name="person" /></template>
                  </q-input>

                  <q-input
                    v-model="form.email"
                    type="email"
                    label="E-mail"
                    dense outlined
                    :disable="loading"
                    :rules="[rules.required, rules.email]"
                    autocomplete="email"
                    lazy-rules="ondemand"
                  >
                    <template #prepend><q-icon name="mail" /></template>
                  </q-input>

                  <q-input
                    v-model="form.password"
                    :type="showPass ? 'text' : 'password'"
                    label="Senha"
                    dense outlined
                    :disable="loading"
                    :rules="[rules.required, rules.strongPassword]"
                    autocomplete="new-password"
                    lazy-rules="ondemand"
                  >
                    <template #prepend><q-icon name="lock" /></template>
                    <template #append>
                      <q-icon
                        :name="showPass ? 'visibility_off' : 'visibility'"
                        class="cursor-pointer"
                        @click="showPass = !showPass"
                      />
                    </template>
                  </q-input>

                  <q-input
                    v-model="form.password2"
                    :type="showPass ? 'text' : 'password'"
                    label="Confirmar senha"
                    dense outlined
                    :disable="loading"
                    :rules="[rules.required, samePassword]"
                    autocomplete="new-password"
                    lazy-rules="ondemand"
                  >
                    <template #prepend><q-icon name="lock" /></template>
                  </q-input>

                  <div class="row items-center">
                    <q-checkbox v-model="form.accept" :disable="loading"
                      :rules="[v => v || 'Você precisa aceitar os termos']"
                      dense class="q-mr-sm" />
                    <div class="text-caption">
                      Eu li e aceito os <a href="#" class="link">Termos</a> e <a href="#" class="link">Privacidade</a>.
                    </div>
                  </div>

                  <q-btn
                    type="submit"
                    color="positive"
                    label="Criar conta"
                    class="full-width"
                    unelevated
                    :loading="loading"
                  >
                    <template #loading>
                      <q-spinner class="q-mr-sm" /> Enviando...
                    </template>
                  </q-btn>

                  <q-separator spaced />
                  <q-btn flat class="full-width" color="primary" icon="arrow_back" label="Voltar ao login" @click="goLogin" />
                </div>
              </q-form>
            </div>
          </q-card>
        </section>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const auth = useAuthStore()
const router = useRouter()
const $q = useQuasar()

const formRef = ref(null)
const loading = ref(false)
const showPass = ref(false)

const form = reactive({
  name: '',
  email: '',
  password: '',
  password2: '',
  accept: false
})

const rules = {
  required: v => (!!v || v === 0) || 'Campo obrigatório',
  email: v => /.+@.+\..+/.test(v) || 'E-mail inválido',
  min3: v => String(v || '').length >= 3 || 'Mínimo de 3 caracteres',
  strongPassword: v => {
    const s = String(v || '');
    if (s.length < 8)         return 'A senha deve ter no mínimo 8 caracteres';
    if (!/[a-z]/.test(s))     return 'Inclua pelo menos 1 letra minúscula';
    if (!/[A-Z]/.test(s))     return 'Inclua pelo menos 1 letra maiúscula';
    if (!/\d/.test(s))        return 'Inclua pelo menos 1 número';
    if (!/[^\w\s]/.test(s))   return 'Inclua pelo menos 1 símbolo (ex.: !@#$%)';
    if (/\s/.test(s))         return 'A senha não pode conter espaços';
    return true;
  }
}
const samePassword = v => v === form.password || 'As senhas não conferem'

async function onSubmit () {
  const ok = await formRef.value.validate()
  if (!ok) return

  loading.value = true

  const res = await auth.register({
    name: form.name,
    email: form.email,
    password: form.password
  })

  if (res.ok) {
    router.replace({ path: '/login' })
  } else if (res.error) {
    $q.notify({ type: 'negative', message: res.error })
  }
  loading.value = false
}

function goLogin () {
  router.replace({ path: '/login' })
}
</script>

<style scoped>
/* Mesma base visual do Login */
.login-page { min-height: 100vh; background: var(--q-color-grey-2); }
.center-wrap { min-height: 100vh; display: grid; place-items: center; padding: 16px; }
.content.grid { width: 100%; max-width: 1100px; display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 18px; }
@media (max-width: 1024px) { .content.grid { grid-template-columns: 1fr; } }
.hero { background: white; border: 1px solid var(--q-color-grey-4); border-radius: 16px; padding: 18px; max-height: 320px; }
.hero-title { font-size: 28px; font-weight: 700; margin-bottom: 6px; }
.hero-subtitle { color: var(--q-color-grey-7); margin-bottom: 14px; }
.metric-card { border-radius: 14px; padding: 14px; }
.metric-title { font-size: 14px; font-weight: 600; }
.metric-desc { font-size: 12px; color: var(--q-color-grey-7); margin-top: 2px; }
.login-card-wrapper { display: flex; flex-direction: column; align-items: stretch; }
.login-card { border-radius: 16px; background: white; }
.full-width { width: 100%; }
.link { color: var(--q-color-primary); text-decoration: none; }
.link:hover { text-decoration: underline; }
.metrics {
  gap: 10px;
}
</style>
