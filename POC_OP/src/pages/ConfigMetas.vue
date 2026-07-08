<template>
  <q-page class="config-page q-pa-lg">

    <div class="page-header q-mb-xl">
      <div class="row items-center gap-sm q-mb-xs">
        <q-icon name="mdi-bullseye-arrow" size="28px" color="primary" />
        <div class="text-h5 text-weight-bold">Configuração de Metas</div>
      </div>
      <div class="text-body2 text-grey-6">
        Defina as metas semanais por perfil. A meta mensal é calculada automaticamente (semanal × 4 semanas).
      </div>
    </div>

    <div class="row q-col-gutter-lg">

      <!-- Operacionais -->
      <div class="col-12 col-md-5">
        <q-card flat bordered class="meta-card">
          <q-card-section class="meta-card__header">
            <div class="row items-center no-wrap gap-sm">
              <q-icon name="mdi-account-hard-hat" size="26px" />
              <div>
                <div class="text-subtitle1 text-weight-bold">Operacionais</div>
                <div class="text-caption text-grey-5">Equipes e técnicos de campo</div>
              </div>
            </div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <div class="meta-row">
              <div class="meta-row__label">
                <q-icon name="mdi-calendar-week" size="18px" class="q-mr-xs" />
                Meta semanal
              </div>
              <div class="meta-row__control">
                <q-btn flat round dense icon="mdi-minus" @click="decrement('normais')" :disable="normaisInput <= 1" />
                <div class="meta-input-wrap">
                  <q-input
                    v-model.number="normaisInput"
                    type="number"
                    dense outlined
                    input-class="text-center text-weight-bold"
                    min="1" max="99"
                    class="meta-input"
                  />
                  <span class="meta-unit">obs/sem</span>
                </div>
                <q-btn flat round dense icon="mdi-plus" @click="increment('normais')" :disable="normaisInput >= 99" />
              </div>
            </div>

            <div class="meta-derived">
              <q-icon name="mdi-calendar-month" size="16px" class="q-mr-xs" />
              Meta mensal:
              <strong>{{ normaisInput * 4 }} obs/mês</strong>
              <span class="text-grey-5 q-ml-xs">(× 4 semanas)</span>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- SESMT / Segurança -->
      <div class="col-12 col-md-5">
        <q-card flat bordered class="meta-card meta-card--sesmt">
          <q-card-section class="meta-card__header meta-card__header--sesmt">
            <div class="row items-center no-wrap gap-sm">
              <q-icon name="mdi-shield-account" size="26px" />
              <div>
                <div class="text-subtitle1 text-weight-bold">SESMT / Segurança</div>
                <div class="text-caption text-grey-5">Pessoal de segurança do trabalho</div>
              </div>
            </div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <div class="meta-row">
              <div class="meta-row__label">
                <q-icon name="mdi-calendar-week" size="18px" class="q-mr-xs" />
                Meta semanal
              </div>
              <div class="meta-row__control">
                <q-btn flat round dense icon="mdi-minus" @click="decrement('seguranca')" :disable="segurancaInput <= 1" />
                <div class="meta-input-wrap">
                  <q-input
                    v-model.number="segurancaInput"
                    type="number"
                    dense outlined
                    input-class="text-center text-weight-bold"
                    min="1" max="99"
                    class="meta-input"
                  />
                  <span class="meta-unit">obs/sem</span>
                </div>
                <q-btn flat round dense icon="mdi-plus" @click="increment('seguranca')" :disable="segurancaInput >= 99" />
              </div>
            </div>

            <div class="meta-derived">
              <q-icon name="mdi-calendar-month" size="16px" class="q-mr-xs" />
              Meta mensal:
              <strong>{{ segurancaInput * 4 }} obs/mês</strong>
              <span class="text-grey-5 q-ml-xs">(× 4 semanas)</span>
            </div>
          </q-card-section>
        </q-card>
      </div>

    </div>

    <!-- Actions -->
    <div class="row q-mt-xl q-gutter-sm">
      <q-btn
        label="Salvar metas"
        icon="mdi-content-save"
        color="primary"
        unelevated
        :loading="saving"
        @click="handleSave"
      />
      <q-btn
        label="Restaurar padrões"
        icon="mdi-restore"
        flat
        color="grey-6"
        @click="handleReset"
      />
    </div>

    <!-- Info card -->
    <q-card flat bordered class="info-card q-mt-xl">
      <q-card-section class="row items-start no-wrap gap-sm">
        <q-icon name="mdi-information-outline" size="20px" color="info" class="q-mt-xs" />
        <div>
          <div class="text-body2 text-weight-medium q-mb-xs">Como as metas são usadas</div>
          <ul class="text-body2 text-grey-7 q-mb-none" style="padding-left:18px">
            <li>As metas são aplicadas automaticamente nas páginas de Acompanhamento Semanal e Mensal.</li>
            <li>Observadores com gerência <strong>SESMT</strong> usam a meta de Segurança; os demais usam a meta Operacional.</li>
            <li>As configurações ficam salvas no navegador e persistem entre sessões.</li>
          </ul>
        </div>
      </q-card-section>
    </q-card>

  </q-page>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useQuasar } from "quasar";
