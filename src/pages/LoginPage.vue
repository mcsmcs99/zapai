<template>
  <q-page class="login-page">
    <div class="center-wrap">
      <div class="content grid">
        <!-- Lado de Marketing (sem dados fixos) -->
        <section class="hero column justify-between">
          <div>
            <div class="hero-title">Bem-vindo(a) 👋</div>
            <div class="hero-subtitle">
              Conecte-se para gerenciar assistentes virtuais, acompanhar conversas e evoluir sua operação com IA.
            </div>
          </div>

          <!-- Cards “estilo dashboard”, mas com mensagens de valor -->
          <div class="metrics row q-col-gutter-md">
            <q-card flat bordered class="metric-card col-12">
              <div class="row items-start q-gutter-sm">
                <q-avatar size="36px" color="positive" text-color="white" icon="smart_toy" />
                <div class="col">
                  <div class="metric-title">Assistentes prontos para o seu negócio</div>
                  <div class="metric-desc">
                    Crie e gerencie assistentes em minutos. Sem complexidade técnica.
                  </div>
                </div>
              </div>
            </q-card>

            <q-card flat bordered class="metric-card col-12">
              <div class="row items-start q-gutter-sm">
                <q-avatar size="36px" color="primary" text-color="white" icon="chat_bubble" />
                <div class="col">
                  <div class="metric-title">Conversas em tempo real</div>
                  <div class="metric-desc">
                    Monitore interações e responda mais rápido com painéis claros.
                  </div>
                </div>
              </div>
            </q-card>

            <q-card flat bordered class="metric-card col-12">
              <div class="row items-start q-gutter-sm">
                <q-avatar size="36px" color="deep-purple" text-color="white" icon="task_alt" />
                <div class="col">
                  <div class="metric-title">Resultados com IA</div>
                  <div class="metric-desc">
                    Insights de resolução e satisfação para melhorar continuamente seu atendimento.
                  </div>
                </div>
              </div>
            </q-card>

            <q-card flat bordered class="metric-card col-12">
              <div class="row items-start q-gutter-sm">
                <q-avatar size="36px" color="orange" text-color="white" icon="trending_up" />
                <div class="col">
                  <div class="metric-title">Crescimento previsível</div>
                  <div class="metric-desc">
                    Relatórios e indicadores para orientar decisões e aumentar conversões.
                  </div>
                </div>
              </div>
            </q-card>
          </div>
        </section>

        <!-- Card de Login -->
        <section class="login-card-wrapper">
          <q-card flat bordered class="login-card">
            <div class="q-pa-lg">
              <div class="text-h6 q-mb-xs">Entrar</div>
              <div class="text-caption text-secondary q-mb-md">
                Acesse com seu e-mail e senha
              </div>

              <q-form @submit.prevent="onSubmit" @reset.prevent="onReset" ref="formRef">
                <div class="q-gutter-md">
                  <q-input
                    v-model="form.email"
                    type="email"
                    label="E-mail"
                    dense
                    outlined
                    :disable="auth.loading"
                    :rules="[rules.required]"
                    autocomplete="email"
                    lazy-rules="ondemand"
                  >
                    <template #prepend><q-icon name="mail" /></template>
                  </q-input>

                  <q-input
                    v-model="form.password"
                    :type="showPass ? 'text' : 'password'"
                    label="Senha"
                    dense
                    outlined
                    :disable="auth.loading"
                    :rules="[rules.required]"
                    autocomplete="current-password"
                    lazy-rules="ondemand"
                    @keyup.enter="onSubmit"
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

                  <div class="row items-center justify-between">
                    <q-checkbox v-model="form.remember" label="Manter conectado" dense :disable="auth.loading" />
                    <q-btn flat size="sm" color="primary" label="Esqueci minha senha" @click="onForgot" :disable="auth.loading" />
                  </div>

                  <q-btn
                    type="submit"
                    color="positive"
                    label="Entrar"
                    class="full-width"
                    unelevated
                    :loading="auth.loading"
                  >
                    <template #loading>
                      <q-spinner class="q-mr-sm" /> Entrando...
                    </template>
                  </q-btn>

                  <q-separator spaced />

                  <div class="row justify-center q-mt-sm">
                    <span class="text-caption">
                      Não tem conta?
                      <q-btn flat size="sm" color="primary" label="Criar conta" @click="onCreate" :disable="auth.loading" />
                    </span>
                  </div>
                </div>
              </q-form>
            </div>
          </q-card>

          <div class="login-footer text-caption text-secondary">
            Ao entrar você concorda com nossos <a href="#" class="link">Termos</a> e <a href="#" class="link">Privacidade</a>.
          </div>
        </section>
      </div>
    </div>
  </q-page>
  <!-- Modal de confirmação de reenvio -->
  <q-dialog v-model="dlgResend.open" persistent>
    <q-card style="max-width:500px;width:100%; overflow: visible;">
      <q-card-section class="row items-center q-gutter-sm">
        <q-avatar color="warning" text-color="black" icon="mark_email_unread" />
        <div class="text-h6">Verificação pendente</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        Seu e-mail ainda não foi verificado. Deseja reenviar o código agora?
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Agora não" color="grey-7" v-close-popup :disable="dlgResend.loading" />
        <q-btn
          unelevated
          color="primary"
          label="Enviar"
          :disable="dlgResend.loading"
          :loading="dlgResend.loading"
          @click="confirmResend"
          :style="dlgResend.loading ? { width: '130px' } : null"
        >
          <template #loading>
            <div class="flex">
              <q-spinner class="q-mr-sm" />
              <span>
                Enviando...
              </span>
            </div>
          </template>
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const $q = useQuasar()
const auth = useAuthStore()

