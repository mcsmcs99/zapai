<template>
  <q-page padding class="q-gutter-md">
    <!-- Título + ação -->
    <div class="row items-center justify-between">
      <div>
        <div class="text-h4 text-weight-bold">Serviços</div>
        <div class="text-subtitle2 text-grey-7">
          Gerencie os serviços oferecidos no seu estabelecimento
        </div>
      </div>

      <q-btn
        color="primary"
        icon="add"
        label="Novo Serviço"
        rounded
        unelevated
        @click="openCreate"
      />
    </div>

    <!-- Grid de cards -->
    <div class="row q-col-gutter-xl q-mt-sm">
      <div
        v-for="s in services"
        :key="s.id"
        class="col-12 col-sm-6 col-md-4"
      >
        <q-card flat bordered class="service-card">
          <q-card-section class="row items-start no-wrap">
            <q-avatar size="44px" color="blue-6" text-color="white" rounded>
              <q-icon name="content_cut" />
            </q-avatar>

            <div class="q-ml-md col">
              <div class="row items-start">
                <div class="text-subtitle1 text-weight-bold ellipsis">
                  {{ s.title }}
                </div>
                <q-space />
                <q-btn flat round dense icon="more_vert">
                  <q-menu>
                    <q-list style="min-width: 160px">
                      <q-item clickable @click="openEdit(s)">
                        <q-item-section avatar>
                          <q-icon name="edit" />
                        </q-item-section>
                        <q-item-section>Editar</q-item-section>
                      </q-item>

                      <q-item clickable @click="toggleActive(s)">
                        <q-item-section avatar>
                          <q-icon
                            :name="s.status === 'active' ? 'pause' : 'play_arrow'"
                          />
                        </q-item-section>
                        <q-item-section>
                          {{ s.status === 'active' ? 'Desativar' : 'Ativar' }}
                        </q-item-section>
                      </q-item>

                      <q-separator />
                      <q-item
                        clickable
                        class="text-negative"
                        @click="confirmRemove(s)"
                      >
                        <q-item-section avatar>
                          <q-icon name="delete" />
                        </q-item-section>
                        <q-item-section>Excluir</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </div>

              <!-- preço/duração -->
              <div class="row items-center q-mt-sm">
                <div class="col-7 text-grey-7">
                  <q-icon name="attach_money" class="q-mr-xs" /> Preço
                </div>
                <div class="col-5 text-right text-weight-bold text-positive">
                  {{ currency(s.price) }}
                </div>

                <div class="col-7 text-grey-7 q-mt-xs">
                  <q-icon name="schedule" class="q-mr-xs" /> Duração
                </div>
                <div class="col-5 text-right q-mt-xs text-weight-medium">
                  {{ s.duration }} min
                </div>
              </div>

              <div class="q-mt-sm text-body2">
                {{ s.description }}
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <!-- Colaboradores -->
          <q-card-section>
            <div class="text-caption text-grey-7 q-mb-xs">
              Colaboradores:
            </div>

            <div v-if="(getCollaboratorIds(s) || []).length">
              <q-badge
                v-for="c in mapCollaborators(getCollaboratorIds(s))"
                :key="c.id"
                class="q-mr-xs q-mb-xs"
                color="indigo-1"
                text-color="indigo-10"
                rounded
                :label="c.name"
              />
            </div>
            <div v-else class="text-grey-6">Nenhum colaborador</div>
          </q-card-section>

          <!-- Unidades (novo) -->
          <q-card-section class="q-pt-none">
            <div class="text-caption text-grey-7 q-mb-xs">
              Unidades:
            </div>

            <div v-if="(getUnitIds(s) || []).length">
              <q-badge
                v-for="u in mapUnits(getUnitIds(s))"
                :key="u.id"
                class="q-mr-xs q-mb-xs"
                color="teal-1"
                text-color="teal-10"
                rounded
                :label="u.name"
              />
            </div>
            <div v-else class="text-grey-6">Nenhuma unidade</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Dialog Remover -->
    <q-dialog v-model="rm.open">
      <q-card style="min-width:360px">
        <q-card-section class="row items-center q-gutter-sm">
          <q-icon name="warning" color="negative" />
          <div class="text-subtitle1 text-weight-bold">Excluir serviço</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          Tem certeza que deseja excluir <b>{{ rm.row?.title }}</b>?
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="negative" label="Excluir" @click="remove" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Modal de criar/editar -->
    <ServiceEditorDialog
      v-model="dlg.open"
      :mode="dlg.mode"
      :value="servicesStore.currentService"
      :collaborators="collaborators"
      :units="units"
      @save="saveService"
    />
  </q-page>
</template>

<script setup>
import { reactive, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import ServiceEditorDialog from 'components/ServiceEditorDialog.vue'
import { useServicesStore } from 'src/stores/tenant/services'
import { useStaffStore } from 'src/stores/tenant/staff'
import { useUnitsStore } from 'src/stores/tenant/units'

defineOptions({ name: 'ServicesPage' })

const servicesStore = useServicesStore()
const staffStore = useStaffStore()
const unitsStore = useUnitsStore()

const { services } = storeToRefs(servicesStore)
const { staff } = storeToRefs(staffStore)
const { units: unitsRef } = storeToRefs(unitsStore)

/* Colaboradores disponíveis = staff ativos do tenant */
const collaborators = computed(() =>
  (staff.value || []).filter(s => s.status === 'active')
)

/* Unidades disponíveis = units ativas do tenant */
const units = computed(() =>
  (unitsRef.value || []).filter(u => u.is_active === true)
)


/* Helpers */
const currency = v =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(v || 0))

/**
 * compat: caso algum endpoint ainda devolva collaborator_ids,
 * este helper pega a melhor chave.
 */
const getCollaboratorIds = (service) =>
  service?.collaboratorIds ?? service?.collaborator_ids ?? []

const mapCollaborators = (ids) =>
  collaborators.value.filter(c => (ids || []).includes(c.id))

/**
 * compat: unitIds / unit_ids
 */
const getUnitIds = (service) =>
  service?.unitIds ?? service?.unit_ids ?? []

const mapUnits = (ids) =>
  units.value.filter(u => (ids || []).includes(u.id))

/* Modal de criar/editar */
const dlg = reactive({
  open: false,
  mode: 'create'
})

function openCreate () {
  dlg.mode = 'create'
  servicesStore.resetCurrentService()
  dlg.open = true
}

function openEdit (row) {
  dlg.mode = 'edit'
  servicesStore.setCurrentService(row)
  dlg.open = true
}

async function saveService (data) {
  servicesStore.setCurrentService(data)
  const resp = await servicesStore.saveCurrentService()

  if (resp.ok && dlg.mode === 'create') {
    await servicesStore.fetchServices()
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
  const resp = await servicesStore.deleteService(rm.row.id)
  if (resp.ok) {
    rm.open = false
    rm.row = null
  }
}

/* Ativar / desativar */
async function toggleActive (service) {
  const newStatus = service.status === 'active' ? 'inactive' : 'active'
  servicesStore.setCurrentService({ ...service, status: newStatus })
  await servicesStore.saveCurrentService()
}

/* Lifecycle */
onMounted(async () => {
  servicesStore.loadFromSession()
  await servicesStore.fetchServices()

  // carrega colaboradores
  staffStore.loadFromSession?.()
  await staffStore.fetchStaff()

  // carrega unidades (novo)
  unitsStore.loadFromSession?.()
  await unitsStore.fetchUnits?.()
})
</script>

<style scoped>
.service-card {
  border-radius: 14px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
}
</style>
