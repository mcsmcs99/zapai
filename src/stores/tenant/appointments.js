// src/stores/tenant/appointments.js
import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'
import { Notify } from 'quasar'
import { useAuthStore } from 'src/stores/auth'

const KEY = 'appointments_state'

// ✅ fallback do groupId (pra não depender só do auth timing)
const GROUP_FALLBACK_KEY = 'tenant:last_group_id'

export const useAppointmentsStore = defineStore('appointments', {
  state: () => ({
    /* ---------------- flags ---------------- */
    loadingList: false,
    loadingItem: false,
    saving: false,
    deleting: false,

    // Usado pelo editor (slots) - NÃO afeta a listagem paginada
    loadingConflicts: false,

    /* ---------------- listagem (paginada) ---------------- */
    appointments: [],
    meta: {
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1
    },

    filters: {
      status: '',
      search: '',
      from: '',
      to: ''
    },

    /* ---------------- conflitos (slots do editor) ---------------- */
    conflicts: [],
    conflictsMeta: {
      date: '',
      collaboratorId: null,
      excludeId: null
    },

    /* ---------------- current ---------------- */
    currentAppointment: {
      id: null,
      date: '',
      start: '',
      end: '',

      status: 'confirmed',
      price: 0,

      unitId: null, // ✅ NOVO (unidade do agendamento)
      serviceId: null,
      collaboratorId: null,

      customerName: '',

      // compat (mantém pra evitar quebra em lugares antigos)
      unit_id: null,
      service_id: null,
      collaborator_id: null,
      customer_name: ''
    }
  }),

  actions: {
    /* ---------------- context helpers ---------------- */

    getCurrentUserId () {
      const auth = useAuthStore()
      return auth?.user?.id || null
    },

    // ✅ sempre que tiver groupId, salva como fallback
    rememberGroupId (groupId) {
      const gid = Number(groupId)
      if (!Number.isFinite(gid) || gid <= 0) return
      try {
        localStorage.setItem(GROUP_FALLBACK_KEY, String(gid))
      } catch (e) { console.warn(e) }
    },

    // ✅ resolve groupId por múltiplas fontes (auth -> localStorage -> session)
    getCurrentGroupId () {
      const auth = useAuthStore()

      const fromAuth = auth?.user?.current_group_id
      const gidAuth = Number(fromAuth)
      if (Number.isFinite(gidAuth) && gidAuth > 0) {
        this.rememberGroupId(gidAuth)
        return gidAuth
      }

      // fallback: localStorage
      try {
        const raw = localStorage.getItem(GROUP_FALLBACK_KEY)
        const gid = Number(raw)
        if (Number.isFinite(gid) && gid > 0) return gid
      } catch (e) { console.warn(e) }

      // fallback: session (caso você tenha salvo antes no appointments_state)
      try {
        const raw = sessionStorage.getItem(KEY)
        if (raw) {
          const data = JSON.parse(raw)
          const maybe =
            data?.currentAppointment?.group_id ??
            data?.currentAppointment?.groupId ??
            null
          const gid = Number(maybe)
          if (Number.isFinite(gid) && gid > 0) return gid
        }
      } catch (e) { console.warn(e) }

      return null
    },

    /**
     * ✅ helper único pra padronizar contexto
     * - tenta pegar user_id/group_id do auth/fallback
     * - permite override via params (caso page/store passe)
     */
    resolveContextIds (params = {}) {
      const userId = Number(params.user_id ?? params.userId ?? this.getCurrentUserId() ?? 0) || null

      const groupFromParams = Number(params.group_id ?? params.groupId ?? 0)
      const groupId = (Number.isFinite(groupFromParams) && groupFromParams > 0)
        ? groupFromParams
        : this.getCurrentGroupId()

      if (Number.isFinite(groupId) && groupId > 0) this.rememberGroupId(groupId)

      return { userId, groupId }
    },

    /* ---------------- normalização ---------------- */

    normalizeAppointment (row = {}) {
      const unitId =
        row.unitId ?? row.unit_id ?? row.unit?.id ?? null

      const serviceId =
        row.serviceId ?? row.service_id ?? row.service?.id ?? null

      const collaboratorId =
        row.collaboratorId ??
        row.collaborator_id ??
        row.collaborator?.id ??
        row.staff?.id ??
        null

      const customerName =
        row.customerName ?? row.customer_name ?? ''

      return {
        id: row.id ?? null,
        date: row.date ?? '',

        start: row.start ?? '',
        end: row.end ?? '',

        status: row.status ?? 'pending',
        price: Number(row.price ?? 0),

        unitId,
        serviceId,
        collaboratorId,
        customerName,

        // compat
        unit_id: unitId,
        service_id: serviceId,
        collaborator_id: collaboratorId,
        customer_name: customerName
      }
    },

    /* ---------------- state helpers ---------------- */

    setCurrentAppointmentField (key, val) {
      if (!(key in this.currentAppointment)) return

      // ✅ se trocar unidade, limpa dependências (service/collab/data/slots)
      if (key === 'unitId') {
        const nextUnitId = val != null ? Number(val) : null
        const currentUnitId =
          this.currentAppointment.unitId != null
            ? Number(this.currentAppointment.unitId)
            : null

        if (nextUnitId !== currentUnitId) {
          this.currentAppointment.unitId = nextUnitId

          this.currentAppointment.serviceId = null
          this.currentAppointment.collaboratorId = null
          this.currentAppointment.date = ''
          this.currentAppointment.start = ''
          this.currentAppointment.end = ''

          // compat
          this.currentAppointment.unit_id = this.currentAppointment.unitId
          this.currentAppointment.service_id = this.currentAppointment.serviceId
          this.currentAppointment.collaborator_id = this.currentAppointment.collaboratorId

          // se o editor estiver aberto, evita usar conflitos antigos
          this.resetConflicts()

          this.saveToSession()
          return
        }
      }

      // ✅ se trocar service, limpa collaborator
      if (key === 'serviceId') {
        const nextServiceId = val != null ? Number(val) : null
        const currentServiceId =
          this.currentAppointment.serviceId != null
            ? Number(this.currentAppointment.serviceId)
            : null

        if (nextServiceId !== currentServiceId) {
          this.currentAppointment.serviceId = nextServiceId
          this.currentAppointment.collaboratorId = null

          // compat
          this.currentAppointment.service_id = this.currentAppointment.serviceId
          this.currentAppointment.collaborator_id = this.currentAppointment.collaboratorId

          this.resetConflicts()
          this.saveToSession()
          return
        }
      }

      this.currentAppointment[key] = val

      // compat
      if (key === 'unitId') this.currentAppointment.unit_id = val
      if (key === 'serviceId') this.currentAppointment.service_id = val
      if (key === 'collaboratorId') this.currentAppointment.collaborator_id = val
      if (key === 'customerName') this.currentAppointment.customer_name = val

      this.saveToSession()
    },

    setCurrentAppointment (data = {}, opts = {}) {
      const normalized = this.normalizeAppointment(data)

      const currentServiceId =
        this.currentAppointment.serviceId != null
          ? Number(this.currentAppointment.serviceId)
          : null

      const nextServiceId =
        normalized.serviceId != null ? Number(normalized.serviceId) : null

      const serviceChanged =
        currentServiceId != null &&
        nextServiceId != null &&
        currentServiceId !== nextServiceId

      const collaboratorWasProvided =
        Object.prototype.hasOwnProperty.call(data, 'collaboratorId') ||
        Object.prototype.hasOwnProperty.call(data, 'collaborator_id') ||
        Object.prototype.hasOwnProperty.call(data, 'collaborator') ||
        Object.prototype.hasOwnProperty.call(data, 'staff')

      const mustResetCollaborator =
        (opts.fromSession === true) ||
        (serviceChanged && !collaboratorWasProvided)

      this.currentAppointment = {
        ...this.currentAppointment,
        ...normalized,
        collaboratorId: mustResetCollaborator ? null : normalized.collaboratorId
      }

      // compat
      this.currentAppointment.unit_id = this.currentAppointment.unitId
      this.currentAppointment.service_id = this.currentAppointment.serviceId
      this.currentAppointment.collaborator_id = this.currentAppointment.collaboratorId
      this.currentAppointment.customer_name = this.currentAppointment.customerName

      // ✅ se vier group_id no data (ex.: algum fluxo), guarda no session tb
      if (data?.group_id) this.currentAppointment.group_id = Number(data.group_id)

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

        unitId: null,
        serviceId: null,
        collaboratorId: null,

        customerName: '',

        // compat
        unit_id: null,
        service_id: null,
        collaborator_id: null,
        customer_name: ''
      }
      this.saveToSession()
    },

    /* ---------------- session ---------------- */

    saveToSession () {
      const payload = {
        meta: this.meta,
        filters: this.filters,
        currentAppointment: this.currentAppointment
        // ⚠️ conflicts não precisa persistir em sessão (evita cache errado)
      }
      sessionStorage.setItem(KEY, JSON.stringify(payload))
    },

    loadFromSession () {
      const raw = sessionStorage.getItem(KEY)
      if (!raw) return

      try {
        const data = JSON.parse(raw)

        if (data.meta) this.meta = { ...this.meta, ...data.meta }
        if (data.filters) this.filters = { ...this.filters, ...data.filters }

        if (data.currentAppointment) {
          this.setCurrentAppointment(data.currentAppointment, { fromSession: true })
        }
      } catch (e) {
        console.error('Erro ao carregar appointments_state da sessão', e)
      }
    },

    clearSession () {
      sessionStorage.removeItem(KEY)
    },

    /* ---------------- conflicts (editor slots) ---------------- */

    resetConflicts () {
      this.conflicts = []
      this.conflictsMeta = {
        date: '',
        collaboratorId: null,
        excludeId: null
      }
    },

    /**
     * ✅ NOVA ROTA DEDICADA
     * GET /tenant/appointments/conflicts
     *
     * Busca agendamentos do dia/colaborador para bloquear slots no editor.
     * Não filtra por serviço (regra nova).
     *
     * params:
     * - date (ISO YYYY-MM-DD)
     * - collaboratorId (ou collaborator_id)
     * - excludeId (ou exclude_id) (opcional)
     */
    async fetchConflictsForSlot (params = {}) {
      const date = String(params.date || '')
      const collaboratorId = Number(params.collaboratorId ?? params.collaborator_id ?? 0) || null
      const excludeId = Number(params.excludeId ?? params.exclude_id ?? 0) || null

      if (!date || !collaboratorId) {
        this.resetConflicts()
        return { ok: true, data: [] }
      }

      // ✅ evita refetch desnecessário
      const sameQuery =
        this.conflictsMeta.date === date &&
        Number(this.conflictsMeta.collaboratorId || 0) === Number(collaboratorId || 0) &&
        Number(this.conflictsMeta.excludeId || 0) === Number(excludeId || 0)

      if (sameQuery && Array.isArray(this.conflicts)) {
        return { ok: true, data: this.conflicts }
      }

      this.loadingConflicts = true
      try {
        const { userId, groupId } = this.resolveContextIds(params)

        if (!groupId) {
          this.resetConflicts()
          return { ok: false, error: 'Nenhum grupo selecionado.' }
        }

        const query = {
          user_id: userId,
          group_id: groupId,

          date,
          collaborator_id: collaboratorId
        }

        if (excludeId) query.exclude_id = excludeId

        const { data: resp } = await api.get('/tenant/appointments/conflicts', { params: query })

        const list = resp?.data || resp || []
        const normalized = Array.isArray(list) ? list.map(this.normalizeAppointment) : []

        this.conflicts = normalized
        this.conflictsMeta = { date, collaboratorId, excludeId }

        return { ok: true, data: normalized }
      } catch (err) {
        console.error('Erro ao buscar conflitos do dia:', err)
        this.resetConflicts()
        return { ok: false, error: 'Erro ao carregar conflitos do dia.' }
      } finally {
        this.loadingConflicts = false
      }
    },

    /* ---------------- CRUD ---------------- */

    async fetchAppointments (params = {}) {
      this.loadingList = true
      try {
        const { userId, groupId } = this.resolveContextIds(params)

        if (!groupId) console.warn('Nenhum grupo selecionado ao listar agendamentos.')

        // ✅ resolve page/limit e grava no meta (pra UI refletir)
        const page = Number(params.page ?? this.meta.page ?? 1) || 1
        const limit = Number(params.limit ?? this.meta.limit ?? 20) || 20

        this.meta.page = page
        this.meta.limit = limit

        const query = {
          page,
          limit,
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

        const list = data?.data || data || []
        this.appointments = Array.isArray(list) ? list.map(this.normalizeAppointment) : []

        if (data?.meta) {
          this.meta = {
            ...this.meta,
            ...data.meta,
            page: Number(data.meta.page ?? page) || page,
            limit: Number(data.meta.limit ?? limit) || limit,
            total: Number(data.meta.total ?? 0) || 0,
            totalPages: Number(data.meta.totalPages ?? data.meta.total_pages ?? 1) || 1
          }
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

    async fetchAppointmentById (id, params = {}) {
      if (!id) return { ok: false, error: 'ID inválido para buscar agendamento.' }

      this.loadingItem = true
      try {
        const { userId, groupId } = this.resolveContextIds(params)

        const { data } = await api.get(`/tenant/appointments/${id}`, {
          params: { user_id: userId, group_id: groupId }
        })

        const normalized = this.normalizeAppointment(data)
        this.setCurrentAppointment(normalized)

        const index = this.appointments.findIndex(a => a.id === normalized.id)
        if (index !== -1) this.appointments.splice(index, 1, normalized)

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

    async saveCurrentAppointment (params = {}) {
      const isEdit = !!this.currentAppointment.id
      this.saving = true

      try {
        const { userId, groupId } = this.resolveContextIds(params)

        if (!groupId) {
          const msg = 'Nenhum grupo selecionado para salvar agendamento.'
          Notify.create({ type: 'negative', message: msg })
          return { ok: false, error: msg }
        }

        const unitIdRaw =
          this.currentAppointment.unitId ??
          this.currentAppointment.unit_id ??
          null

        const serviceIdRaw =
          this.currentAppointment.serviceId ??
          this.currentAppointment.service_id ??
          null

        const collaboratorIdRaw =
          this.currentAppointment.collaboratorId ??
          this.currentAppointment.collaborator_id ??
          null

        const unitId = Number(unitIdRaw)
        const serviceId = Number(serviceIdRaw)
        const collaboratorId = Number(collaboratorIdRaw)

        if (!Number.isFinite(unitId) || unitId <= 0) {
          const msg = 'unit_id inválido ao salvar agendamento.'
          Notify.create({ type: 'negative', message: msg })
          return { ok: false, error: msg }
        }

        if (!Number.isFinite(serviceId) || serviceId <= 0) {
          const msg = 'service_id inválido ao salvar agendamento.'
          Notify.create({ type: 'negative', message: msg })
          return { ok: false, error: msg }
        }

        if (!Number.isFinite(collaboratorId) || collaboratorId <= 0) {
          const msg = 'collaborator_id inválido ao salvar agendamento.'
          Notify.create({ type: 'negative', message: msg })
          return { ok: false, error: msg }
        }

        const payload = {
          id: this.currentAppointment.id,
          date: this.currentAppointment.date,
          start: this.currentAppointment.start,
          end: this.currentAppointment.end,
          status: this.currentAppointment.status,
          price: this.currentAppointment.price,

          unit_id: unitId, // ✅ NOVO
          service_id: serviceId,
          collaborator_id: collaboratorId,

          customer_name: String(
            this.currentAppointment.customerName ??
            this.currentAppointment.customer_name ??
            ''
          ).trim(),

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
        this.setCurrentAppointment(normalized)

        const index = this.appointments.findIndex(a => a.id === normalized.id)
        if (index !== -1) this.appointments.splice(index, 1, normalized)
        else this.appointments.unshift(normalized)

        this.saveToSession()

        // ✅ após salvar, limpa conflitos para forçar refresh no editor se reabrir
        this.resetConflicts()

        Notify.create({
          type: 'positive',
          message: isEdit
            ? 'Agendamento atualizado com sucesso.'
            : 'Agendamento criado com sucesso.'
        })

        return { ok: true, data: normalized }
      } catch (err) {
        console.error('Erro ao salvar agendamento:', err?.response?.data || err)

        const rawMsg = err?.response?.data?.message
        const msg =
          rawMsg === 'Este colaborador não está vinculado a este serviço.'
            ? 'Este colaborador não pode realizar o serviço selecionado. Selecione outro colaborador.'
            : (rawMsg ||
              (this.currentAppointment.id
                ? 'Erro ao atualizar agendamento.'
                : 'Erro ao criar agendamento.'))

        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.saving = false
      }
    },

    async createAppointment (appointmentData = {}, params = {}) {
      this.setCurrentAppointment(appointmentData)
      return this.saveCurrentAppointment(params)
    },

    async updateAppointment (id, patch = {}, params = {}) {
      if (!id) {
        const msg = 'ID inválido para atualizar agendamento.'
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      }

      let current =
        this.appointments.find(a => a.id === id) ||
        (this.currentAppointment?.id === id ? this.currentAppointment : null)

      if (!current) {
        const r = await this.fetchAppointmentById(id, params)
        if (!r?.ok) return r

        current =
          this.appointments.find(a => a.id === id) ||
          (this.currentAppointment?.id === id ? this.currentAppointment : null) ||
          {}
      }

      const normalizedPatch = { ...patch }

      if (typeof patch.unit_id !== 'undefined') normalizedPatch.unitId = patch.unit_id
      if (typeof patch.service_id !== 'undefined') normalizedPatch.serviceId = patch.service_id
      if (typeof patch.collaborator_id !== 'undefined') normalizedPatch.collaboratorId = patch.collaborator_id
      if (typeof patch.customer_name !== 'undefined') normalizedPatch.customerName = patch.customer_name

      delete normalizedPatch.unit_id
      delete normalizedPatch.service_id
      delete normalizedPatch.collaborator_id
      delete normalizedPatch.customer_name

      const nextUnitId =
        typeof normalizedPatch.unitId !== 'undefined'
          ? (normalizedPatch.unitId != null ? Number(normalizedPatch.unitId) : null)
          : (current.unitId != null ? Number(current.unitId) : null)

      const currUnitId =
        current.unitId != null ? Number(current.unitId) : null

      const unitChanged =
        typeof normalizedPatch.unitId !== 'undefined' &&
        nextUnitId !== currUnitId

      const nextServiceId =
        typeof normalizedPatch.serviceId !== 'undefined'
          ? (normalizedPatch.serviceId != null ? Number(normalizedPatch.serviceId) : null)
          : (current.serviceId != null ? Number(current.serviceId) : null)

      const currServiceId =
        current.serviceId != null ? Number(current.serviceId) : null

      const serviceChanged =
        typeof normalizedPatch.serviceId !== 'undefined' &&
        nextServiceId !== currServiceId

      this.setCurrentAppointment({
        ...current,
        ...normalizedPatch,
        id,
        ...(unitChanged
          ? {
              serviceId: null,
              service_id: null,
              collaboratorId: null,
              collaborator_id: null,
              start: '',
              end: ''
            }
          : {}),
        ...(serviceChanged ? { collaboratorId: null, collaborator_id: null } : {})
      })

      this.saveToSession()
      return this.saveCurrentAppointment(params)
    },

    async deleteAppointment (id, params = {}) {
      if (!id) return { ok: false, error: 'ID inválido para excluir agendamento.' }

      this.deleting = true
      try {
        const { userId, groupId } = this.resolveContextIds(params)

        const { data } = await api.delete(`/tenant/appointments/${id}`, {
          params: { user_id: userId, group_id: groupId }
        })

        this.appointments = this.appointments.filter(a => a.id !== id)

        if (this.currentAppointment.id === id) this.resetCurrentAppointment()

        this.saveToSession()

        // ✅ remove conflitos cacheados (se o editor estiver aberto depois)
        this.resetConflicts()

        Notify.create({ type: 'positive', message: 'Agendamento removido com sucesso.' })

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
