<template>
  <q-page padding class="q-gutter-md">
    <!-- Título + Ação -->
    <div class="row items-center justify-between">
      <div class="text-h4 text-weight-bold">Gerenciar Empresas</div>
      <q-btn
        color="dark" rounded unelevated icon="add" label="Nova Empresa"
        @click="openCreate()"
      />
    </div>

    <!-- Tabela -->
    <q-card flat bordered class="q-mt-md table-card">
      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id"
        flat
        separator="horizontal"
        hide-bottom
        :rows-per-page-options="[0]"
      >
        <!-- Empresa (nome + email) -->
        <template #body-cell-company="props">
          <q-td :props="props">
            <div class="text-weight-medium">{{ props.row.company }}</div>
            <div class="text-caption text-grey-7">{{ props.row.email }}</div>
          </q-td>
        </template>

        <!-- Status (badge) -->
        <template #body-cell-status="props">
          <q-td :props="props">
            <q-badge
              rounded
              :label="props.row.status"
              :color="statusMap[props.row.status].bg"
              :text-color="statusMap[props.row.status].text"
              class="q-px-sm"
            />
          </q-td>
        </template>

        <!-- Ações -->
        <template #body-cell-actions="props">
          <q-td :props="props" class="q-gutter-xs">
            <q-btn dense round outline color="grey-7" icon="edit"
                   @click="openEdit(props.row)" />
            <q-btn dense round outline color="negative" icon="delete"
                   @click="confirmRemove(props.row)" />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Dialog: Criar / Editar -->
    <q-dialog v-model="dialog.open" persistent>
      <q-card style="min-width: 420px; max-width: 92vw">
        <q-card-section class="row items-center q-gutter-sm">
          <q-icon name="apartment" />
          <div class="text-subtitle1 text-weight-bold">
            {{ dialog.mode === 'create' ? 'Nova Empresa' : 'Editar Empresa' }}
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.company" label="Empresa" outlined dense />
          <q-input v-model="form.email" label="Email" type="email" outlined dense />
          <q-input v-model="form.plan" label="Plano" outlined dense />
          <q-select
            v-model="form.status" :options="statusOptions"
            label="Status" emit-value map-options outlined dense
          />
          <q-input v-model="form.renewal" label="Data de Renovação" outlined dense>
            <template #append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="form.renewal" mask="DD/MM/YYYY" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </q-card-section>
        <q-separator />
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" :label="dialog.mode === 'create' ? 'Criar' : 'Salvar'"
                 @click="save()" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog: Remover -->
    <q-dialog v-model="removeDlg.open">
      <q-card style="min-width: 360px">
        <q-card-section class="row items-center q-gutter-sm">
          <q-icon name="warning" color="negative" />
          <div class="text-subtitle1 text-weight-bold">Remover empresa</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          Tem certeza que deseja remover
          <b>{{ removeDlg.row?.company }}</b>?
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="negative" label="Remover" @click="remove()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive } from 'vue'

defineOptions({ name: 'CompaniesPage' })

/* ----------------- tabela ----------------- */
const columns = [
  { name: 'company', label: 'Empresa', field: 'company', align: 'left' },
  { name: 'plan',    label: 'Plano',   field: 'plan',    align: 'left' },
  { name: 'status',  label: 'Status',  field: 'status',  align: 'left' },
  { name: 'renewal', label: 'Data de Renovação', field: 'renewal', align: 'left' },
  { name: 'actions', label: 'Ações', align: 'right' }
]

const rows = ref([
  { id: 1, company: 'Barbearia do Zé',   email: 'ze@barbearia.com',   plan: 'N/A', status: 'active', renewal: '14/02/2025' },
  { id: 2, company: 'Pizzaria Mamma Mia',email: 'maria@pizzaria.com', plan: 'N/A', status: 'trial',  renewal: '29/01/2025' }
])

const statusMap = {
  active: { bg: 'green-1',  text: 'green-9'  },
  trial:  { bg: 'indigo-1', text: 'indigo-10' },
  paused: { bg: 'orange-1', text: 'orange-10' }
}
const statusOptions = [
  { label: 'active', value: 'active' },
  { label: 'trial',  value: 'trial'  },
  { label: 'paused', value: 'paused' }
]

/* ----------------- criar/editar ----------------- */
const dialog = reactive({ open: false, mode: 'create' })
const form = reactive({ id: null, company: '', email: '', plan: 'N/A', status: 'trial', renewal: '' })

function openCreate () {
  Object.assign(form, { id: null, company: '', email: '', plan: 'N/A', status: 'trial', renewal: '' })
  dialog.mode = 'create'
  dialog.open = true
}
function openEdit (row) {
  Object.assign(form, row)
  dialog.mode = 'edit'
  dialog.open = true
}
function save () {
  if (dialog.mode === 'create') {
    const id = Math.max(0, ...rows.value.map(r => r.id)) + 1
    rows.value.push({ ...form, id })
  } else {
    const idx = rows.value.findIndex(r => r.id === form.id)
    if (idx > -1) rows.value[idx] = { ...form }
  }
  dialog.open = false
}

/* ----------------- remover ----------------- */
const removeDlg = reactive({ open: false, row: null })
function confirmRemove (row) {
  removeDlg.row = row
  removeDlg.open = true
}
function remove () {
  rows.value = rows.value.filter(r => r.id !== removeDlg.row.id)
  removeDlg.open = false
}
</script>

<style scoped>
.table-card { border-radius: 14px; box-shadow: 0 6px 16px rgba(0,0,0,.06); }
.q-table tbody td, .q-table thead th { padding: 16px; }
</style>
