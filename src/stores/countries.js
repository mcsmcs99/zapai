// src/stores/countries.js
import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'
import { Notify } from 'quasar'

export const useCountriesStore = defineStore('countries', {
  state: () => ({
    items: [],
    loading: false,
    error: null
  }),

  actions: {
    /**
     * Busca países na API
     * Aceita opcionalmente filtros/paginação:
     *  - status: 'active' | 'inactive'
     *  - q: string (busca por nome)
     *  - page, pageSize, order, dir
     */
    async fetchCountries (params = {}) {
      this.loading = true
      this.error = null

      try {
        const { data } = await api.get('/countries', { params })

        // se o controller responde { data: [...] }
        this.items = Array.isArray(data?.data) ? data.data : (data || [])

        return this.items
      } catch (err) {
        const msg = err?.response?.data?.message || 'Não foi possível carregar a lista de países.'
        this.error = msg
        Notify.create({ type: 'negative', message: msg })
        return []
      } finally {
        this.loading = false
      }
    },

    /**
     * Opcional: buscar um país específico por id ou name
     */
    async fetchCountryByIdOrName (idOrName) {
      if (!idOrName) return null

      this.loading = true
      this.error = null

      try {
        const { data } = await api.get(`/countries/${idOrName}`)
        return data?.data || data
      } catch (err) {
        const msg = err?.response?.data?.message || 'Não foi possível carregar o país.'
        this.error = msg
        Notify.create({ type: 'negative', message: msg })
        return null
      } finally {
        this.loading = false
      }
    }
  }
})
