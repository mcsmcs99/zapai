// src/stores/onboarding.js
import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'
import { Notify } from 'quasar'

const KEY = 'onboarding_state'

export const useOnboardingStore = defineStore('onboarding', {
  state: () => ({
    step: 1,
    loading: false,
    company: {
      id: null,
      unique_key: '',
      document_type: 'cnpj',
      document_number: '',
      company_name: '',
      company_fantasy_name: '',
      phone_fix: '',
      phone_cellular: '',
      link_instagram: '',
      link_facebook: '',
      link_whatsapp: '',
      tenant_id: null,
      status: 'active'
    },
    plan: null,
    payment: { type: 'pix' } // padrão
  }),

  actions: {
    setCompanyField (key, val) {
      if (key in this.company) this.company[key] = val
      this.saveToSession()
    },
    selectPlan (plan) {
      this.plan = plan
      this.saveToSession()
    },
    setPaymentType (type) {
      this.payment.type = type || 'pix'
      this.saveToSession()
    },

    reset () {
      this.step = 1
      this.loading = false
      this.company = {
        id: null,
        unique_key: '',
        document_type: 'cnpj',
        document_number: '',
        company_name: '',
        company_fantasy_name: '',
        phone_fix: '',
        phone_cellular: '',
        link_instagram: '',
        link_facebook: '',
        link_whatsapp: '',
        tenant_id: null,
        status: 'active'
      }
      this.plan = null
      this.payment = { type: 'pix' }
      this.clearSession()
    },

    saveToSession () {
      const payload = {
        step: this.step,
        company: this.company,
        plan: this.plan,
        payment: this.payment
      }
      sessionStorage.setItem(KEY, JSON.stringify(payload))
    },

    async loadFromSession () {
      const raw = sessionStorage.getItem(KEY)

      if (raw) {
        try {
          const data = JSON.parse(raw)
          if (data.step) this.step = Number(data.step) || 1
          if (data.company) this.company = { ...this.company, ...data.company }
          if (data.plan) this.plan = data.plan
          if (data.payment) this.payment = { ...this.payment, ...data.payment }
        } catch (e) {
          console.error(e)
        }
      }

      // Se depois de carregar a sessão ainda não tiver "empresa de verdade",
      // busca no backend para hidratar this.company
      const hasMinimalCompany =
        !!this.company.id && !!this.company.document_number

      if (!hasMinimalCompany) {
        await this.fetchCompanyFromApi()
      }
    },

    clearSession () {
      sessionStorage.removeItem(KEY)
    },

    /**
     * Chamada final do onboarding (APENAS no checkout)
     * Envia: { company, plan, payment }
     * Backend agora assume company.id como group_id
     */
    async finalizeCheckout () {
      console.log(this.plan)
      if (!this.plan?.id && !this.plan?.unique_key) {
        Notify.create({ type: 'warning', message: 'Selecione um plano antes de continuar.' })
        return { ok: false }
      }
      if (!this.company.company_name || !this.company.document_number) {
        Notify.create({ type: 'warning', message: 'Preencha os dados da empresa antes de continuar.' })
        return { ok: false }
      }
      if (!this.company?.id) {
        Notify.create({ type: 'warning', message: 'Houve um problema com os dados da empresa. Tente voltar e salvar novamente.' })
        return { ok: false }
      }

      this.loading = true
      try {
        const payload = {
          company: this.company, // contém o id usado como group_id no back
          plan: { id: this.plan.id, unique_key: this.plan.unique_key },
          payment: this.payment
        }

        const { data } = await api.post('/onboarding/complete', payload)
        this.clearSession()
        Notify.create({ type: 'positive', message: data?.message || 'Onboarding concluído!' })
        return { ok: true, data }
      } catch (err) {
        const msg = err?.response?.data?.message || 'Não foi possível concluir o onboarding.'
        console.error(err)
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.loading = false
      }
    },

    /**
     * Salva os dados da empresa (group) no backend e hidrata this.company
     */
    async saveCompany () {
      try {
        const payload = { company: this.company }
        const { data } = await api.post('/onboarding/company', payload)

        const companyFromApi = data.company || data.group || null

        if (companyFromApi) {
          this.company = {
            ...this.company,
            ...companyFromApi
          }
          this.saveToSession()
        }

        return { ok: true, data }
      } catch (err) {
        const msg = err?.response?.data?.message || 'Erro ao salvar dados da empresa.'
        console.error(err)
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      }
    },

    async fetchCompanyFromApi () {
      try {
        const { data } = await api.get('/onboarding/company')

        if (data?.company) {
          this.company = {
            ...this.company,
            ...data.company
          }
          this.saveToSession()
          return { ok: true, data }
        }

        return { ok: false }
      } catch (err) {
        console.error('Erro ao carregar empresa do backend', err)
        // sem Notify aqui pra não encher o usuário de erro em background
        return { ok: false, error: err }
      }
    }

  }
})