const showPass = ref(false)
const formRef = ref(null)

const dlgResend = ref({ open: false, loading: false })

const form = reactive({
  email: '',
  password: '',
  remember: true
})

const rules = {
  required: v => (!!v || v === 0) || 'Campo obrigatório',
}

async function onSubmit () {
  const ok = await formRef.value.validate()
  if (!ok) return

  try {
    const res = await auth.login({
      email: form.email,
      password: form.password
    })

    if (res.ok) {
      if (res.user?.status === 'pending_group') {
        router.replace({ name: 'onboarding-company' })
      } else if (!res.user?.current_group_id){
        router.replace({ name: 'select-group' })
      } else {
        router.replace({ name: 'dashboard' })
      }
      return
    }

    // 🚧 pendente de verificação → abre modal
    if (res.needsVerification) {
      dlgResend.value.open = true
      dlgResend.value.email = form.email
      return
    }

    // demais erros já notificados no store
  }  catch {
    // Notify já é feito no store; aqui é só para garantir UX
    $q.notify({ type: 'negative', message: 'Não foi possível autenticar.' })
  }
}

async function confirmResend () {
  if (!dlgResend.value.email) {
    dlgResend.value.open = false
    return
  }
  dlgResend.value.loading = true
  const r = await auth.resendVerification(dlgResend.value.email)
  dlgResend.value.loading = false

  if (r?.ok) {
    dlgResend.value.open = false
    if (r?.token) {
      console.log(r.token)
      router.push({ path: '/validate-account', query: { token: r.token } })
    }
  }
}

function onReset () {
  form.email = ''
  form.password = ''
  form.remember = true
}

function onForgot () {
  router.push({ path: '/forgot-password' })
}

function onCreate () {
  router.push({ path: '/register' })
}
</script>

<style scoped>
/* Página ocupa a viewport inteira e centraliza o bloco */
.login-page {
  min-height: 100vh;
  background: var(--q-color-grey-2);
}

/* Wrapper que centraliza todo o conteúdo no eixo X e Y */
.center-wrap {
  min-height: 100vh;
  display: grid;
  place-items: center; /* centraliza horizontal e vertical */
  padding: 16px;
}

/* Conteúdo com grid de duas colunas, mas o bloco todo fica centralizado */
.content.grid {
  width: 100%;
  max-width: 1100px;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 18px;
}

/* Responsivo: empilha em telas menores */
@media (max-width: 1024px) {
  .content.grid {
    grid-template-columns: 1fr;
  }
}

/* Painel de marketing (estilo “dashboard”) */
.hero {
  background: white;
  border: 1px solid var(--q-color-grey-4);
  border-radius: 16px;
  padding: 18px;
  min-height: 420px;
}
.hero-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 6px;
}
.hero-subtitle {
  color: var(--q-color-grey-7);
  margin-bottom: 14px;
}

/* Cards */
.metric-card {
  border-radius: 14px;
  padding: 14px;
}
.metric-title {
  font-size: 14px;
  font-weight: 600;
}
.metric-desc {
  font-size: 12px;
  color: var(--q-color-grey-7);
  margin-top: 2px;
}

/* Card de login */
.login-card-wrapper {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
.login-card {
  border-radius: 16px;
  background: white;
}
.login-footer {
  text-align: center;
  margin-top: 10px;
}
.link {
  color: var(--q-color-primary);
  text-decoration: none;
}
.link:hover {
  text-decoration: underline;
}

/* Utilitário */
.full-width {
  width: 100%;
}

.metrics {
  gap: 10px;
}
</style>
