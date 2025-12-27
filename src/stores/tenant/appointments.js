// src/stores/tenant/appointments.js
import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'
import { Notify } from 'quasar'
import { useAuthStore } from 'src/stores/auth'

const KEY = 'appointments_state'

export const useAppointmentsStore = defineStore('appointments', {
  state: () => ({
    loadingList: false,
    loadingItem: false,
    saving: false,
    deleting: false,

    appointments: [], // lista de agendamentos
    meta: {
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1
    },

    filters: {
      status: '',
      search: '',
      from: '', // YYYY-MM-DD (opcional)
      to: ''    // YYYY-MM-DD (opcional)
    },

    currentAppointment: {
      id: null,
      date: '', // YYYY-MM-DD
      start: '', // HH:mm
      end: '', // HH:mm

      status: 'confirmed', // confirmed | done | cancelled (ajuste se tiver outros)
      price: 0,

      serviceId: null,
      collaboratorId: null,

      // se seu back usar customer_id, troque/adapte
      customerName: ''
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

    // normalização -------------------------------------
    normalizeAppointment (row = {}) {
      // ids (aceita camelCase, snake_case e objetos)
      const serviceId =
        row.serviceId ?? row.service_id ?? row.service?.id ?? null

      const collaboratorId =
        row.collaboratorId ?? row.collaborator_id ?? row.collaborator?.id ?? row.staff?.id ?? null

      const customerName = row.customer_name ?? ''

      return {
        // base
        id: row.id ?? null,
        date: row.date ?? '',

        start: row.start ?? '',
        end: row.end ?? '',

        status: row.status ?? 'pending',
        price: Number(row.price ?? 0),

        // ======= para salvar/editar =======
        serviceId,
        collaboratorId,
        customerName,

        // ======= compat (evita quebrar código existente) =======
        service_id: serviceId,
        collaborator_id: collaboratorId,
        customer_name: customerName
      }
    },

    // state helpers ------------------------------------
    setCurrentAppointmentField (key, val) {
      if (key in this.currentAppointment) {
        this.currentAppointment[key] = val
        this.saveToSession()
      }
    },

    setCurrentAppointment (data = {}) {
      this.currentAppointment = this.normalizeAppointment(data)
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

    resetCurrentAppointment () {
      this.currentAppointment = {
        id: null,
        date: '',
        start: '',
        end: '',
        status: 'confirmed',
        price: 0,
        serviceId: null,
        collaboratorId: null,
        customerName: ''
      }
      this.saveToSession()
    },

    reset () {
      this.loadingList = false
      this.loadingItem = false
      this.saving = false
      this.deleting = false

      this.appointments = []
      this.meta = {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1
      }

      this.filters = {
        status: '',
        search: '',
        from: '',
        to: ''
      }

      this.resetCurrentAppointment()
      this.clearSession()
    },

    // sessionStorage -----------------------------------
    saveToSession () {
      const payload = {
        meta: this.meta,
        filters: this.filters,
        currentAppointment: this.currentAppointment
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

        if (data.currentAppointment) {
          this.currentAppointment = { ...this.currentAppointment, ...data.currentAppointment }
        }
      } catch (e) {
        console.error('Erro ao carregar appointments_state da sessão', e)
      }
    },

    clearSession () {
      sessionStorage.removeItem(KEY)
    },

    // CRUD ---------------------------------------------

    /**
     * Lista agendamentos
     * Sempre inclui user_id e group_id (tenant) automaticamente
     */
    async fetchAppointments (params = {}) {
      this.loadingList = true

      try {
        const userId = this.getCurrentUserId()
        const groupId = this.getCurrentGroupId()

        if (!groupId) {
          console.warn('Nenhum grupo selecionado ao listar agendamentos.')
        }

        const query = {
          page: params.page || this.meta.page,
          limit: params.limit || this.meta.limit,
          user_id: userId,
          group_id: groupId
        }

        const status = params.status ?? this.filters.status
        const search = params.search ?? this.filters.search
        const from = params.from ?? this.filters.from
        const to = params.to ?? this.filters.to

        if (status) query.status = status
        if (search) query.search = search
        if (from) query.from = from
        if (to) query.to = to

        const { data } = await api.get('/tenant/appointments', { params: query })

        const list = data.data || data || []
        this.appointments = Array.isArray(list)
          ? list.map(this.normalizeAppointment)
          : []

        if (data.meta) {
          this.meta = { ...this.meta, ...data.meta }
        } else {
          this.meta.total = this.appointments.length
          this.meta.totalPages = 1
        }

        this.saveToSession()
        return { ok: true, data }
      } catch (err) {
        console.error('Erro ao buscar agendamentos:', err)
        const msg =
          err?.response?.data?.message ||
          'Erro ao carregar lista de agendamentos.'
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.loadingList = false
      }
    },

    /**
     * Busca um agendamento por ID
     */
    async fetchAppointmentById (id) {
      if (!id) {
        return { ok: false, error: 'ID inválido para buscar agendamento.' }
      }

      this.loadingItem = true
      try {
        const userId = this.getCurrentUserId()
        const groupId = this.getCurrentGroupId()

        const { data } = await api.get(`/tenant/appointments/${id}`, {
          params: { user_id: userId, group_id: groupId }
        })

        const normalized = this.normalizeAppointment(data)
        this.currentAppointment = normalized

        const index = this.appointments.findIndex(a => a.id === normalized.id)
        if (index !== -1) {
          this.appointments.splice(index, 1, normalized)
        }

        this.saveToSession()
        return { ok: true, data: normalized }
      } catch (err) {
        console.error('Erro ao buscar agendamento por ID:', err)
        const msg =
          err?.response?.data?.message ||
          'Erro ao carregar dados do agendamento.'
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.loadingItem = false
      }
    },

    /**
     * Cria ou atualiza o currentAppointment no backend
     */
    async saveCurrentAppointment () {
      const isEdit = !!this.currentAppointment.id

      this.saving = true
      try {
        const userId = this.getCurrentUserId()
        const groupId = this.getCurrentGroupId()

        if (!groupId) {
          const msg = 'Nenhum grupo selecionado para salvar agendamento.'
          Notify.create({ type: 'negative', message: msg })
          return { ok: false, error: msg }
        }

        // payload no padrão que o backend costuma esperar (snake_case)
        const payload = {
          id: this.currentAppointment.id,
          date: this.currentAppointment.date,
          start: this.currentAppointment.start,
          end: this.currentAppointment.end,
          status: this.currentAppointment.status,
          price: this.currentAppointment.price,

          service_id: this.currentAppointment.serviceId,
          collaborator_id: this.currentAppointment.collaboratorId,

          customer_name: this.currentAppointment.customerName,

          user_id: userId,
          group_id: groupId
        }

        let resp
        if (isEdit) {
          resp = await api.put(
            `/tenant/appointments/${this.currentAppointment.id}`,
            payload,
            { params: { user_id: userId, group_id: groupId } }
          )
        } else {
          resp = await api.post(
            '/tenant/appointments',
            payload,
            { params: { user_id: userId, group_id: groupId } }
          )
        }

        const data = resp.data
        const normalized = this.normalizeAppointment(data)

        this.currentAppointment = normalized

        const index = this.appointments.findIndex(a => a.id === normalized.id)
        if (index !== -1) {
          this.appointments.splice(index, 1, normalized)
        } else {
          this.appointments.unshift(normalized)
        }

        this.saveToSession()

        Notify.create({
          type: 'positive',
          message: isEdit
            ? 'Agendamento atualizado com sucesso.'
            : 'Agendamento criado com sucesso.'
        })

        return { ok: true, data: normalized }
      } catch (err) {
        console.error('Erro ao salvar agendamento:', err)
        const msg =
          err?.response?.data?.message ||
          (this.currentAppointment.id
            ? 'Erro ao atualizar agendamento.'
            : 'Erro ao criar agendamento.')
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.saving = false
      }
    },

    /**
     * Helper mais semântico pra criar direto
     * (útil pro dialog de "Novo agendamento")
     */
    async createAppointment (appointmentData = {}) {
      this.setCurrentAppointment(appointmentData)
      return this.saveCurrentAppointment()
    },

    /**
     * Helper semântico pra atualizar direto (útil pra tela)
     * Ex:
     *   await appointmentsStore.updateAppointment(id, payload)
     */
    async updateAppointment (id, patch = {}) {
      if (!id) {
        const msg = 'ID inválido para atualizar agendamento.'
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      }

      // pega o registro atual na lista (ou do currentAppointment)
      let current =
        this.appointments.find(a => a.id === id) ||
        (this.currentAppointment?.id === id ? this.currentAppointment : null)

      if (!current) {
        const r = await this.fetchAppointmentById(id)
        if (!r?.ok) return r

        // depois do fetch, tenta pegar de novo
        current =
          this.appointments.find(a => a.id === id) ||
          (this.currentAppointment?.id === id ? this.currentAppointment : null) ||
          {}
      }

      // normaliza snake_case -> camelCase (e garante overwrite)
      const normalizedPatch = { ...patch }

      if (typeof patch.service_id !== 'undefined') normalizedPatch.serviceId = patch.service_id
      if (typeof patch.collaborator_id !== 'undefined') normalizedPatch.collaboratorId = patch.collaborator_id
      if (typeof patch.customer_id !== 'undefined') normalizedPatch.customerId = patch.customer_id

      // (opcional) remove as chaves snake pra não poluir o objeto
      delete normalizedPatch.service_id
      delete normalizedPatch.collaborator_id
      delete normalizedPatch.customer_id

      // merge: base -> patch normalizado -> id
      this.currentAppointment = {
        ...current,
        ...normalizedPatch,
        id
      }

      this.saveToSession()
      return this.saveCurrentAppointment()
    },

    /**
     * Remove um agendamento
     */
    async deleteAppointment (id) {
      if (!id) {
        return { ok: false, error: 'ID inválido para excluir agendamento.' }
      }

      this.deleting = true
      try {
        const userId = this.getCurrentUserId()
        const groupId = this.getCurrentGroupId()

        const { data } = await api.delete(`/tenant/appointments/${id}`, {
          params: { user_id: userId, group_id: groupId }
        })

        this.appointments = this.appointments.filter(a => a.id !== id)

        if (this.currentAppointment.id === id) {
          this.resetCurrentAppointment()
        }

        this.saveToSession()
        Notify.create({
          type: 'positive',
          message: 'Agendamento removido com sucesso.'
        })

        return { ok: true, data }
      } catch (err) {
        console.error('Erro ao excluir agendamento:', err)
        const msg =
          err?.response?.data?.message ||
          'Erro ao excluir agendamento.'
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.deleting = false
      }
    }
  }
})
