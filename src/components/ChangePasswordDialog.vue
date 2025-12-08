<template>
  <q-dialog
    :model-value="props.modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    persistent
  >
    <q-card style="min-width: 460px; max-width: 600px;">
      <!-- Cabeçalho -->
      <q-card-section class="row items-center q-gutter-sm">
        <q-icon name="vpn_key" size="md" color="primary" />
        <div class="column">
          <div class="text-subtitle1 text-weight-bold">Alterar senha</div>
          <div class="text-caption text-grey-7">
            Informe sua senha atual e defina uma nova senha segura.
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Formulário -->
      <q-form ref="formRef" @submit.prevent="onSubmit">
        <q-card-section class="q-gutter-md">

          <!-- Senha atual -->
          <q-input
            v-model="form.currentPassword"
            :type="showCurrent ? 'text' : 'password'"
            label="Senha atual"
            dense
            outlined
            :rules="[rules.required]"
            :disable="loading"
            autocomplete="current-password"
            lazy-rules="ondemand"
          >
            <template #prepend><q-icon name="lock_open" /></template>
            <template #append>
              <q-icon
                :name="showCurrent ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showCurrent = !showCurrent"
              />
            </template>
          </q-input>

          <!-- Nova senha -->
          <q-input
            v-model="form.newPassword"
            :type="showNew ? 'text' : 'password'"
            label="Nova senha"
            dense
            outlined
            :rules="[rules.required, rules.strongPassword]"
            :disable="loading"
            autocomplete="new-password"
            lazy-rules="ondemand"
          >
            <template #prepend><q-icon name="lock" /></template>
            <template #append>
              <q-icon
                :name="showNew ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showNew = !showNew"
              />
            </template>
          </q-input>

          <!-- Confirmar nova senha -->
          <q-input
            v-model="form.confirmPassword"
            :type="showConfirm ? 'text' : 'password'"
            label="Confirmar nova senha"
            dense
            outlined
            :rules="[rules.required, samePassword]"
            :disable="loading"
            autocomplete="new-password"
            lazy-rules="ondemand"
          >
            <template #prepend><q-icon name="lock" /></template>
            <template #append>
              <q-icon
                :name="showConfirm ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showConfirm = !showConfirm"
              />
            </template>
          </q-input>

          <div class="text-caption text-grey-7 q-mt-xs">
            A senha deve ter no mínimo 8 caracteres, incluindo letras maiúsculas,
            minúsculas, números e símbolos.
          </div>
        </q-card-section>

        <q-separator />

        <!-- Ações -->
        <q-card-actions align="right" class="q-pa-md">
          <q-btn
            flat
            label="Cancelar"
            :disable="loading"
            @click="handleCancel"
          />
          <q-btn
            color="primary"
            label="Salvar nova senha"
            type="submit"
            :loading="loading"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const formRef = ref(null)
const loading = ref(false)
const showCurrent = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)

const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const rules = {
  required: v => (!!v || v === 0) || 'Campo obrigatório',
  strongPassword: v => {
    const s = String(v || '')
    if (s.length < 8)         return 'A senha deve ter no mínimo 8 caracteres'
    if (!/[a-z]/.test(s))     return 'Inclua pelo menos 1 letra minúscula'
    if (!/[A-Z]/.test(s))     return 'Inclua pelo menos 1 letra maiúscula'
    if (!/\d/.test(s))        return 'Inclua pelo menos 1 número'
    if (!/[^\w\s]/.test(s))   return 'Inclua pelo menos 1 símbolo (ex.: !@#$%)'
    if (/\s/.test(s))         return 'A senha não pode conter espaços'
    return true
  }
}

const samePassword = v =>
  v === form.newPassword || 'As senhas não conferem'

function resetForm () {
  form.currentPassword = ''
  form.newPassword = ''
  form.confirmPassword = ''
  showCurrent.value = false
  showNew.value = false
  showConfirm.value = false
  loading.value = false
}

// sempre que o dialog for fechado, limpa o form
watch(
  () => props.modelValue,
  (val) => {
    if (!val) resetForm()
  }
)

async function onSubmit () {
  const ok = await formRef.value.validate()
  if (!ok) return

  loading.value = true

  // emitimos o evento para o componente pai tratar.
  emit('confirm', {
    current_password: form.currentPassword,
    new_password: form.newPassword
  })

  loading.value = false
}

function handleCancel () {
  emit('update:modelValue', false)
}
</script>
