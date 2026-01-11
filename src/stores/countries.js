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
     *
     * Retorno esperado:
     *  [{ id, name, iso2, status, created_at, updated_at }]
     */
    async fetchCountries (params = {}) {
      this.loading = true
      this.error = null

      try {
        const { data } = await api.get('/countries', { params })

        // se o controller responde { data: [...] }
        const rows = Array.isArray(data?.data) ? data.data : (data || [])

        // ✅ mantém igual, apenas garante iso2 padronizado (opcional)
        this.items = rows.map(c => ({
          ...c,
          iso2: c?.iso2 ? String(c.iso2).toUpperCase() : c?.iso2
        }))

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
     * Retorno esperado:
     *  { id, name, iso2, status, created_at, updated_at }
     */
    async fetchCountryByIdOrName (idOrName) {
      if (!idOrName) return null

      this.loading = true
      this.error = null

      try {
        const { data } = await api.get(`/countries/${idOrName}`)
        const country = data?.data || data

        // ✅ idem (opcional)
        if (country?.iso2) country.iso2 = String(country.iso2).toUpperCase()

        return country
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
