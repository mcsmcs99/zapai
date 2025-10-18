<template>
  <q-page class="login-page">
    <div class="center-wrap">
      <div class="content grid">
        <!-- Lado de Marketing -->
        <section class="hero column justify-between">
          <div>
            <div class="hero-title">Esqueceu sua senha?</div>
            <div class="hero-subtitle">
              Sem problema. Enviaremos um link seguro para você redefinir a senha.
            </div>
          </div>

          <div class="metrics row q-col-gutter-md">
            <q-card flat bordered class="metric-card col-12">
              <div class="row items-start q-gutter-sm">
                <q-avatar size="36px" color="primary" text-color="white" icon="mark_email_unread" />
                <div class="col">
                  <div class="metric-title">Link de recuperação</div>
                  <div class="metric-desc">Chega no seu e-mail em poucos instantes.</div>
                </div>
              </div>
            </q-card>

            <q-card flat bordered class="metric-card col-12">
              <div class="row items-start q-gutter-sm">
                <q-avatar size="36px" color="positive" text-color="white" icon="security" />
                <div class="col">
                  <div class="metric-title">Processo seguro</div>
                  <div class="metric-desc">Seu acesso é protegido de ponta a ponta.</div>
                </div>
              </div>
            </q-card>
          </div>
        </section>

        <!-- Card de Recuperação -->
        <section class="login-card-wrapper">
          <q-card flat bordered class="login-card">
            <div class="q-pa-lg">
              <div class="text-h6 q-mb-xs">Recuperar senha</div>
              <div class="text-caption text-secondary q-mb-md">
                Informe seu e-mail para enviarmos as instruções.
              </div>

              <q-form ref="formRef" @submit.prevent="onSubmit">
                <div class="q-gutter-md">
                  <q-input
                    v-model="email"
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

                  <q-btn
                    type="submit"
                    color="primary"
                    label="Enviar link"
                    class="full-width"
                    unelevated
                    :loading="loading"
                    :disable="cooldown > 0"
                  >
                    <template #loading>
                      <q-spinner class="q-mr-sm" /> Enviando...
                    </template>
                  </q-btn>

                  <div v-if="cooldown > 0" class="text-caption text-grey-7 q-mt-xs">
                    Você pode tentar novamente em {{ cooldown }}s.
                  </div>

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
import { useAuthStore } from 'src/stores/auth'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const formRef = ref(null)
const email = ref('')
const loading = ref(false)
const cooldown = ref(0)
const auth = useAuthStore()

const rules = {
  required: v => (!!v || v === 0) || 'Campo obrigatório',
  email: v => /.+@.+\..+/.test(v) || 'E-mail inválido'
}

async function onSubmit () {
  const ok = await formRef.value.validate()
  if (!ok) return

  loading.value = true
  const res = await auth.forgotPassword(email.value)
  // opcional: redirecionar de volta ao login
  if (res.ok) {
    router.replace({ path: '/login' })
  }
  loading.value = false
}

function goLogin () {
  router.replace({ path: '/login' })
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: var(--q-color-grey-2);
}
.center-wrap {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 16px;
}
.content.grid {
  width: 100%;
  max-width: 1100px;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 18px;
}
@media (max-width: 1024px) {
  .content.grid { grid-template-columns: 1fr; }
}
.hero {
  background: white;
  border: 1px solid var(--q-color-grey-4);
  border-radius: 16px;
  padding: 18px;
}
.hero-title { font-size: 28px; font-weight: 700; margin-bottom: 6px; }
.hero-subtitle { color: var(--q-color-grey-7); margin-bottom: 14px; }
.metric-card { border-radius: 14px; padding: 14px; }
.metric-title { font-size: 14px; font-weight: 600; }
.metric-desc { font-size: 12px; color: var(--q-color-grey-7); margin-top: 2px; }
.login-card-wrapper { display: flex; flex-direction: column; align-items: stretch; }
.login-card { border-radius: 16px; background: white; }
.full-width { width: 100%; }
.metrics {
  gap: 10px;
}
</style>
