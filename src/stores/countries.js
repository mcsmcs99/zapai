// src/stores/countries.js
import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'
import { Notify } from 'quasar'

export const useCountriesStore = defineStore('countries', {
  state: () => ({
    items: [],
    loading: false,
    error: null,

    // ✅ options por country_id (cache)
    optionsByCountryId: {},

    // ✅ loading/erro específico dos options
    optionsLoading: false,
    optionsError: null
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
    },

    /**
     * ✅ Busca locales e currencies compatíveis com um país
     * GET /countries/:id/options
     *
     * Retorno esperado do backend:
     * {
     *   data: {
     *     locales: [{ id, code, name }],
     *     currencies: [{ id, code, name, symbol }],
     *     defaults: { locale_id, currency_id }
     *   }
     * }
     */
    async fetchCountryOptions (countryId, { useCache = true } = {}) {
      if (!countryId) return { locales: [], currencies: [], defaults: {} }

      // cache
      if (useCache && this.optionsByCountryId[countryId]) {
        return this.optionsByCountryId[countryId]
      }

      this.optionsLoading = true
      this.optionsError = null

      try {
        const { data } = await api.get(`/countries/${countryId}/options`)

        const payload = data?.data || {}
        const locales = Array.isArray(payload.locales) ? payload.locales : []
        const currencies = Array.isArray(payload.currencies) ? payload.currencies : []
        const defaults = payload.defaults || {}

        const normalized = { locales, currencies, defaults }
        this.optionsByCountryId[countryId] = normalized

        return normalized
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          'Não foi possível carregar locales e moedas para este país.'
        this.optionsError = msg
        Notify.create({ type: 'negative', message: msg })
        return { locales: [], currencies: [], defaults: {} }
      } finally {
        this.optionsLoading = false
      }
    },

    // opcional: se quiser forçar refresh
    clearCountryOptionsCache (countryId = null) {
      if (countryId) {
        delete this.optionsByCountryId[countryId]
        return
      }
      this.optionsByCountryId = {}
    }
  }
})
