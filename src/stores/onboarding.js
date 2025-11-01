// src/stores/onboarding.js
import { defineStore } from 'pinia'

export const useOnboardingStore = defineStore('onboarding', {
  state: () => ({
    step: 1,
    company: {
      id: null,
      unique_key: '',
      document_type: null,
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
        document_type: null,
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
    }
  }
})
