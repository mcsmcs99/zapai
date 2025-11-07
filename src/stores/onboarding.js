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
    // utilitários de edição rápida
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

    loadFromSession () {
      const raw = sessionStorage.getItem(KEY)
      if (!raw) return
      try {
        const data = JSON.parse(raw)
        if (data.step) this.step = Number(data.step) || 1
        if (data.company) this.company = { ...this.company, ...data.company }
        if (data.plan) this.plan = data.plan
        if (data.payment) this.payment = { ...this.payment, ...data.payment }
      } catch (e) {
        console.error(e)
      }
    },

    clearSession () {
      sessionStorage.removeItem(KEY)
    },

    /**
     * Chamada final do onboarding (APENAS no checkout)
     * Envia: { company, plan, payment }
     * Backend: POST /onboarding/complete  (protegido por auth)
     */
    async finalizeCheckout () {
      // validações mínimas antes de enviar
      console.log(this.plan)
      if (!this.plan?.id && !this.plan?.unique_key) {
        Notify.create({ type: 'warning', message: 'Selecione um plano antes de continuar.' })
        return { ok: false }
      }
      if (!this.company.company_name || !this.company.document_number) {
        Notify.create({ type: 'warning', message: 'Preencha os dados da empresa antes de continuar.' })
        return { ok: false }
      }

      this.loading = true
      try {
        const payload = {
          company: this.company,
          plan: { id: this.plan.id, unique_key: this.plan.unique_key },
          payment: this.payment   // { type: 'pix' | 'credit_card' | 'billet', ... }
        }

        const { data } = await api.post('/onboarding/complete', payload)
        // sucesso → limpar o estado do onboarding, mas você pode manter se quiser
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
    }
  }
})
