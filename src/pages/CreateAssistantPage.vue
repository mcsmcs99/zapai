<template>
  <q-page padding class="q-gutter-md">

    <!-- Topo -->
    <div class="row items-center q-gutter-sm">
      <q-btn flat round icon="arrow_back" @click="$router.back()" />
      <div class="min-w-0">
        <div class="text-h5 text-weight-bold ellipsis">Criar Novo Assistente</div>
        <div class="text-subtitle2 text-grey-7">
          Configure seu assistente virtual personalizado
        </div>
      </div>
    </div>

    <!-- Informações Básicas -->
    <q-card flat bordered class="card-section">
      <q-card-section class="row items-center q-gutter-sm">
        <div class="text-h6 text-weight-bold">Informações Básicas</div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-gutter-md">
        <div class="row q-col-gutter-md">
          <q-input
            class="col-12 col-sm-6 min-w-0"
            v-model="form.name"
            outlined dense
            label="Nome do Assistente *"
            placeholder="Ex: Assistente da Barbearia Style"
            :rules="[req]"
          />
          <q-input
            class="col-12 col-sm-6 min-w-0"
            v-model="form.businessType"
            outlined dense
            label="Tipo de Negócio *"
            placeholder="Ex: barbearia, restaurante, loja"
            :rules="[req]"
          />
        </div>

        <div class="row q-col-gutter-md">
          <q-select
            class="col-12 min-w-0"
            v-model="form.personality"
            :options="personalities"
            outlined dense emit-value map-options
            label="Personalidade do Assistente"
            popup-content-class="menu-rounded"
            :option-label="o => o.label"
            :option-value="o => o.value"
          >
            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                  <q-item-label caption>{{ scope.opt.caption }}</q-item-label>
                </q-item-section>
                <q-item-section side v-if="form.personality === scope.opt.value">
                  <q-icon name="check" color="positive" />
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <q-input
          class="min-w-0"
          v-model="form.about"
          type="textarea" autogrow outlined
          label="Informações sobre o Negócio"
          placeholder="Descreva seu negócio, diferenciais, localização, público-alvo, etc. Quanto mais detalhes, melhor será o atendimento da IA."
        />

        <q-banner class="bg-green-1 text-green-10 rounded-borders q-pa-md">
          <div class="row items-center sm:items-center items-start">
            <div class="col min-w-0">
              <div class="text-subtitle1 text-weight-medium">Ativar Assistente</div>
              <div class="text-caption">O assistente começará a responder automaticamente</div>
            </div>
            <div class="col-auto q-mt-sm q-mt-none-sm">
              <q-toggle v-model="form.active" color="positive" />
            </div>
          </div>
        </q-banner>
      </q-card-section>
    </q-card>

    <!-- Seleções adicionais -->
    <q-card flat bordered class="card-section">
      <q-card-section class="row items-center q-gutter-sm">
        <q-icon name="tune" color="primary" />
        <div class="text-h6 text-weight-bold">Escopo de Análise da IA</div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-gutter-md">
        <div class="row q-col-gutter-md">
          <q-select
            class="col-12 col-md-6 min-w-0 chips-wrap"
            v-model="form.services"
            :options="servicesOptions"
            outlined dense multiple use-chips emit-value map-options
            label="Serviços analisados pela IA"
            hint="Selecione os serviços que a IA poderá entender, sugerir e agendar"
            :option-label="o => o.label"
            :option-value="o => o.value"
          />
          <q-select
            class="col-12 col-md-6 min-w-0 chips-wrap"
            v-model="form.collaborators"
            :options="collaboratorsOptions"
            outlined dense multiple use-chips emit-value map-options
            label="Colaboradores considerados nos agendamentos"
            hint="A IA avaliará disponibilidade e regras desses colaboradores"
            :option-label="o => o.label"
            :option-value="o => o.value"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Informações de Contato -->
    <q-card flat bordered class="card-section contact-gradient">
      <q-card-section class="row items-center q-gutter-sm">
        <q-icon name="call" color="deep-purple-6" />
        <div class="text-h6 text-weight-bold">Informações de Contato</div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-gutter-md">
        <div class="row q-col-gutter-md">
          <q-input
            class="col-12 col-sm-6 min-w-0"
            v-model="form.phone"
            outlined dense
            label="Telefone/WhatsApp"
            placeholder="(11) 99999-9999"
            mask="(##) #####-####"
          />
          <q-input
            class="col-12 col-sm-6 min-w-0"
            v-model="form.address"
            outlined dense
            label="Endereço"
            placeholder="Rua, número, bairro - Cidade"
          />
          <q-input
            class="col-12 col-sm-6 min-w-0"
            v-model="form.instagram"
            outlined dense
            label="Instagram"
            placeholder="@meuinstagram"
            prefix="@"
          />
          <q-input
            class="col-12 col-sm-6 min-w-0 break-anywhere"
            v-model="form.website"
            outlined dense
            label="Website"
            placeholder="https://meusite.com.br"
          />
        </div>

        <q-banner class="bg-deep-purple-1 text-deep-purple-10 rounded-borders q-mt-md">
          <template #avatar><q-icon name="emoji_objects" /></template>
          Essas informações ajudam o assistente a fornecer respostas mais completas e úteis,
          como localização, formas de contato e redes sociais.
        </q-banner>
      </q-card-section>
    </q-card>

    <!-- Ações -->
    <div class="row justify-end q-gutter-sm">
      <q-btn flat label="Cancelar" @click="$router.back()" />
      <q-btn color="primary" label="Salvar Assistente" @click="save" />
    </div>
  </q-page>
