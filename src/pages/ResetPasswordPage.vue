<template>
  <q-page class="login-page">
    <div class="center-wrap">
      <div class="content grid">
        <!-- Lado “marketing”, igual ao seu padrão -->
        <section class="hero column justify-between">
          <div>
            <div class="hero-title">Redefinir senha</div>
            <div class="hero-subtitle">
              Crie uma nova senha para sua conta. O link é temporário.
            </div>
          </div>

          <div class="metrics row q-col-gutter-md">
            <q-card flat bordered class="metric-card col-12">
              <div class="row items-start q-gutter-sm">
                <q-avatar size="36px" color="positive" text-color="white" icon="lock_reset" />
                <div class="col">
                  <div class="metric-title">Link temporário</div>
                  <div class="metric-desc">Por segurança, o link expira em poucos minutos.</div>
                </div>
              </div>
            </q-card>
          </div>
        </section>

        <!-- Card de redefinição -->
        <section class="login-card-wrapper">
          <q-card flat bordered class="login-card">
            <div class="q-pa-lg">
              <div class="text-h6 q-mb-xs">Defina sua nova senha</div>
              <div class="text-caption text-secondary q-mb-md">
                A senha deve ter pelo menos 6 caracteres.
              </div>

              <q-form ref="formRef" @submit.prevent="onSubmit">
                <div class="q-gutter-md">
                  <q-input
                    v-model="password"
                    :type="showPass ? 'text' : 'password'"
                    label="Nova senha"
                    dense outlined
                    :rules="[rules.required, rules.min6]"
                    :disable="loading"
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
                    v-model="password2"
                    :type="showPass ? 'text' : 'password'"
                    label="Confirmar senha"
                    dense outlined
                    :rules="[rules.required, samePassword]"
                    :disable="loading"
                    lazy-rules="ondemand"
                  >
                    <template #prepend><q-icon name="lock" /></template>
                  </q-input>

                  <q-btn
                    type="submit"
                    color="positive"
                    label="Redefinir senha"
                    class="full-width"
                    unelevated
                    :loading="loading"
                  >
                    <template #loading>
                      <q-spinner class="q-mr-sm" /> Salvando...
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
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const formRef = ref(null)
const loading = ref(false)
const showPass = ref(false)
const password = ref('')
const password2 = ref('')

// token vem por query string (link enviado por e-mail)
const token = computed(() => String(route.query.token || ''))

const rules = {
  required: v => (!!v || v === 0) || 'Campo obrigatório',
  min6: v => String(v || '').length >= 6 || 'Mínimo de 6 caracteres'
}
const samePassword = v => v === password.value || 'As senhas não conferem'

async function onSubmit () {
  const ok = await formRef.value.validate()
  if (!ok) return

  if (!token.value) {
    $q.notify({ type: 'negative', message: 'Link inválido ou ausente.' })
    return
  }

  loading.value = true
  try {
    const res = await auth.resetPassword({ token: token.value, password: password.value })
    if (res.ok) {
      // Notify já é feito no store; aqui garantimos navegação
      router.replace({ path: '/login' })
    } else {
      // Caso queira exibir a msg retornada pelo store:
      if (res.error) $q.notify({ type: 'negative', message: res.error })
    }
  } finally {
    loading.value = false
  }
}

function goLogin () {
  router.replace({ path: '/login' })
}
</script>

<style scoped>
.login-page { min-height: 100vh; background: var(--q-color-grey-2); }
.center-wrap { min-height: 100vh; display: grid; place-items: center; padding: 16px; }
.content.grid { width: 100%; max-width: 1100px; display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 18px; }
@media (max-width: 1024px) { .content.grid { grid-template-columns: 1fr; } }
.hero { background: white; border: 1px solid var(--q-color-grey-4); border-radius: 16px; padding: 18px; min-height: 420px; }
.hero-title { font-size: 28px; font-weight: 700; margin-bottom: 6px; }
.hero-subtitle { color: var(--q-color-grey-7); margin-bottom: 14px; }
.metric-card { border-radius: 14px; padding: 14px; }
.metric-title { font-size: 14px; font-weight: 600; }
.metric-desc { font-size: 12px; color: var(--q-color-grey-7); margin-top: 2px; }
.login-card-wrapper { display: flex; flex-direction: column; align-items: stretch; }
.login-card { border-radius: 16px; background: white; }
.full-width { width: 100%; }
</style>
