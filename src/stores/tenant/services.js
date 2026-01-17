// src/stores/tenant/services.js
import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'
import { Notify } from 'quasar'
import { useAuthStore } from 'src/stores/auth'

const KEY = 'services_state'

function parseIds (raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.map(Number).filter(n => Number.isFinite(n))

  if (typeof raw === 'string') {
    try {
      const j = JSON.parse(raw)
      if (Array.isArray(j)) return j.map(Number).filter(n => Number.isFinite(n))
    } catch {
      // ignore
    }

    return raw
      .split(',')
      .map(s => Number(String(s).trim()))
      .filter(n => Number.isFinite(n))
  }

  return []
}

function uniqIds (arr) {
  return [...new Set(parseIds(arr))]
}

function normalizeIcon (raw) {
  if (typeof raw === 'string' && raw) return raw
  if (raw && typeof raw === 'object' && raw.value) return raw.value
  return 'content_cut'
}

export const useServicesStore = defineStore('services', {
  state: () => ({
    loadingList: false,
    loadingItem: false,
    saving: false,
    deleting: false,

    services: [],
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
      icon: 'content_cut',
      price: 0,
      duration: 30,
      description: '',
      status: 'active',
      collaboratorIds: [],
      unitIds: [] // NEW
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
        if (key === 'icon') this.currentService[key] = normalizeIcon(val)
        else this.currentService[key] = val

        this.saveToSession()
      }
    },

    setCurrentService (serviceData = {}) {
      this.currentService = {
        id: serviceData.id ?? null,
        title: serviceData.title ?? '',
        icon: normalizeIcon(serviceData.icon),
        price: serviceData.price ?? 0,
        duration: serviceData.duration ?? 30,
        description: serviceData.description ?? '',
        status: serviceData.status || 'active',

        collaboratorIds: uniqIds(serviceData.collaboratorIds ?? serviceData.collaborator_ids),

        // NEW: vem do backend via pivot (array)
        unitIds: uniqIds(serviceData.unitIds ?? serviceData.unit_ids)
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
        icon: 'content_cut',
        price: 0,
        duration: 30,
        description: '',
        status: 'active',
        collaboratorIds: [],
        unitIds: []
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
          this.meta = { ...this.meta, ...data.meta }
        }
        if (data.filters) {
          this.filters = { ...this.filters, ...data.filters }
        }
        if (data.currentService) {
          this.currentService = { ...this.currentService, ...data.currentService }
          this.currentService.icon = normalizeIcon(this.currentService.icon)
          this.currentService.collaboratorIds = uniqIds(this.currentService.collaboratorIds)
          this.currentService.unitIds = uniqIds(this.currentService.unitIds)
        }
      } catch (e) {
        console.error('Erro ao carregar services_state da sessão', e)
      }
    },

    clearSession () {
      sessionStorage.removeItem(KEY)
    },

    // ---------------------------------------------------
    // Payload normalizer (nova lógica)
    // ---------------------------------------------------
    normalizeServicePayload (payload = {}) {
      const out = { ...payload }

      out.icon = normalizeIcon(out.icon)

      // collaborators
      if ('collaborator_ids' in out && out.collaboratorIds === undefined) {
        out.collaboratorIds = out.collaborator_ids
      }
      if ('collaborator_ids' in out) delete out.collaborator_ids
      if ('collaboratorIds' in out) out.collaboratorIds = uniqIds(out.collaboratorIds)

      if ('unit_ids' in out && out.unitIds === undefined) {
        out.unitIds = out.unit_ids
      }
      if ('unit_ids' in out) delete out.unit_ids
      if ('unitIds' in out) out.unitIds = uniqIds(out.unitIds)

      return out
    },

    // CRUD ---------------------------------------------

    async fetchServices (params = {}) {
      this.loadingList = true

      try {
        const userId = this.getCurrentUserId()
        const groupId = this.getCurrentGroupId()

        const query = {
          page: params.page || this.meta.page,
          limit: params.limit || this.meta.limit,
          user_id: userId,
          group_id: groupId
        }

        const status = params.status ?? this.filters.status
        const search = params.search ?? this.filters.search

        if (status) query.status = status
        if (search) query.search = search

        const { data } = await api.get('/tenant/services', { params: query })

        this.services = (data.data || []).map(s => ({
          ...s,
          icon: normalizeIcon(s.icon),
          collaboratorIds: uniqIds(s.collaboratorIds ?? s.collaborator_ids),
          unitIds: uniqIds(s.unitIds ?? s.unit_ids)
        }))

        if (data.meta) {
          this.meta = { ...this.meta, ...data.meta }
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

    async fetchServiceById (id) {
      if (!id) return { ok: false, error: 'ID inválido para buscar serviço.' }

      this.loadingItem = true
      try {
        const userId = this.getCurrentUserId()
        const groupId = this.getCurrentGroupId()

        const { data } = await api.get(`/tenant/services/${id}`, {
          params: { user_id: userId, group_id: groupId }
        })

        const normalized = {
          ...data,
          icon: normalizeIcon(data.icon),
          collaboratorIds: uniqIds(data.collaboratorIds ?? data.collaborator_ids),
          unitIds: uniqIds(data.unitIds ?? data.unit_ids)
        }

        this.currentService = { ...this.currentService, ...normalized }

        const index = this.services.findIndex(s => s.id === normalized.id)
        if (index !== -1) this.services.splice(index, 1, normalized)

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

        const payload = this.normalizeServicePayload({
          ...this.currentService
        })

        let resp
        if (isEdit) {
          resp = await api.put(`/tenant/services/${this.currentService.id}`, payload, {
            params: { user_id: userId, group_id: groupId }
          })
        } else {
          resp = await api.post('/tenant/services', payload, {
            params: { user_id: userId, group_id: groupId }
          })
        }

        const data = resp.data

        const normalized = {
          ...data,
          icon: normalizeIcon(data.icon),
          collaboratorIds: uniqIds(data.collaboratorIds ?? data.collaborator_ids),
          unitIds: uniqIds(data.unitIds ?? data.unit_ids)
        }

        this.currentService = { ...this.currentService, ...normalized }

        const index = this.services.findIndex(s => s.id === normalized.id)
        if (index !== -1) {
          this.services.splice(index, 1, normalized)
        } else {
          this.services.unshift(normalized)
        }

        this.saveToSession()

        Notify.create({
          type: 'positive',
          message: isEdit ? 'Serviço atualizado com sucesso.' : 'Serviço criado com sucesso.'
        })

        return { ok: true, data: normalized }
      } catch (err) {
        console.error('Erro ao salvar serviço:', err)
        const msg =
          err?.response?.data?.message ||
          (this.currentService.id ? 'Erro ao atualizar serviço.' : 'Erro ao criar serviço.')
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.saving = false
      }
    },

    async updateService (id, patch = {}) {
      if (!id) {
        const msg = 'ID inválido para atualizar serviço.'
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      }

      this.saving = true
      try {
        const userId = this.getCurrentUserId()
        const groupId = this.getCurrentGroupId()

        if (!groupId) {
          const msg = 'Nenhum grupo selecionado para atualizar serviço.'
          Notify.create({ type: 'negative', message: msg })
          return { ok: false, error: msg }
        }

        const payload = this.normalizeServicePayload({ ...patch })

        const resp = await api.put(`/tenant/services/${id}`, payload, {
          params: { user_id: userId, group_id: groupId }
        })

        const data = resp.data

        const normalized = {
          ...data,
          icon: normalizeIcon(data.icon),
          collaboratorIds: uniqIds(data.collaboratorIds ?? data.collaborator_ids),
          unitIds: uniqIds(data.unitIds ?? data.unit_ids)
        }

        const idx = this.services.findIndex(s => s.id === normalized.id)
        if (idx !== -1) this.services.splice(idx, 1, normalized)

        if (this.currentService?.id === normalized.id) {
          this.currentService = { ...this.currentService, ...normalized }
        }

        this.saveToSession()
        return { ok: true, data: normalized }
      } catch (err) {
        console.error('Erro ao atualizar serviço:', err)
        const msg = err?.response?.data?.message || 'Erro ao atualizar serviço.'
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.saving = false
      }
    },

    async deleteService (id) {
      if (!id) return { ok: false, error: 'ID inválido para excluir serviço.' }

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
        Notify.create({ type: 'positive', message: 'Serviço removido com sucesso.' })

        return { ok: true, data }
      } catch (err) {
        console.error('Erro ao excluir serviço:', err)
        const msg = err?.response?.data?.message || 'Erro ao excluir serviço.'
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.deleting = false
      }
    }
  }
})
