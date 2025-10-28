import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'
import { Notify } from 'quasar'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('auth_token') || null,
    user: JSON.parse(localStorage.getItem('auth_user') || 'null'),
    loading: false
  }),

  getters: {
    isAuthenticated: (s) => !!s.token,
    userId: (s) => s.user?.id ?? null
  },

  actions: {
    _saveSession(token, user = null) {
      this.token = token
      localStorage.setItem('auth_token', token)
      if (user) {
        this.user = user
        localStorage.setItem('auth_user', JSON.stringify(user))
      }
    },

    _clearSession() {
      this.token = null
      this.user = null
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    },

    // ===== Cadastro (CRIAR CONTA) =====
    // payload esperado: { name, email, password, ... }
    // retorna { ok: true } em sucesso; se a API devolver token/user já salva a sessão
    async register(payload) {
      this.loading = true
      try {
        const { data } = await api.post('/auth/register', payload)

        // Tente capturar token/user se sua API já logar o usuário ao cadastrar
        const token = data?.token || data?.access_token
        const user  = data?.user || null

        if (token) {
          this._saveSession(token, user || null)
          Notify.create({ type: 'positive', message: 'Conta criada e sessão iniciada!' })
          return { ok: true, token, user: this.user || null, autoLogged: true }
        }

        // Se não veio token, apenas confirma o cadastro
        Notify.create({ type: 'positive', message: 'Conta criada! Faça login para continuar.' })
        return { ok: true, autoLogged: false }
      } catch (err) {
        const msg = err?.response?.data?.message || 'Não foi possível criar a conta.'
        console.error(err)
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.loading = false
      }
    },

    // Login
    async login({ email, password }) {
      this.loading = true
      try {
        const { data } = await api.post('/auth/login', { email, password })
        const token = data?.token || data?.access_token
        if (!token) throw new Error('Token não recebido do servidor')

        this._saveSession(token, data?.user || null)
        Notify.create({ type: 'positive', message: 'Login realizado com sucesso!' })
        return { ok: true, token, user: this.user || null }
      } catch (err) {
        const resp = err?.response
        const code = resp?.data?.error_code

        // 🚧 Conta pendente de verificação de e-mail
        if (resp?.status === 403 && code === 'EMAIL_VERIFICATION_REQUIRED') {
          const message = resp?.data?.message || 'Validação de e-mail pendente.'
          Notify.create({ type: 'warning', message })
          return {
            ok: false,
            needsVerification: true,
            error: message
          }
        }

        // Erros padrão
        const msg = resp?.data?.message || 'Credenciais inválidas'
        console.error(err)
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.loading = false
      }
    },

    // opcional no mesmo store: reenvio do código
    async resendVerification(email) {
      if (!email) {
        Notify.create({ type: 'warning', message: 'email para reenvio ausente.' })
        return { ok: false }
      }
      try {
        const { data } = await api.post('/auth/resend-verification', { email: email })
        Notify.create({ type: 'positive', message: data?.message || 'Código reenviado. Verifique seu e-mail.' })
        return { ok: true , token: data?.token}
      } catch (err) {
        const msg = err?.response?.data?.message || 'Não foi possível reenviar o código.'
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      }
    },


    // --- NOVO: solicitar recuperação de senha (Forgot Password) ---
    async forgotPassword(email) {
      this.loading = true
      try {
        await api.post('/auth/forgot-password', { email })
        // Backend responde sempre genérico por segurança
        Notify.create({ type: 'positive', message: 'Se o e-mail existir, enviaremos um link de recuperação.' })
        return { ok: true }
      } catch (err) {
        // Mesmo em erro de rede, mantenha mensagem genérica
        console.error(err)
        Notify.create({ type: 'positive', message: 'Se o e-mail existir, enviaremos um link de recuperação.' })
        return { ok: false, error: 'Não foi possível processar agora.' }
      } finally {
        this.loading = false
      }
    },

    // --- NOVO: redefinir senha com token ---
    async resetPassword({ token, password }) {
      this.loading = true
      try {
        await api.post('/auth/reset-password', { token, password })
        Notify.create({ type: 'positive', message: 'Senha redefinida com sucesso!' })
        return { ok: true }
      } catch (err) {
        const msg = err?.response?.data?.message || 'Token inválido ou expirado.'
        console.error(err)
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.loading = false
      }
    },

    async validateAccount({ token, code }) {
      this.loading = true
      try {
        await api.post('/auth/validate-account', { token, code })
        Notify.create({ type: 'positive', message: 'Conta validada com sucesso!' })
        return { ok: true }
      } catch (err) {
        const msg = err?.response?.data?.message || 'Token inválido ou expirado.'
        console.error(err)
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.loading = false
      }
    },

    async fetchUser(id) {
      if (!this.token) throw new Error('Sem token. Faça login.')
      const { data } = await api.get(`/users/${id}`)
      this.user = data
      localStorage.setItem('auth_user', JSON.stringify(data))
      return data
    },

    async fetchMe() {
      if (!this.token) return null
      try {
        const { data } = await api.get('/users/me')
        this.user = data
        localStorage.setItem('auth_user', JSON.stringify(data))
        return data
      } catch {
        this.logout(true)
        return null
      }
    },

    logout(silent = false) {
      this._clearSession()
      if (!silent) {
        Notify.create({ message: 'Sessão encerrada', color: 'primary' })
      }
    }
  }
})
