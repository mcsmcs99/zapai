<template>
  <q-page padding class="q-gutter-md">
    <!-- Título + ação -->
    <div class="row items-center justify-between">
      <div>
        <div class="text-h4 text-weight-bold">Unidades</div>
        <div class="text-subtitle2 text-grey-7">
          Gerencie as unidades físicas do seu negócio
        </div>
      </div>

      <q-btn
        color="primary"
        icon="add"
        label="Nova Unidade"
        rounded
        unelevated
        @click="openCreate"
      />
    </div>

    <!-- Grid de cards -->
    <div class="row q-col-gutter-xl q-mt-sm">
      <div v-for="u in units" :key="u.id" class="col-12 col-sm-6 col-md-4">
        <q-card flat bordered class="unit-card">
          <q-card-section class="row items-start no-wrap">
            <q-avatar size="44px" color="indigo-6" text-color="white" rounded>
              <q-icon name="store" />
            </q-avatar>

            <div class="q-ml-md col">
              <div class="row items-start">
                <div class="text-subtitle1 text-weight-bold ellipsis">
                  {{ u.name }}
                </div>
                <q-space />
                <q-btn flat round dense icon="more_vert">
                  <q-menu>
                    <q-list style="min-width: 160px">
                      <q-item clickable @click="openEdit(u)">
                        <q-item-section avatar>
                          <q-icon name="edit" />
                        </q-item-section>
                        <q-item-section>Editar</q-item-section>
                      </q-item>

                      <q-item clickable @click="toggleActive(u)">
                        <q-item-section avatar>
                          <q-icon :name="u.is_active ? 'pause' : 'play_arrow'" />
                        </q-item-section>
                        <q-item-section>
                          {{ u.is_active ? 'Desativar' : 'Ativar' }}
                        </q-item-section>
                      </q-item>

                      <q-separator />
                      <q-item clickable class="text-negative" @click="confirmRemove(u)">
                        <q-item-section avatar>
                          <q-icon name="delete" />
                        </q-item-section>
                        <q-item-section>Excluir</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </div>

              <!-- Contatos -->
              <div class="row items-center q-mt-sm">
                <div class="col-7 text-grey-7">
                  <q-icon name="call" class="q-mr-xs" /> Telefone
                </div>
                <div class="col-5 text-right text-weight-medium">
                  {{ u.phone || '-' }}
                </div>

                <div class="col-7 text-grey-7 q-mt-xs">
                  <q-icon name="mail" class="q-mr-xs" /> Email
                </div>
                <div class="col-5 text-right q-mt-xs text-weight-medium ellipsis">
                  {{ u.email || '-' }}
                </div>
              </div>

              <!-- Endereço resumido -->
              <div class="q-mt-sm text-body2">
                <div class="text-grey-7">
                  <q-icon name="place" class="q-mr-xs" />
                  {{ shortAddress(u) }}
                </div>
                <div class="text-caption text-grey-6 q-mt-xs">
                  {{ u.timezone || 'Timezone não definido' }}
                </div>
              </div>

              <!-- Status badge -->
              <div class="q-mt-sm">
                <q-badge
                  rounded
                  :color="u.is_active ? 'green-1' : 'grey-3'"
                  :text-color="u.is_active ? 'green-9' : 'grey-8'"
                  :label="u.is_active ? 'Ativa' : 'Inativa'"
                />
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div class="text-caption text-grey-7 q-mb-xs">Links:</div>
            <div v-if="(u.unit_links || []).length">
              <q-badge
                v-for="l in (u.unit_links || []).slice(0, 4)"
                :key="l.id || l.url"
                class="q-mr-xs q-mb-xs"
                color="indigo-1"
                text-color="indigo-10"
                rounded
                :label="badgeLabel(l)"
              />
              <div
                v-if="(u.unit_links || []).length > 4"
                class="text-caption text-grey-6 q-mt-xs"
              >
                +{{ (u.unit_links || []).length - 4 }} links
              </div>
            </div>
            <div v-else class="text-grey-6">Nenhum link</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Dialog Remover -->
    <q-dialog v-model="rm.open">
      <q-card style="min-width:360px">
        <q-card-section class="row items-center q-gutter-sm">
          <q-icon name="warning" color="negative" />
          <div class="text-subtitle1 text-weight-bold">Excluir unidade</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          Tem certeza que deseja excluir <b>{{ rm.row?.name }}</b>?
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="negative" label="Excluir" @click="remove" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Modal de criar/editar -->
    <UnitEditorDialog
      v-model="dlg.open"
      :mode="dlg.mode"
      :value="unitsStore.currentUnit"
      @save="saveUnit"
    />
  </q-page>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import UnitEditorDialog from 'components/UnitEditorDialog.vue'
import { useUnitsStore } from 'src/stores/tenant/units'

defineOptions({ name: 'UnitsPage' })

const unitsStore = useUnitsStore()
const { units } = storeToRefs(unitsStore)

/* Helpers */
function shortAddress (u) {
  const parts = [
    u.address_line1,
    u.address_line2,
    u.sublocality,
    u.locality,
    u.administrative_area,
    u.postal_code
  ].filter(Boolean)

  return parts.length ? parts.join(', ') : 'Endereço não informado'
}

function badgeLabel (l) {
  const provider = l.provider ? ` (${l.provider})` : ''
  return `${l.type}${provider}`
}

/* Modal de criar/editar */
const dlg = reactive({
  open: false,
  mode: 'create' // 'create' | 'edit'
})

function openCreate () {
  dlg.mode = 'create'
  unitsStore.resetCurrentUnit()
  dlg.open = true
}

function openEdit (row) {
  dlg.mode = 'edit'
  unitsStore.setCurrentUnit(row)
  dlg.open = true
}

async function saveUnit (data) {
  unitsStore.setCurrentUnit(data)
  const resp = await unitsStore.saveCurrentUnit()

  if (resp.ok && dlg.mode === 'create') {
    await unitsStore.fetchUnits()
  }
}

/* Remover */
const rm = reactive({ open: false, row: null })

function confirmRemove (row) {
  rm.row = row
  rm.open = true
}

async function remove () {
  if (!rm.row) return
  const resp = await unitsStore.deleteUnit(rm.row.id)
  if (resp.ok) {
    rm.open = false
    rm.row = null
  }
}

/* Ativar / desativar */
async function toggleActive (unit) {
  unitsStore.setCurrentUnit({ ...unit, is_active: !unit.is_active })
  await unitsStore.saveCurrentUnit()
}

/* Lifecycle */
onMounted(async () => {
  unitsStore.loadFromSession?.()
  await unitsStore.fetchUnits()
})
</script>

<style scoped>
.unit-card {
  border-radius: 14px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
}
</style>
