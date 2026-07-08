<template>
  <q-page class="config-page q-pa-lg">

    <div class="page-header q-mb-lg">
      <div class="row items-center gap-sm q-mb-xs">
        <q-icon name="mdi-bullseye-arrow" size="28px" color="primary" />
        <div class="text-h5 text-weight-bold">Configuração de Metas</div>
      </div>
      <div class="text-body2 text-grey-6">
        Defina as metas semanais por perfil e mês. A meta mensal é calculada automaticamente (semanal × 4 semanas).
      </div>
    </div>

    <!-- Seletor de Mês/Ano -->
    <q-card flat bordered class="period-card q-mb-lg">
      <q-card-section class="q-pa-md">
        <div class="row items-center gap-sm q-mb-sm">
          <q-icon name="mdi-calendar-range" size="20px" color="primary" />
          <span class="text-subtitle2 text-weight-bold">Período de referência</span>
        </div>
        <div class="row items-center q-gutter-md">
          <div class="fgroup">
            <span class="fgroup__label">ANO</span>
            <div class="pill-group">
              <button
                v-for="a in anos" :key="a"
                :class="['pill', { 'pill--active': selectedAno === a }]"
                @click="selectedAno = a"
              >{{ a }}</button>
            </div>
          </div>
          <div class="fgroup">
            <span class="fgroup__label">MÊS</span>
            <div class="pill-group">
              <button
                v-for="m in meses" :key="m.value"
                :class="['pill', { 'pill--active': selectedMes === m.value }]"
                @click="onChangeMes(m.value)"
              >{{ m.label }}</button>
            </div>
          </div>
        </div>
        <div v-if="!hasGoalDefined(selectedAno, selectedMes)" class="q-mt-sm row items-center gap-sm text-caption text-orange-8">
          <q-icon name="mdi-alert-circle-outline" size="14px" />
          Sem meta configurada para este mês — exibindo valores padrão.
        </div>
        <div v-else class="q-mt-sm row items-center gap-sm text-caption text-positive">
          <q-icon name="mdi-check-circle-outline" size="14px" />
          Meta configurada para este mês.
        </div>
      </q-card-section>
    </q-card>

    <!-- Cards de meta -->
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
            <li>Cada mês pode ter uma meta diferente — selecione o mês e salve.</li>
            <li>As configurações ficam salvas no navegador e persistem entre sessões.</li>
          </ul>
        </div>
      </q-card-section>
    </q-card>

  </q-page>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useQuasar } from "quasar";
import { useGoals } from "@/composables/useGoals";

const $q = useQuasar();
const { getMonthGoal, save, hasGoalDefined } = useGoals();

const now = new Date();
const anos = [2024, 2025, 2026];
const meses = [
  { value: 1,  label: "jan" }, { value: 2,  label: "fev" },
  { value: 3,  label: "mar" }, { value: 4,  label: "abr" },
  { value: 5,  label: "mai" }, { value: 6,  label: "jun" },
  { value: 7,  label: "jul" }, { value: 8,  label: "ago" },
  { value: 9,  label: "set" }, { value: 10, label: "out" },
  { value: 11, label: "nov" }, { value: 12, label: "dez" },
];

const selectedAno = ref(now.getFullYear());
const selectedMes = ref(now.getMonth() + 1);

const normaisInput   = ref(2);
const segurancaInput = ref(5);
const saving = ref(false);

function loadInputsForPeriod(ano: number, mes: number) {
  const g = getMonthGoal(ano, mes);
  normaisInput.value   = g.normais_semanal;
  segurancaInput.value = g.seguranca_semanal;
}

// Carrega ao iniciar e ao trocar de mês/ano
loadInputsForPeriod(selectedAno.value, selectedMes.value);
watch([selectedAno, selectedMes], ([ano, mes]) => loadInputsForPeriod(ano, mes));

function onChangeMes(mes: number) {
  selectedMes.value = mes;
}

function increment(tipo: "normais" | "seguranca") {
  if (tipo === "normais" && normaisInput.value < 99) normaisInput.value++;
  if (tipo === "seguranca" && segurancaInput.value < 99) segurancaInput.value++;
}

function decrement(tipo: "normais" | "seguranca") {
  if (tipo === "normais" && normaisInput.value > 1) normaisInput.value--;
  if (tipo === "seguranca" && segurancaInput.value > 1) segurancaInput.value--;
}

const mesLabel = (mes: number) => meses.find(m => m.value === mes)?.label ?? "";

function handleSave() {
  saving.value = true;
  setTimeout(() => {
    save(selectedAno.value, selectedMes.value, normaisInput.value, segurancaInput.value);
    saving.value = false;
    $q.notify({
      type: "positive",
      message: `Metas de ${mesLabel(selectedMes.value)}/${selectedAno.value} salvas!`,
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
$border: #e2e8f0;
$label-color: #94a3b8;
$inactive-bg: #f1f5f9;
$inactive-text: #475569;

.config-page { max-width: 960px; margin: 0 auto; }
.gap-sm { gap: 10px; }

// ── Period card ───────────────────────────────────────────────────────────────
.period-card {
  border-radius: 12px;
  border-color: $border;
}

// ── Filter pills (same pattern as other pages) ────────────────────────────────
.fgroup {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fgroup__label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .8px;
  color: $label-color;
}

.pill-group {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.pill {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border: 1.5px solid $border;
  border-radius: 999px;
  background: $inactive-bg;
  color: $inactive-text;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background .15s, color .15s, border-color .15s;
  white-space: nowrap;

  &:hover:not(.pill--active) { border-color: $brand; color: $brand; }

  &--active {
    background: $brand;
    color: #fff;
    border-color: $brand;
    box-shadow: 0 2px 8px rgba($brand, .35);
    font-weight: 600;
  }
}

// ── Meta cards ────────────────────────────────────────────────────────────────
.meta-card {
  border-radius: 14px;
  border-color: $border;
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

.meta-input-wrap { display: flex; align-items: center; gap: 6px; }

.meta-input {
  width: 72px;
  :deep(.q-field__control) { border-radius: 8px; }
  :deep(input) { font-size: 20px; font-weight: 700; }
}

.meta-unit { font-size: 12px; color: #94a3b8; white-space: nowrap; }

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
  border-color: $border;
  max-width: 680px;
}

// ── Dark mode ─────────────────────────────────────────────────────────────────
.body--dark {
  .period-card, .meta-card, .info-card { border-color: #334155; }
  .meta-card__header { background: linear-gradient(135deg, #052e16, #14532d) !important; color: #4ade80 !important; }
  .meta-card--sesmt .meta-card__header { background: linear-gradient(135deg, #3b0a0f, #5c1020) !important; color: #fca5a5 !important; }
  .meta-derived { border-top-color: #1e293b; color: #94a3b8; }
  .info-card { background: #1e293b; border-color: #334155; }
  .pill { background: #1e293b; border-color: #334155; color: #94a3b8; }
  .pill--active { background: $brand; color: #fff; border-color: $brand; }
}
</style>
