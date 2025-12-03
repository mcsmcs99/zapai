// src/stores/groups.js
import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'
import { Notify } from 'quasar'
import { useAuthStore } from 'src/stores/auth' // <-- importante

const KEY = 'groups_state'

export const useGroupsStore = defineStore('groups', {
  state: () => ({
    loadingList: false,
    loadingItem: false,
    saving: false,

    groups: [],
    meta: {
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1
    },

    filters: {
      status: '',
      tenant_id: null,
      search: ''
    },

    currentGroup: {
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
      country_id: null,
      status: 'active'
    }
  }),

  actions: {
    // helper interno pra pegar user_id sempre do auth
    getCurrentUserId () {
      const auth = useAuthStore()
      return auth?.user?.id || auth?.currentUser?.id || null
    },

    setCurrentGroupField (key, val) {
      if (key in this.currentGroup) {
        this.currentGroup[key] = val
        this.saveToSession()
      }
    },

    setFilter (key, val) {
      if (key in this.filters) {
        this.filters[key] = val
        this.saveToSession()
      }
    },

    setPage (page) {
      this.meta.page = Number(page) || 1
      this.saveToSession()
    },

    setLimit (limit) {
      this.meta.limit = Number(limit) || 20
      this.saveToSession()
    },

    resetCurrentGroup () {
      this.currentGroup = {
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
        country_id: null,
        status: 'active'
      }
      this.saveToSession()
    },

    reset () {
      this.loadingList = false
      this.loadingItem = false
      this.saving = false

      this.groups = []
      this.meta = {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1
      }

      this.filters = {
        status: '',
        tenant_id: null,
        search: ''
      }

      this.resetCurrentGroup()
      this.clearSession()
    },

    saveToSession () {
      const payload = {
        meta: this.meta,
        filters: this.filters,
        currentGroup: this.currentGroup
      }
      sessionStorage.setItem(KEY, JSON.stringify(payload))
    },

    loadFromSession () {
      const raw = sessionStorage.getItem(KEY)
      if (!raw) return

      try {
        const data = JSON.parse(raw)
        if (data.meta) {
          this.meta = {
            ...this.meta,
            ...data.meta
          }
        }
        if (data.filters) {
          this.filters = {
            ...this.filters,
            ...data.filters
          }
        }
        if (data.currentGroup) {
          this.currentGroup = {
            ...this.currentGroup,
            ...data.currentGroup
          }
        }
      } catch (e) {
        console.error('Erro ao carregar groups_state da sessão', e)
      }
    },

    clearSession () {
      sessionStorage.removeItem(KEY)
    },

    /**
     * Lista grupos (empresas)
     * Sempre inclui user_id automaticamente
     */
    async fetchGroups (params = {}) {
      this.loadingList = true

      try {
        const userId = this.getCurrentUserId()
        if (!userId) {
          console.warn('Nenhum user_id encontrado no auth store.')
        }

        const query = {
          page: params.page || this.meta.page,
          limit: params.limit || this.meta.limit,
          user_id: userId // <-- sempre manda
        }

        const status = params.status ?? this.filters.status
        const tenantId = params.tenant_id ?? this.filters.tenant_id
        const search = params.search ?? this.filters.search

        if (status) query.status = status
        if (tenantId) query.tenant_id = tenantId
        if (search) query.search = search

        const { data } = await api.get('/groups', { params: query })

        this.groups = data.data || []
        if (data.meta) {
          this.meta = {
            ...this.meta,
            ...data.meta
          }
        } else {
          this.meta.total = this.groups.length
          this.meta.totalPages = 1
        }

        this.saveToSession()

        return { ok: true, data }
      } catch (err) {
        console.error('Erro ao buscar grupos:', err)
        const msg = err?.response?.data?.message || 'Erro ao carregar lista de empresas.'
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.loadingList = false
      }
    },

    /**
     * Busca uma empresa (group) específica por ID
     * Sempre inclui user_id automaticamente
     */
    async fetchGroupById (id) {
      if (!id) {
        return { ok: false, error: 'ID inválido para buscar empresa.' }
      }

      this.loadingItem = true
      try {
        const userId = this.getCurrentUserId()
        const { data } = await api.get(`/groups/${id}`, {
          params: { user_id: userId } // <-- sempre manda
        })

        this.currentGroup = {
          ...this.currentGroup,
          ...data
        }

        const index = this.groups.findIndex(g => g.id === data.id)
        if (index !== -1) {
          this.groups.splice(index, 1, data)
        }

        this.saveToSession()

        return { ok: true, data }
      } catch (err) {
        console.error('Erro ao buscar empresa por ID:', err)
        const msg = err?.response?.data?.message || 'Erro ao carregar dados da empresa.'
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.loadingItem = false
      }
    },

    /**
     * Atualiza a empresa atual (currentGroup) no backend
     * Sempre inclui user_id automaticamente
     */
    async updateCurrentGroup () {
      if (!this.currentGroup.id) {
        return { ok: false, error: 'Nenhuma empresa selecionada para atualizar.' }
      }

      this.saving = true
      try {
        const userId = this.getCurrentUserId()

        const payload = {
          ...this.currentGroup,
          user_id: userId // também no body, se o back quiser validar aqui
        }

        const { data } = await api.put(
          `/groups/${this.currentGroup.id}`,
          payload,
          { params: { user_id: userId } } // e também como query param
        )

        this.currentGroup = {
          ...this.currentGroup,
          ...data
        }

        const index = this.groups.findIndex(g => g.id === data.id)
        if (index !== -1) {
          this.groups.splice(index, 1, data)
        }

        this.saveToSession()
        Notify.create({ type: 'positive', message: 'Empresa atualizada com sucesso.' })

        return { ok: true, data }
      } catch (err) {
        console.error('Erro ao atualizar empresa:', err)
        const msg = err?.response?.data?.message || 'Erro ao atualizar dados da empresa.'
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.saving = false
      }
    }
  }
})
