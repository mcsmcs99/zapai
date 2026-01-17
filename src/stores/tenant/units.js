// src/stores/tenant/units.js
import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'
import { Notify } from 'quasar'
import { useAuthStore } from 'src/stores/auth'

const KEY = 'units_state'

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

function normalizeLinks (raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw

  // se vier string (json) por algum motivo
  if (typeof raw === 'string') {
    try {
      const j = JSON.parse(raw)
      if (Array.isArray(j)) return j
    } catch (e) {
      console.error(e)
    }
  }

  return []
}

function normalizeUnitPayload (unit = {}) {
  return {
    id: unit.id ?? null,
    unique_key: unit.unique_key ?? unit.uniqueKey ?? null,

    name: unit.name ?? '',

    phone: unit.phone ?? null,
    email: unit.email ?? null,

    is_active:
      typeof unit.is_active !== 'undefined'
        ? !!unit.is_active
        : typeof unit.isActive !== 'undefined'
          ? !!unit.isActive
          : true,

    timezone: unit.timezone ?? null,

    address_line1: unit.address_line1 ?? unit.addressLine1 ?? null,
    address_line2: unit.address_line2 ?? unit.addressLine2 ?? null,
    sublocality: unit.sublocality ?? null,
    locality: unit.locality ?? null,
    administrative_area: unit.administrative_area ?? unit.administrativeArea ?? null,
    postal_code: unit.postal_code ?? unit.postalCode ?? null,

    latitude: typeof unit.latitude !== 'undefined' ? unit.latitude : null,
    longitude: typeof unit.longitude !== 'undefined' ? unit.longitude : null,
    place_id: unit.place_id ?? unit.placeId ?? null,

    // links
    unit_links: normalizeLinks(unit.unit_links ?? unit.unitLinks),

    // NEW: serviços disponíveis na unidade (pivot)
    serviceIds: uniqIds(unit.serviceIds ?? unit.service_ids)
  }
}

/**
 * Payload normalizer (manda sempre serviceIds, nunca service_ids)
 */
function normalizeUnitRequestPayload (payload = {}) {
  const out = { ...payload }

  if ('service_ids' in out && out.serviceIds === undefined) {
    out.serviceIds = out.service_ids
  }
  if ('service_ids' in out) delete out.service_ids

  if ('serviceIds' in out) {
    out.serviceIds = uniqIds(out.serviceIds)
  }

  return out
}

