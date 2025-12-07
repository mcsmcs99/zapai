// src/stores/tenant/services.js
import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'
import { Notify } from 'quasar'
import { useAuthStore } from 'src/stores/auth'

const KEY = 'services_state'

export const useServicesStore = defineStore('services', {
  state: () => ({
    loadingList: false,
    loadingItem: false,
    saving: false,
    deleting: false,

    services: [], // lista de serviços
    meta: {
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1
    },

    filters: {
      status: '',
      search: ''
    },

    currentService: {
      id: null,
      title: '',
      price: 0,
      duration: 30,
      description: '',
      status: 'active',
      collaboratorIds: [] // IDs de colaboradores que podem executar o serviço
    }
  }),

  actions: {
    // helpers internos ---------------------------------
    getCurrentUserId () {
      const auth = useAuthStore()
      return auth?.user?.id || null
    },

    getCurrentGroupId () {
      const auth = useAuthStore()
      return auth?.user?.current_group_id || null
    },

    // state helpers ------------------------------------
    setCurrentServiceField (key, val) {
      if (key in this.currentService) {
        this.currentService[key] = val
        this.saveToSession()
      }
    },

    setCurrentService (serviceData = {}) {
      this.currentService = {
        id: serviceData.id ?? null,
        title: serviceData.title ?? '',
        price: serviceData.price ?? 0,
        duration: serviceData.duration ?? 30,
        description: serviceData.description ?? '',
        status: serviceData.status || 'active',
        collaboratorIds: serviceData.collaboratorIds || serviceData.collaborator_ids || []
      }
      this.saveToSession()
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

    resetCurrentService () {
      this.currentService = {
        id: null,
        title: '',
        price: 0,
        duration: 30,
        description: '',
        status: 'active',
        collaboratorIds: []
      }
      this.saveToSession()
    },

    reset () {
      this.loadingList = false
      this.loadingItem = false
      this.saving = false
      this.deleting = false

      this.services = []
      this.meta = {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1
      }

      this.filters = {
        status: '',
        search: ''
      }

      this.resetCurrentService()
      this.clearSession()
    },

    // sessionStorage -----------------------------------
    saveToSession () {
      const payload = {
        meta: this.meta,
        filters: this.filters,
        currentService: this.currentService
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
        if (data.currentService) {
          this.currentService = {
            ...this.currentService,
            ...data.currentService
          }
        }
      } catch (e) {
        console.error('Erro ao carregar services_state da sessão', e)
      }
    },

    clearSession () {
      sessionStorage.removeItem(KEY)
    },

    // CRUD ---------------------------------------------

    /**
     * Lista serviços
     * Sempre inclui user_id e group_id (tenant) automaticamente
     */
    async fetchServices (params = {}) {
      this.loadingList = true

      try {
        const userId = this.getCurrentUserId()
        const groupId = this.getCurrentGroupId()

        if (!groupId) {
          console.warn('Nenhum grupo selecionado ao listar serviços.')
        }

        const query = {
          page: params.page || this.meta.page,
          limit: params.limit || this.meta.limit,
          user_id: userId,
          group_id: groupId // <-- tenant
        }

        const status = params.status ?? this.filters.status
        const search = params.search ?? this.filters.search

        if (status) query.status = status
        if (search) query.search = search

        // ajuste aqui pra bater com tua API: /tenant/services
        const { data } = await api.get('/tenant/services', { params: query })

        this.services = data.data || []
        if (data.meta) {
          this.meta = {
            ...this.meta,
            ...data.meta
          }
        } else {
          this.meta.total = this.services.length
          this.meta.totalPages = 1
        }

        this.saveToSession()

        return { ok: true, data }
      } catch (err) {
        console.error('Erro ao buscar serviços:', err)
        const msg =
          err?.response?.data?.message ||
          'Erro ao carregar lista de serviços.'
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.loadingList = false
      }
    },

    /**
     * Busca um serviço por ID
     * Sempre inclui user_id e group_id (tenant)
     */
    async fetchServiceById (id) {
      if (!id) {
        return { ok: false, error: 'ID inválido para buscar serviço.' }
      }

      this.loadingItem = true
      try {
        const userId = this.getCurrentUserId()
        const groupId = this.getCurrentGroupId()

        const { data } = await api.get(`/tenant/services/${id}`, {
          params: { user_id: userId, group_id: groupId }
        })

        this.currentService = {
          ...this.currentService,
          ...data,
          collaboratorIds: data.collaboratorIds || data.collaborator_ids || []
        }

        const index = this.services.findIndex(s => s.id === data.id)
        if (index !== -1) {
          this.services.splice(index, 1, data)
        }

        this.saveToSession()

        return { ok: true, data }
      } catch (err) {
        console.error('Erro ao buscar serviço por ID:', err)
        const msg =
          err?.response?.data?.message ||
          'Erro ao carregar dados do serviço.'
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.loadingItem = false
      }
    },

    /**
     * Cria ou atualiza o currentService no backend
     * Sempre inclui user_id e group_id (tenant)
     */
    async saveCurrentService () {
      const isEdit = !!this.currentService.id

      this.saving = true
      try {
        const userId = this.getCurrentUserId()
        const groupId = this.getCurrentGroupId()

        if (!groupId) {
          const msg = 'Nenhum grupo selecionado para salvar serviço.'
          Notify.create({ type: 'negative', message: msg })
          return { ok: false, error: msg }
        }

        const payload = {
          ...this.currentService,
          user_id: userId,
          group_id: groupId
        }

        let resp
        if (isEdit) {
          resp = await api.put(
            `/tenant/services/${this.currentService.id}`,
            payload,
            {
              params: { user_id: userId, group_id: groupId }
            }
          )
        } else {
          resp = await api.post(
            '/tenant/services',
            payload,
            {
              params: { user_id: userId, group_id: groupId }
            }
          )
        }

        const data = resp.data

        this.currentService = {
          ...this.currentService,
          ...data,
          collaboratorIds: data.collaboratorIds || data.collaborator_ids || []
        }

        const index = this.services.findIndex(s => s.id === data.id)
        if (index !== -1) {
          this.services.splice(index, 1, data)
        } else {
          this.services.unshift(data)
        }

        this.saveToSession()
        Notify.create({
          type: 'positive',
          message: isEdit
            ? 'Serviço atualizado com sucesso.'
            : 'Serviço criado com sucesso.'
        })

        return { ok: true, data }
      } catch (err) {
        console.error('Erro ao salvar serviço:', err)
        const msg =
          err?.response?.data?.message ||
          (this.currentService.id
            ? 'Erro ao atualizar serviço.'
            : 'Erro ao criar serviço.')
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.saving = false
      }
    },

    /**
     * Remove um serviço
     * Sempre inclui user_id e group_id (tenant)
     */
    async deleteService (id) {
      if (!id) {
        return { ok: false, error: 'ID inválido para excluir serviço.' }
      }

      this.deleting = true
      try {
        const userId = this.getCurrentUserId()
        const groupId = this.getCurrentGroupId()

        const { data } = await api.delete(`/tenant/services/${id}`, {
          params: { user_id: userId, group_id: groupId }
        })

        this.services = this.services.filter(s => s.id !== id)

        if (this.currentService.id === id) {
          this.resetCurrentService()
        }

        this.saveToSession()
        Notify.create({
          type: 'positive',
          message: 'Serviço removido com sucesso.'
        })

        return { ok: true, data }
      } catch (err) {
        console.error('Erro ao excluir serviço:', err)
        const msg =
          err?.response?.data?.message ||
          'Erro ao excluir serviço.'
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.deleting = false
      }
    }
  }
})
