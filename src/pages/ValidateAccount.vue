<template>
  <q-page class="login-page">
    <div class="center-wrap">
      <div class="content grid">
        <!-- Lado de mensagem/marketing (opcional) -->
        <section class="hero column justify-between">
          <div>
            <div class="hero-title">Validar conta 🔐</div>
            <div class="hero-subtitle">
              Digite o código enviado ao seu e-mail ou use o link de verificação.
            </div>
          </div>

          <div class="metrics row q-col-gutter-md">
            <q-card flat bordered class="metric-card col-12">
              <div class="row items-start q-gutter-sm">
                <q-avatar size="36px" color="primary" text-color="white" icon="mark_email_unread" />
                <div class="col">
                  <div class="metric-title">Código de 6 dígitos</div>
                  <div class="metric-desc">Verifique sua caixa de entrada e spam.</div>
                </div>
              </div>
            </q-card>

            <q-card flat bordered class="metric-card col-12">
              <div class="row items-start q-gutter-sm">
                <q-avatar size="36px" color="positive" text-color="white" icon="timer" />
                <div class="col">
                  <div class="metric-title">Link com expiração</div>
                  <div class="metric-desc">O link expira em poucos minutos por segurança.</div>
                </div>
              </div>
            </q-card>
          </div>
        </section>

        <!-- Card de Validação -->
        <section class="login-card-wrapper">
          <q-card flat bordered class="login-card">
            <div class="q-pa-lg">
              <div class="text-h6 q-mb-xs">Confirmar e-mail</div>
              <div class="text-caption text-secondary q-mb-md">
                Informe o código de verificação para ativar sua conta
              </div>

              <q-form ref="formRef" @submit.prevent="onSubmit">
                <div class="q-gutter-md">
                  <q-input
                    v-model="form.code"
                    label="Código de verificação"
                    dense outlined
                    :disable="loading"
                    :rules="[rules.required, rules.code6]"
                    inputmode="numeric"
                    maxlength="6"
                    lazy-rules="ondemand"
                    @update:model-value="onlyDigits"
                  >
                    <template #prepend><q-icon name="pin" /></template>
                    <template #append>
                      <q-btn flat dense round icon="content_paste" @click="pasteFromClipboard" :disable="loading" />
                    </template>
                  </q-input>

                  <q-btn
                    type="submit"
                    color="positive"
                    label="Validar conta"
                    class="full-width"
                    unelevated
                    :loading="loading"
                  >
                    <template #loading>
                      <q-spinner class="q-mr-sm" /> Validando...
                    </template>
                  </q-btn>

                  <q-separator spaced />
                  <div class="row items-center justify-between">
                    <q-btn
                      flat
                      color="primary"
                      icon="refresh"
                      :label="resendLabel"
                      @click="resend"
                      :disable="loading || resendDisabled"
                    />
                    <q-btn flat color="primary" icon="arrow_back" label="Voltar ao login" @click="goLogin" />
                  </div>
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
import { reactive, ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const auth = useAuthStore()

const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  code: '',
  token: '',
  email: ''
})

const rules = {
  required: v => (!!v || v === 0) || 'Campo obrigatório',
  code6: v => /^\d{6}$/.test(String(v || '')) || 'Informe 6 dígitos',
  tokenOptional: () => true // o token é opcional se já chegou via URL; caso queira obrigar, crie uma regra condicional
}

// cooldown de reenvio (em segundos)
const cooldown = ref(0)
let cooldownTimer = null

const resendDisabled = computed(() => cooldown.value > 0)
const resendLabel = computed(() => {
  if (cooldown.value <= 0) return 'Reenviar código'
  const mm = String(Math.floor(cooldown.value / 60)).padStart(2, '0')
  const ss = String(cooldown.value % 60).padStart(2, '0')
  return `Reenviar em ${mm}:${ss}`
})

function onlyDigits (val) {
  form.code = String(val || '').replace(/\D+/g, '').slice(0, 6)
}

async function pasteFromClipboard () {
  try {
    const txt = await navigator.clipboard.readText()
    if (!txt) return
    // tenta colar no campo de código se tiver 6 dígitos; senão assume que é token
    const digits = txt.replace(/\D+/g, '')
    if (digits.length === 6) {
      form.code = digits
      $q.notify({ type: 'info', message: 'Código colado da área de transferência' })
    } else {
      form.token = txt.trim()
      $q.notify({ type: 'info', message: 'Token colado da área de transferência' })
    }
  } catch {
    $q.notify({ type: 'warning', message: 'Não foi possível acessar a área de transferência.' })
  }
}

onMounted(() => {
  // carrega o token da URL se existir
  const t = route.query.token
  form.email = route.query.email
  if (t && typeof t === 'string') {
    form.token = t
  }

  if(!t) {
    goLogin()
  }
  console.log(form)
})

async function onSubmit () {
  const ok = await formRef.value.validate()
  if (!ok) return

  if (!form.token) {
    $q.notify({ type: 'warning', message: 'Token ausente. Abra o link do e-mail ou cole o token.' })
    return
  }

  loading.value = true
  try {
    // Chama sua API de validação
    // Esperado no back: POST /auth/verify-account  { token, code }
    const resp = await auth.validateAccount({ token: form.token, code: form.code })

    if (resp.ok) {
      router.replace({ path: '/login' })
    }
  } catch (err) {
    const msg = err?.response?.data?.message || 'Falha ao validar conta. Verifique o token e o código.'
    $q.notify({ type: 'negative', message: msg })
  } finally {
    loading.value = false
  }
}

function startCooldown (seconds = 60) {
  // evita múltiplos timers
  if (cooldownTimer) clearInterval(cooldownTimer)
  cooldown.value = seconds
  cooldownTimer = setInterval(() => {
    cooldown.value = Math.max(0, cooldown.value - 1)
    if (cooldown.value === 0 && cooldownTimer) {
      clearInterval(cooldownTimer)
      cooldownTimer = null
    }
  }, 1000)
}

onUnmounted(() => {
  if (cooldownTimer) clearInterval(cooldownTimer)
})

// Inicia cooldown se quiser bloquear reenvio logo ao entrar na tela
startCooldown(60)

async function resend () {
  if (resendDisabled.value) {
    $q.notify({ type: 'info', message: 'Aguarde 1 minuto para reenviar o código.' })
    return
  }

  loading.value = true
  try {
    // chama o store (ele retorna { ok, token })
    const r = await auth.resendVerification(form.email)
    if (r?.ok) {
      // ✅ atualiza o token local para que a validação use o NOVO token
      if (r.token) {
        form.token = r.token
        // opcional: atualiza a URL para refletir o novo token
        router.replace({ query: { ...route.query, token: r.token } })
      }
      // inicia o cooldown de 60s
      startCooldown(60)
    }
  } catch (err) {
    const msg = err?.response?.data?.message || 'Não foi possível reenviar o código.'
    $q.notify({ type: 'negative', message: msg })
  } finally {
    loading.value = false
  }
}

function goLogin () {
  router.replace({ path: '/login' })
}
</script>

<style scoped>
/* Reaproveitando a base visual */
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
.metrics { gap: 10px; }
</style>
