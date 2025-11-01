// src/stores/onboarding.js
import { defineStore } from 'pinia'

const KEY = 'onboarding_state'

export const useOnboardingStore = defineStore('onboarding', {
  state: () => ({
    step: 1,
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
    plan: null
  }),
  actions: {
    reset () {
      this.step = 1
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
    },
    saveToSession () {
      const payload = {
        step: this.step,
        company: this.company,
        plan: this.plan
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
      } catch (e) {
        console.error(e)
      }
    },
    clearSession () {
      sessionStorage.removeItem(KEY)
    }
  }
})