</template>

<script setup>
import { reactive } from 'vue'

defineOptions({ name: 'CreateAssistantPage' })

const req = v => !!(v && String(v).trim()) || 'Obrigatório'

const personalities = [
  { value: 'formal',        label: 'Formal',        caption: 'Tom profissional e educado' },
  { value: 'friendly',      label: 'Amigável',      caption: 'Tom caloroso e acolhedor' },
  { value: 'balanced',      label: 'Profissional',  caption: 'Equilíbrio entre formal e amigável' },
  { value: 'casual',        label: 'Descontraído',  caption: 'Tom casual e informal' },
  { value: 'expert',        label: 'Especialista',  caption: 'Tom técnico e conhecedor' }
]

// mocks (troque por API)
const servicesOptions = [
  { value: 'corte',   label: 'Corte de Cabelo' },
  { value: 'barba',   label: 'Barba' },
  { value: 'combo',   label: 'Corte + Barba' },
  { value: 'sobr',    label: 'Sobrancelha' },
  { value: 'mass',    label: 'Massagem Relaxante' }
]
const collaboratorsOptions = [
  { value: 'joao',    label: 'João Silva (Barbeiro)' },
  { value: 'carlos',  label: 'Carlos Mendes (Barbeiro)' },
  { value: 'ana',     label: 'Ana Paula (Estética)' },
  { value: 'valdir',  label: 'Valdir Santos (Massoterapeuta)' }
]

const form = reactive({
  name: '',
  businessType: '',
  personality: 'balanced',
  about: '',
  active: false,
  services: [],
  collaborators: [],
  phone: '',
  address: '',
  instagram: '',
  website: ''
})

function save () {
  console.log('payload:', JSON.parse(JSON.stringify(form)))
}
</script>

<style scoped>
.card-section {
  border-radius: 16px;
  box-shadow: 0 8px 18px rgba(0,0,0,.04);
}

.menu-rounded { border-radius: 12px; }
.contact-gradient {
  background: linear-gradient(180deg, #ffffff 0%, #faf8ff 100%);
}

/* Helpers responsivos */
.min-w-0 { min-width: 0; }                /* evita overflow dentro do grid */
.break-anywhere { word-break: break-word; overflow-wrap: anywhere; }

/* melhor wrap dos chips em selects múltiplos */
.chips-wrap :deep(.q-field__input) { flex-wrap: wrap; }
.chips-wrap :deep(.q-chip) { margin-bottom: 4px; }

/* ajusta banner/toggle no mobile */
@media (max-width: 599px) {
  .sm\:items-center { align-items: stretch; } /* fallback no mobile */
}
</style>
