// src/stores/tenant/staff.js
import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'
import { Notify } from 'quasar'
import { useAuthStore } from 'src/stores/auth'

const KEY = 'staff_state'
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

function createDefaultSchedule () {
  const baseOpen = {
    closed: false,
    intervals: [{ start: '08:30', end: '17:30', unit_id: null }]
  }
  const baseSat = {
    closed: false,
    intervals: [{ start: '08:30', end: '15:00', unit_id: null }]
  }
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

/**
 * ✅ NEW: normaliza o tipo de atendimento do colaborador
 */
function normalizeAttendanceMode (raw) {
  const v = String(raw || '').trim()
  if (v === 'fixed' || v === 'client_location' || v === 'mixed') return v
  return 'fixed'
}

/**
 * Compat/normalização do schedule (formato novo/antigo)
 * garante intervalos com { start, end, unit_id }
 */
function normalizeSchedule (rawSchedule) {
  const src = rawSchedule || {}
  const result = {}

  for (const key of DAY_KEYS) {
    const v = src[key]

    if (v && typeof v === 'object' && 'closed' in v && Array.isArray(v.intervals)) {
      const intervals = v.intervals
        .map(it => ({
          start: it?.start ?? null,
          end: it?.end ?? null,
          unit_id: it?.unit_id != null ? Number(it.unit_id) : null
        }))
        .filter(it => it.start || it.end || it.unit_id)

      result[key] = {
        closed: !!v.closed,
        intervals
      }
      continue
    }

    if (typeof v === 'string') {
      const trimmed = v.trim()

      if (!trimmed || trimmed.toLowerCase() === 'fechado') {
        result[key] = { closed: true, intervals: [] }
        continue
      }

      const intervals = trimmed
        .split(',')
        .map(s => s.trim())
        .map(seg => {
          const [start, end] = seg.split('-').map(t => t.trim())
          if (!start || !end) return null
          return { start, end, unit_id: null }
        })
        .filter(Boolean)

      result[key] = {
        closed: intervals.length === 0,
        intervals: intervals.length ? intervals : [{ start: null, end: null, unit_id: null }]
      }
      continue
    }

    result[key] = { closed: true, intervals: [] }
  }

  return result
}

/**
 * ✅ NEW: se for colaborador domiciliar, remove unit_id dos intervalos
 */
function stripUnitsFromSchedule (schedule) {
  const normalized = normalizeSchedule(schedule)

  for (const key of DAY_KEYS) {
    const day = normalized[key]
    if (!day || !Array.isArray(day.intervals)) continue
    day.intervals = day.intervals.map(it => ({
      start: it.start ?? null,
      end: it.end ?? null,
      unit_id: null
    }))
  }

  return normalized
}

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

export const useStaffStore = defineStore('staff', {
  state: () => ({
    loadingList: false,
    loadingItem: false,
    saving: false,
    deleting: false,

    staff: [],
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
      // ✅ NEW
      attendance_mode: 'fixed',
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
        // ✅ NEW
        if (key === 'attendance_mode') this.currentStaff[key] = normalizeAttendanceMode(val)
        else this.currentStaff[key] = val

        this.saveToSession()
      }
    },

    setCurrentStaff (staffData = {}) {
      const attendance_mode = normalizeAttendanceMode(
        staffData.attendance_mode ?? staffData.attendanceMode
      )

      // schedule sempre normalizado
      let schedule = normalizeSchedule(staffData.schedule) || createDefaultSchedule()

      // ✅ NEW: se domiciliar, limpa unit_id dos intervalos no state (pra não confundir UI)
      if (attendance_mode === 'client_location') {
        schedule = stripUnitsFromSchedule(schedule)
      }

      this.currentStaff = {
        id: staffData.id ?? null,
        name: staffData.name ?? '',
        role: staffData.role ?? '',
        photoUrl: staffData.photoUrl ?? staffData.photo_url ?? '',
        status: staffData.status || 'active',

        // ✅ NEW
        attendance_mode,

        schedule,
        serviceIds: uniqIds(staffData.serviceIds ?? staffData.service_ids)
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
        // ✅ NEW
        attendance_mode: 'fixed',
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

        if (data.meta) this.meta = { ...this.meta, ...data.meta }
        if (data.filters) this.filters = { ...this.filters, ...data.filters }

        if (data.currentStaff) {
          this.currentStaff = { ...this.currentStaff, ...data.currentStaff }

          // ✅ NEW: normalize novamente
          this.currentStaff.attendance_mode = normalizeAttendanceMode(this.currentStaff.attendance_mode)
          this.currentStaff.serviceIds = uniqIds(this.currentStaff.serviceIds)

          let schedule = normalizeSchedule(this.currentStaff.schedule) || createDefaultSchedule()
          if (this.currentStaff.attendance_mode === 'client_location') {
            schedule = stripUnitsFromSchedule(schedule)
          }
          this.currentStaff.schedule = schedule
        }
      } catch (e) {
        console.error('Erro ao carregar staff_state da sessão', e)
      }
    },

    clearSession () {
      sessionStorage.removeItem(KEY)
    },

    // ---------------------------------------------------
    // Payload normalizer
    // ---------------------------------------------------
    normalizeStaffPayload (payload = {}) {
      const out = { ...payload }

      // photoUrl -> photo_url
      if (out.photoUrl !== undefined && out.photo_url === undefined) {
        out.photo_url = out.photoUrl
      }
      delete out.photoUrl

      // serviceIds
      if ('service_ids' in out && out.serviceIds === undefined) {
        out.serviceIds = out.service_ids
      }
      if ('service_ids' in out) delete out.service_ids
      if ('serviceIds' in out) out.serviceIds = uniqIds(out.serviceIds)

      // ✅ NEW: attendance_mode (aceita attendanceMode também)
      if (out.attendanceMode !== undefined && out.attendance_mode === undefined) {
        out.attendance_mode = out.attendanceMode
      }
      delete out.attendanceMode
      out.attendance_mode = normalizeAttendanceMode(out.attendance_mode)

      // schedule
      out.schedule = normalizeSchedule(out.schedule)

      // ✅ NEW: se domiciliar, não manda unit_id (back fica limpo)
      if (out.attendance_mode === 'client_location') {
        out.schedule = stripUnitsFromSchedule(out.schedule)
      }

      return out
    },

    // CRUD ---------------------------------------------

    async fetchStaff (params = {}) {
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

        const { data } = await api.get('/tenant/staff', { params: query })

        this.staff = (data.data || []).map(s => {
          const attendance_mode = normalizeAttendanceMode(s.attendance_mode ?? s.attendanceMode)
          let schedule = normalizeSchedule(s.schedule)

          // ✅ NEW
          if (attendance_mode === 'client_location') {
            schedule = stripUnitsFromSchedule(schedule)
          }

          return {
            ...s,
            photoUrl: s.photoUrl ?? s.photo_url ?? '',
            attendance_mode,
            serviceIds: uniqIds(s.serviceIds ?? s.service_ids),
            schedule
          }
        })

        if (data.meta) {
          this.meta = { ...this.meta, ...data.meta }
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

    async fetchStaffById (id) {
      if (!id) return { ok: false, error: 'ID inválido para buscar colaborador.' }

      this.loadingItem = true
      try {
        const userId = this.getCurrentUserId()
        const groupId = this.getCurrentGroupId()

        const { data } = await api.get(`/tenant/staff/${id}`, {
          params: { user_id: userId, group_id: groupId }
        })

        const attendance_mode = normalizeAttendanceMode(data.attendance_mode ?? data.attendanceMode)
        let schedule = normalizeSchedule(data.schedule)

        // ✅ NEW
        if (attendance_mode === 'client_location') {
          schedule = stripUnitsFromSchedule(schedule)
        }

        const normalized = {
          ...data,
          photoUrl: data.photoUrl ?? data.photo_url ?? '',
          attendance_mode,
          serviceIds: uniqIds(data.serviceIds ?? data.service_ids),
          schedule
        }

        this.currentStaff = { ...this.currentStaff, ...normalized }

        const index = this.staff.findIndex(s => s.id === normalized.id)
        if (index !== -1) this.staff.splice(index, 1, normalized)

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

        const payload = this.normalizeStaffPayload({
          ...this.currentStaff
        })

        let resp
        if (isEdit) {
          resp = await api.put(`/tenant/staff/${this.currentStaff.id}`, payload, {
            params: { user_id: userId, group_id: groupId }
          })
        } else {
          resp = await api.post('/tenant/staff', payload, {
            params: { user_id: userId, group_id: groupId }
          })
        }

        const data = resp.data

        const attendance_mode = normalizeAttendanceMode(
          data.attendance_mode ?? data.attendanceMode ?? payload.attendance_mode
        )

        let schedule = normalizeSchedule(data.schedule ?? payload.schedule)
        if (attendance_mode === 'client_location') {
          schedule = stripUnitsFromSchedule(schedule)
        }

        const normalized = {
          ...data,
          photoUrl: data.photoUrl ?? data.photo_url ?? this.currentStaff.photoUrl ?? '',
          attendance_mode,
          serviceIds: uniqIds(data.serviceIds ?? data.service_ids ?? payload.serviceIds),
          schedule
        }

        this.currentStaff = { ...this.currentStaff, ...normalized }

        const index = this.staff.findIndex(s => s.id === normalized.id)
        if (index !== -1) this.staff.splice(index, 1, normalized)
        else this.staff.unshift(normalized)

        this.saveToSession()

        Notify.create({
          type: 'positive',
          message: isEdit ? 'Colaborador atualizado com sucesso.' : 'Colaborador criado com sucesso.'
        })

        return { ok: true, data: normalized }
      } catch (err) {
        console.error('Erro ao salvar colaborador:', err)
        const msg =
          err?.response?.data?.message ||
          (this.currentStaff.id ? 'Erro ao atualizar colaborador.' : 'Erro ao criar colaborador.')
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.saving = false
      }
    },

    async deleteStaff (id) {
      if (!id) return { ok: false, error: 'ID inválido para excluir colaborador.' }

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
        Notify.create({ type: 'positive', message: 'Colaborador removido com sucesso.' })

        return { ok: true, data }
      } catch (err) {
        console.error('Erro ao excluir colaborador:', err)
        const msg = err?.response?.data?.message || 'Erro ao excluir colaborador.'
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.deleting = false
      }
    }
  }
})