import { useGoals } from "@/composables/useGoals";

const $q = useQuasar();
const { normaisSemanal, segurancaSemanal, save } = useGoals();

const normaisInput   = ref(normaisSemanal.value);
const segurancaInput = ref(segurancaSemanal.value);
const saving = ref(false);

function increment(tipo: "normais" | "seguranca") {
  if (tipo === "normais" && normaisInput.value < 99) normaisInput.value++;
  if (tipo === "seguranca" && segurancaInput.value < 99) segurancaInput.value++;
}

function decrement(tipo: "normais" | "seguranca") {
  if (tipo === "normais" && normaisInput.value > 1) normaisInput.value--;
  if (tipo === "seguranca" && segurancaInput.value > 1) segurancaInput.value--;
}

function handleSave() {
  saving.value = true;
  setTimeout(() => {
    save(normaisInput.value, segurancaInput.value);
    saving.value = false;
    $q.notify({
      type: "positive",
      message: "Metas salvas com sucesso!",
      caption: `Operacional: ${normaisInput.value}/sem · SESMT: ${segurancaInput.value}/sem`,
      icon: "mdi-check-circle",
      position: "top-right",
      timeout: 3000,
    });
  }, 400);
}

function handleReset() {
  normaisInput.value   = 2;
  segurancaInput.value = 5;
  $q.notify({
    type: "info",
    message: "Valores restaurados para o padrão",
    caption: "Clique em Salvar para confirmar",
    position: "top-right",
    timeout: 2500,
  });
}
</script>

<style scoped lang="scss">
$brand: #8B1C2B;

.config-page {
  max-width: 900px;
  margin: 0 auto;
}

.gap-sm { gap: 10px; }

.meta-card {
  border-radius: 14px;
  border-color: #e2e8f0;
  overflow: hidden;

  &__header {
    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
    color: #15803d;
    padding: 16px 20px;
  }

  &--sesmt &__header { background: linear-gradient(135deg, #fff1f2, #ffe4e6); color: $brand; }
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0 8px;
  gap: 12px;
  flex-wrap: wrap;

  &__label {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    display: flex;
    align-items: center;
  }

  &__control {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.meta-input-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-input {
  width: 72px;
  :deep(.q-field__control) { border-radius: 8px; }
  :deep(input) { font-size: 20px; font-weight: 700; }
}

.meta-unit {
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
}

.meta-derived {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #64748b;
  padding: 8px 0 12px;
  border-top: 1px solid #f1f5f9;
  margin-top: 4px;
}

.info-card {
  border-radius: 12px;
  background: #f8fafc;
  border-color: #e2e8f0;
  max-width: 680px;
}

.body--dark {
  .meta-card { border-color: #334155; }
  .meta-card__header { background: linear-gradient(135deg, #052e16, #14532d) !important; color: #4ade80 !important; }
  .meta-card--sesmt .meta-card__header { background: linear-gradient(135deg, #3b0a0f, #5c1020) !important; color: #fca5a5 !important; }
  .meta-derived { border-top-color: #1e293b; color: #94a3b8; }
  .info-card { background: #1e293b; border-color: #334155; }
}
</style>