export const useUnitsStore = defineStore('units', {
  state: () => ({
    loadingList: false,
    loadingItem: false,
    saving: false,
    deleting: false,

    units: [], // lista de unidades
    meta: {
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1
    },

    filters: {
      is_active: '', // '' | true | false
      search: ''
    },

    currentUnit: normalizeUnitPayload({
      id: null,
      name: '',
      phone: null,
      email: null,
      is_active: true,

      timezone: null,

      address_line1: null,
      address_line2: null,
      sublocality: null,
      locality: null,
      administrative_area: null,
      postal_code: null,

      latitude: null,
      longitude: null,
      place_id: null,

      unit_links: [],

      // NEW
      serviceIds: []
    })
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
    setCurrentUnitField (key, val) {
      if (key in this.currentUnit) {
        this.currentUnit[key] = val
        this.saveToSession()
      }
    },

    setCurrentUnit (unitData = {}) {
      this.currentUnit = normalizeUnitPayload(unitData)
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

    resetCurrentUnit () {
      this.currentUnit = normalizeUnitPayload({
        id: null,
        name: '',
        phone: null,
        email: null,
        is_active: true,

        timezone: null,

        address_line1: null,
        address_line2: null,
        sublocality: null,
        locality: null,
        administrative_area: null,
        postal_code: null,

        latitude: null,
        longitude: null,
        place_id: null,

        unit_links: [],

        // NEW
        serviceIds: []
      })
      this.saveToSession()
    },

    reset () {
      this.loadingList = false
      this.loadingItem = false
      this.saving = false
      this.deleting = false

      this.units = []
      this.meta = {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1
      }

      this.filters = {
        is_active: '',
        search: ''
      }

      this.resetCurrentUnit()
      this.clearSession()
    },

    // sessionStorage -----------------------------------
    saveToSession () {
      const payload = {
        meta: this.meta,
        filters: this.filters,
        currentUnit: this.currentUnit
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

        if (data.currentUnit) {
          this.currentUnit = normalizeUnitPayload({
            ...this.currentUnit,
            ...data.currentUnit
          })

          // garante normalização
          this.currentUnit.serviceIds = uniqIds(this.currentUnit.serviceIds)
        }
      } catch (e) {
        console.error('Erro ao carregar units_state da sessão', e)
      }
    },

    clearSession () {
      sessionStorage.removeItem(KEY)
    },

    // CRUD ---------------------------------------------

    /**
     * Lista unidades
     * Sempre inclui user_id e group_id (tenant) automaticamente
     */
    async fetchUnits (params = {}) {
      this.loadingList = true

      try {
        const userId = this.getCurrentUserId()
        const groupId = this.getCurrentGroupId()

        if (!groupId) {
          console.warn('Nenhum grupo selecionado ao listar unidades.')
        }

        const query = {
          page: params.page || this.meta.page,
          limit: params.limit || this.meta.limit,
          user_id: userId,
          group_id: groupId // <-- tenant
        }

        const isActive = params.is_active ?? this.filters.is_active
        const search = params.search ?? this.filters.search

        if (isActive !== '' && typeof isActive !== 'undefined' && isActive !== null) {
          query.is_active = isActive
        }
        if (search) query.search = search

        // /tenant/units
        const { data } = await api.get('/tenant/units', { params: query })

        this.units = (data.data || []).map(u => normalizeUnitPayload(u))

        if (data.meta) {
          this.meta = {
            ...this.meta,
            ...data.meta
          }
        } else {
          this.meta.total = this.units.length
          this.meta.totalPages = 1
        }

        this.saveToSession()
        return { ok: true, data }
      } catch (err) {
        console.error('Erro ao buscar unidades:', err)
        const msg =
          err?.response?.data?.message ||
          'Erro ao carregar lista de unidades.'
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.loadingList = false
      }
    },

    /**
     * Busca uma unidade por ID
     * Sempre inclui user_id e group_id (tenant)
     */
    async fetchUnitById (id) {
      if (!id) {
        return { ok: false, error: 'ID inválido para buscar unidade.' }
      }

      this.loadingItem = true
      try {
        const userId = this.getCurrentUserId()
        const groupId = this.getCurrentGroupId()

        const { data } = await api.get(`/tenant/units/${id}`, {
          params: { user_id: userId, group_id: groupId }
        })

        const normalized = normalizeUnitPayload(data)

        this.currentUnit = { ...this.currentUnit, ...normalized }

        const index = this.units.findIndex(u => u.id === normalized.id)
        if (index !== -1) this.units.splice(index, 1, normalized)

        this.saveToSession()
        return { ok: true, data: normalized }
      } catch (err) {
        console.error('Erro ao buscar unidade por ID:', err)
        const msg =
          err?.response?.data?.message ||
          'Erro ao carregar dados da unidade.'
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.loadingItem = false
      }
    },

    /**
     * Cria ou atualiza o currentUnit no backend
     * Sempre inclui user_id e group_id (tenant)
     */
    async saveCurrentUnit () {
      const isEdit = !!this.currentUnit.id

      this.saving = true
      try {
        const userId = this.getCurrentUserId()
        const groupId = this.getCurrentGroupId()

        if (!groupId) {
          const msg = 'Nenhum grupo selecionado para salvar unidade.'
          Notify.create({ type: 'negative', message: msg })
          return { ok: false, error: msg }
        }

        // normaliza: garante 1 "primary" por type
        const links = normalizeLinks(this.currentUnit.unit_links).map(l => ({
          id: l.id ?? null,
          type: l.type ?? '',
          provider: l.provider ?? null,
          url: l.url ?? '',
          label: l.label ?? null,
          is_primary: !!l.is_primary
        }))

        const seen = new Set()
        for (const l of links) {
          if (!l.is_primary) continue
          if (seen.has(l.type)) l.is_primary = false
          else seen.add(l.type)
        }

        // NEW: garante serviceIds no formato certo
        const basePayload = normalizeUnitRequestPayload({
          ...this.currentUnit
        })

        const payload = {
          ...basePayload,

          // garante naming consistente pro backend
          unit_links: links
        }

        let resp
        if (isEdit) {
          resp = await api.put(`/tenant/units/${this.currentUnit.id}`, payload, {
            params: { user_id: userId, group_id: groupId }
          })
        } else {
          resp = await api.post('/tenant/units', payload, {
            params: { user_id: userId, group_id: groupId }
          })
        }

        const data = resp.data
        const normalized = normalizeUnitPayload(data)

        this.currentUnit = {
          ...this.currentUnit,
          ...normalized
        }

        const index = this.units.findIndex(u => u.id === normalized.id)
        if (index !== -1) {
          this.units.splice(index, 1, normalized)
        } else {
          this.units.unshift(normalized)
        }

        this.saveToSession()
        Notify.create({
          type: 'positive',
          message: isEdit
            ? 'Unidade atualizada com sucesso.'
            : 'Unidade criada com sucesso.'
        })

        return { ok: true, data: normalized }
      } catch (err) {
        console.error('Erro ao salvar unidade:', err)
        const msg =
          err?.response?.data?.message ||
          (this.currentUnit.id
            ? 'Erro ao atualizar unidade.'
            : 'Erro ao criar unidade.')
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.saving = false
      }
    },

    /**
     * Atualiza uma unidade específica sem depender do currentUnit
     */
    async updateUnit (id, patch = {}) {
      if (!id) {
        const msg = 'ID inválido para atualizar unidade.'
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      }

      this.saving = true
      try {
        const userId = this.getCurrentUserId()
        const groupId = this.getCurrentGroupId()

        if (!groupId) {
          const msg = 'Nenhum grupo selecionado para atualizar unidade.'
          Notify.create({ type: 'negative', message: msg })
          return { ok: false, error: msg }
        }

        let payload = { ...patch }

        // NEW: normaliza serviceIds no patch também
        payload = normalizeUnitRequestPayload(payload)

        // se vier links no patch, normaliza
        if ('unit_links' in payload || 'unitLinks' in payload) {
          payload.unit_links = normalizeLinks(payload.unit_links ?? payload.unitLinks).map(l => ({
            id: l.id ?? null,
            type: l.type ?? '',
            provider: l.provider ?? null,
            url: l.url ?? '',
            label: l.label ?? null,
            is_primary: !!l.is_primary
          }))
          delete payload.unitLinks
        }

        const resp = await api.put(`/tenant/units/${id}`, payload, {
          params: { user_id: userId, group_id: groupId }
        })

        const data = resp.data
        const normalized = normalizeUnitPayload(data)

        const idx = this.units.findIndex(u => u.id === normalized.id)
        if (idx !== -1) this.units.splice(idx, 1, normalized)

        if (this.currentUnit?.id === normalized.id) {
          this.currentUnit = {
            ...this.currentUnit,
            ...normalized
          }
        }

        this.saveToSession()
        return { ok: true, data: normalized }
      } catch (err) {
        console.error('Erro ao atualizar unidade:', err)
        const msg =
          err?.response?.data?.message ||
          'Erro ao atualizar unidade.'
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.saving = false
      }
    },

    /**
     * Remove uma unidade
     * Sempre inclui user_id e group_id (tenant)
     */
    async deleteUnit (id) {
      if (!id) {
        return { ok: false, error: 'ID inválido para excluir unidade.' }
      }

      this.deleting = true
      try {
        const userId = this.getCurrentUserId()
        const groupId = this.getCurrentGroupId()

        const { data } = await api.delete(`/tenant/units/${id}`, {
          params: { user_id: userId, group_id: groupId }
        })

        this.units = this.units.filter(u => u.id !== id)

        if (this.currentUnit.id === id) {
          this.resetCurrentUnit()
        }

        this.saveToSession()
        Notify.create({
          type: 'positive',
          message: 'Unidade removida com sucesso.'
        })

        return { ok: true, data }
      } catch (err) {
        console.error('Erro ao excluir unidade:', err)
        const msg =
          err?.response?.data?.message ||
          'Erro ao excluir unidade.'
        Notify.create({ type: 'negative', message: msg })
        return { ok: false, error: msg }
      } finally {
        this.deleting = false
      }
    }
  }
})
