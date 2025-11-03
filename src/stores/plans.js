// src/stores/plans.js
import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'
import { Notify } from 'quasar'

export const usePlansStore = defineStore('plans', {
  state: () => ({
    items: [],
    loading: false,
    error: null
  }),

  actions: {
    async fetchPlans () {
      this.loading = true
      this.error = null
      try {
        // sua API /plans já está protegida por auth no backend
        const { data } = await api.get('/plans')
        // se seu controller responde { data: [...] }
        this.items = Array.isArray(data?.data) ? data.data : (data || [])
        return this.items
      } catch (err) {
        const msg = err?.response?.data?.message || 'Não foi possível carregar os planos.'
        this.error = msg
        Notify.create({ type: 'negative', message: msg })
        return []
      } finally {
        this.loading = false
      }
    }
  }
})
