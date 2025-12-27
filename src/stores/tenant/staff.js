// src/stores/tenant/staff.js
import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'
import { Notify } from 'quasar'
import { useAuthStore } from 'src/stores/auth'

const KEY = 'staff_state'

function createDefaultSchedule () {
  const baseOpen = { closed: false, intervals: [{ start: '08:30', end: '17:30' }] }
  const baseSat = { closed: false, intervals: [{ start: '08:30', end: '15:00' }] }
  const baseClosed = { closed: true, intervals: [] }

  return {
    mon: { ...baseOpen },
    tue: { ...baseOpen },
    wed: { ...baseOpen },
    thu: { ...baseOpen },
    fri: { ...baseOpen },
    sat: { ...baseSat },
    sun: { ...baseClosed }
  }
}

export const useStaffStore = defineStore('staff', {
  state: () => ({
    loadingList: false,
    loadingItem: false,
    saving: false,
    deleting: false,

    staff: [], // lista de colaboradores
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

    currentStaff: {
      id: null,
      name: '',
      role: '',
      photoUrl: '',
      status: 'active',
      schedule: createDefaultSchedule(),
      serviceIds: []
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
    setCurrentStaffField (key, val) {
      if (key in this.currentStaff) {
        this.currentStaff[key] = val
        this.saveToSession()
      }
    },

    setCurrentStaff (staffData = {}) {
      this.currentStaff = {
        id: staffData.id ?? null,
        name: staffData.name ?? '',
        role: staffData.role ?? '',
        photoUrl: staffData.photoUrl ?? '',
        status: staffData.status || 'active',
        schedule: staffData.schedule || createDefaultSchedule(),
        serviceIds: Array.isArray(staffData.serviceIds) ? staffData.serviceIds : []
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

    resetCurrentStaff () {
      this.currentStaff = {
        id: null,
        name: '',
        role: '',
        photoUrl: '',
        status: 'active',
        schedule: createDefaultSchedule(),
        serviceIds: []
      }
      this.saveToSession()
    },

    reset () {
      this.loadingList = false
      this.loadingItem = false
      this.saving = false
      this.deleting = false

      this.staff = []
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

      this.resetCurrentStaff()
      this.clearSession()
    },

    // sessionStorage -----------------------------------
    saveToSession () {
      const payload = {
        meta: this.meta,
        filters: this.filters,
        currentStaff: this.currentStaff
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
        if (data.currentStaff) {
          this.currentStaff = {
            ...this.currentStaff,
            ...data.currentStaff
          }
        }
      } catch (e) {
        console.error('Erro ao carregar staff_state da sessão', e)
      }
    },

    clearSession () {
      sessionStorage.removeItem(KEY)
    },

    // CRUD ---------------------------------------------

    /**
     * Lista colaboradores
     * Sempre inclui user_id e group_id (tenant) automaticamente
     */
    async fetchStaff (params = {}) {
      this.loadingList = true

      try {
        const userId = this.getCurrentUserId()
        const groupId = this.getCurrentGroupId()

        if (!groupId) {
          console.warn('Nenhum grupo selecionado ao listar colaboradores.')
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

        const { data } = await api.get('/tenant/staff', { params: query })

        this.staff = data.data || []
        if (data.meta) {
          this.meta = {
            ...this.meta,
            ...data.meta
          }
        } else {
          this.meta.total = this.staff.length
          this.meta.totalPages = 1
        }

        this.saveToSession()

        return { ok: true, data }
      } catch (err) {
        console.error('Erro ao buscar colaboradores:', err)
        const msg =
          err?.response?.data?.message ||
          'Erro ao carregar lista de colaboradores.'
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.loadingList = false
      }
    },

    /**
     * Busca um colaborador por ID
     * Sempre inclui user_id e group_id (tenant)
     */
    async fetchStaffById (id) {
      if (!id) {
        return { ok: false, error: 'ID inválido para buscar colaborador.' }
      }

      this.loadingItem = true
      try {
        const userId = this.getCurrentUserId()
        const groupId = this.getCurrentGroupId()

        const { data } = await api.get(`/tenant/staff/${id}`, {
          params: { user_id: userId, group_id: groupId }
        })

        this.currentStaff = {
          ...this.currentStaff,
          ...data
        }

        const index = this.staff.findIndex(s => s.id === data.id)
        if (index !== -1) {
          this.staff.splice(index, 1, data)
        }

        this.saveToSession()

        return { ok: true, data }
      } catch (err) {
        console.error('Erro ao buscar colaborador por ID:', err)
        const msg =
          err?.response?.data?.message ||
          'Erro ao carregar dados do colaborador.'
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.loadingItem = false
      }
    },

    /**
     * Cria ou atualiza o currentStaff no backend
     * Sempre inclui user_id e group_id (tenant)
     */
    async saveCurrentStaff () {
      const isEdit = !!this.currentStaff.id

      this.saving = true
      try {
        const userId = this.getCurrentUserId()
        const groupId = this.getCurrentGroupId()

        if (!groupId) {
          const msg = 'Nenhum grupo selecionado para salvar colaborador.'
          Notify.create({ type: 'negative', message: msg })
          return { ok: false, error: msg }
        }

        const payload = {
          ...this.currentStaff,
          user_id: userId,
          group_id: groupId
        }

        let resp
        if (isEdit) {
          resp = await api.put(
            `/tenant/staff/${this.currentStaff.id}`,
            payload,
            {
              params: { user_id: userId, group_id: groupId }
            }
          )
        } else {
          resp = await api.post(
            '/tenant/staff',
            payload,
            {
              params: { user_id: userId, group_id: groupId }
            }
          )
        }

        const data = resp.data

        this.currentStaff = {
          ...this.currentStaff,
          ...data
        }

        const index = this.staff.findIndex(s => s.id === data.id)
        if (index !== -1) {
          this.staff.splice(index, 1, data)
        } else {
          this.staff.unshift(data)
        }

        this.saveToSession()
        Notify.create({
          type: 'positive',
          message: isEdit
            ? 'Colaborador atualizado com sucesso.'
            : 'Colaborador criado com sucesso.'
        })

        return { ok: true, data }
      } catch (err) {
        console.error('Erro ao salvar colaborador:', err)
        const msg =
          err?.response?.data?.message ||
          (this.currentStaff.id
            ? 'Erro ao atualizar colaborador.'
            : 'Erro ao criar colaborador.')
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.saving = false
      }
    },

    /**
     * Remove um colaborador
     * Sempre inclui user_id e group_id (tenant)
     */
    async deleteStaff (id) {
      if (!id) {
        return { ok: false, error: 'ID inválido para excluir colaborador.' }
      }

      this.deleting = true
      try {
        const userId = this.getCurrentUserId()
        const groupId = this.getCurrentGroupId()

        const { data } = await api.delete(`/tenant/staff/${id}`, {
          params: { user_id: userId, group_id: groupId }
        })

        this.staff = this.staff.filter(s => s.id !== id)

        if (this.currentStaff.id === id) {
          this.resetCurrentStaff()
        }

        this.saveToSession()
        Notify.create({
          type: 'positive',
          message: 'Colaborador removido com sucesso.'
        })

        return { ok: true, data }
      } catch (err) {
        console.error('Erro ao excluir colaborador:', err)
        const msg =
          err?.response?.data?.message ||
          'Erro ao excluir colaborador.'
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.deleting = false
      }
    }
  }
})
