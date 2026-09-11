<template>
  <q-page class="cm-page">

    <!-- ── Hero Header ─────────────────────────────────────────────────────────── -->
    <div class="cm-hero">
      <div class="cm-hero__inner">
        <div class="cm-hero__icon">
          <q-icon name="mdi-bullseye-arrow" size="32px" />
        </div>
        <div>
          <h1 class="cm-hero__title">Configuração de Metas</h1>
          <p class="cm-hero__sub">Defina as metas semanais por perfil e mês. A meta mensal é calculada automaticamente (semanal × 4 semanas).</p>
        </div>
      </div>
    </div>

    <!-- ── Período de referência ───────────────────────────────────────────────── -->
    <div class="cm-section">
      <div class="cm-period">
        <div class="cm-period__header">
          <q-icon name="mdi-calendar-range" size="18px" />
          <span>Período de referência</span>
        </div>
        <div class="cm-period__filters">
          <div class="cm-fgroup">
            <span class="cm-flabel">ANO</span>
            <div class="cm-pills">
              <button
                v-for="a in anos" :key="a"
                :class="['cm-pill', selectedAno === a && 'cm-pill--on']"
                @click="selectedAno = a"
              >{{ a }}</button>
            </div>
          </div>
          <div class="cm-fgroup cm-fgroup--mes">
            <span class="cm-flabel">MÊS</span>
            <div class="cm-pills">
              <button
                v-for="m in meses" :key="m.value"
                :class="['cm-pill', selectedMes === m.value && 'cm-pill--on']"
                @click="onChangeMes(m.value)"
              >{{ m.label }}</button>
            </div>
          </div>
        </div>
        <div class="cm-period__status" :class="hasGoalDefined(selectedAno, selectedMes) ? 'cm-period__status--ok' : 'cm-period__status--warn'">
          <q-icon :name="hasGoalDefined(selectedAno, selectedMes) ? 'mdi-check-circle-outline' : 'mdi-alert-circle-outline'" size="15px" />
          <span v-if="hasGoalDefined(selectedAno, selectedMes)">Meta configurada para este mês.</span>
          <span v-else>Sem meta configurada para este mês — exibindo valores padrão.</span>
        </div>
      </div>
    </div>

    <!-- ── Cards de meta ──────────────────────────────────────────────────────── -->
    <div class="cm-section">
      <div class="cm-meta-grid">

        <!-- Operacionais -->
        <div class="cm-meta-card cm-meta-card--op">
          <div class="cm-meta-card__head">
            <div class="cm-meta-card__head-icon">
              <q-icon name="mdi-account-hard-hat" size="28px" />
            </div>
            <div>
              <div class="cm-meta-card__head-title">Operacionais</div>
              <div class="cm-meta-card__head-sub">Equipes e técnicos de campo</div>
            </div>
          </div>
          <div class="cm-meta-card__body">
            <div class="cm-meta-row">
              <div class="cm-meta-row__label">
                <q-icon name="mdi-calendar-week" size="16px" />
                Meta semanal
              </div>
              <div class="cm-meta-row__ctrl">
                <button class="cm-stepper" :disabled="normaisInput <= 1" @click="decrement('normais')">−</button>
                <div class="cm-counter">
                  <input
                    v-model.number="normaisInput"
                    type="number" min="1" max="99"
                    class="cm-counter__input"
                  />
                  <span class="cm-counter__unit">obs/sem</span>
                </div>
                <button class="cm-stepper" :disabled="normaisInput >= 99" @click="increment('normais')">+</button>
              </div>
            </div>
            <div class="cm-derived">
              <q-icon name="mdi-calendar-month" size="15px" />
              Meta mensal: <strong>{{ normaisInput * 4 }} obs/mês</strong>
              <span class="cm-derived__hint">× 4 semanas</span>
            </div>
          </div>
        </div>

        <!-- SESMT -->
        <div class="cm-meta-card cm-meta-card--sesmt">
          <div class="cm-meta-card__head cm-meta-card__head--sesmt">
            <div class="cm-meta-card__head-icon">
              <q-icon name="mdi-shield-account" size="28px" />
            </div>
            <div>
              <div class="cm-meta-card__head-title">SESMT / Segurança</div>
              <div class="cm-meta-card__head-sub">Pessoal de segurança do trabalho</div>
            </div>
          </div>
          <div class="cm-meta-card__body">
            <div class="cm-meta-row">
              <div class="cm-meta-row__label">
                <q-icon name="mdi-calendar-week" size="16px" />
                Meta semanal
              </div>
              <div class="cm-meta-row__ctrl">
                <button class="cm-stepper cm-stepper--sesmt" :disabled="segurancaInput <= 1" @click="decrement('seguranca')">−</button>
                <div class="cm-counter">
                  <input
                    v-model.number="segurancaInput"
                    type="number" min="1" max="99"
                    class="cm-counter__input"
                  />
                  <span class="cm-counter__unit">obs/sem</span>
                </div>
                <button class="cm-stepper cm-stepper--sesmt" :disabled="segurancaInput >= 99" @click="increment('seguranca')">+</button>
              </div>
            </div>
            <div class="cm-derived">
              <q-icon name="mdi-calendar-month" size="15px" />
              Meta mensal: <strong>{{ segurancaInput * 4 }} obs/mês</strong>
              <span class="cm-derived__hint">× 4 semanas</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Ações -->
      <div class="cm-actions">
        <button class="cm-btn cm-btn--save" :class="{ 'cm-btn--loading': saving }" :disabled="saving" @click="handleSave">
          <q-icon name="mdi-content-save" size="18px" />
          <span>{{ saving ? 'Salvando…' : 'Salvar metas' }}</span>
        </button>
        <button class="cm-btn cm-btn--reset" @click="handleReset">
          <q-icon name="mdi-restore" size="18px" />
          <span>Restaurar padrões</span>
        </button>
      </div>
    </div>

    <!-- ── Divisor ─────────────────────────────────────────────────────────────── -->
    <div class="cm-divider"></div>

    <!-- ── Exceções individuais ────────────────────────────────────────────────── -->
    <div class="cm-section">
      <div class="cm-section-title">
        <q-icon name="mdi-account-edit" size="22px" class="text-deep-orange" />
        <div>
          <div class="cm-section-title__main">Exceções individuais</div>
          <div class="cm-section-title__sub">Meta específica para um colaborador neste mês (férias, afastamento, integração etc.). Sobrepõe a meta do perfil.</div>
        </div>
      </div>

      <!-- Formulário -->
      <div class="cm-override-form">

        <!-- Linha 1: Colaborador + Semana -->
        <div class="cm-override-row">
          <div class="cm-override-form__field cm-override-form__field--wide">
            <div class="cm-flabel">COLABORADOR</div>
            <q-select
              v-model="ovMatricula"
              :options="empOptions"
              option-label="label"
              option-value="matricula"
              emit-value map-options use-input input-debounce="150"
              outlined dense hide-selected fill-input
              placeholder="Buscar por nome ou matrícula"
              @filter="filterEmps"
              @update:model-value="onSelectEmp"
            >
              <template #prepend><q-icon name="mdi-account-search" /></template>
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.nomeCompleto }}</q-item-label>
                    <q-item-label caption>{{ scope.opt.matricula }} · {{ scope.opt.gerencia }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
              <template #no-option>
                <q-item><q-item-section class="text-grey-6">Nenhum colaborador encontrado</q-item-section></q-item>
              </template>
            </q-select>
          </div>

          <div class="cm-override-form__field">
            <div class="cm-flabel">SEMANA</div>
            <div class="cm-pills cm-pills--semana">
              <button
                v-for="s in semanasOpcoes" :key="s.value"
                :class="['cm-pill', 'cm-pill--sm', ovSemana === s.value && 'cm-pill--on']"
                @click="ovSemana = s.value"
              >{{ s.label }}</button>
            </div>
          </div>
        </div>

        <!-- Linha 2: Meta + Motivo + Botão -->
        <div class="cm-override-row cm-override-row--bottom">
          <div class="cm-override-form__field">
            <div class="cm-flabel">META SEMANAL</div>
            <div class="cm-override-ctrl">
              <button class="cm-stepper" @click="ovMeta = Math.max(0, ovMeta - 1)">−</button>
              <input v-model.number="ovMeta" type="number" min="0" max="99" step="1" class="cm-counter__input cm-counter__input--sm" />
              <button class="cm-stepper" @click="ovMeta = Math.min(99, ovMeta + 1)">+</button>
            </div>
            <div class="cm-flabel" style="margin-top:4px">
              {{ ovSemana === 0 ? `Mensal: ${ovMeta * 4} obs` : `Só esta semana` }}
            </div>
          </div>

          <div class="cm-override-form__field cm-override-form__field--wide">
            <div class="cm-flabel">MOTIVO</div>
            <q-input v-model="ovMotivo" outlined dense placeholder="Ex: férias, afastamento médico, integração…" />
          </div>

          <div class="cm-override-form__field cm-override-form__field--btn">
            <button
              class="cm-btn cm-btn--add"
              :disabled="!ovMatricula || !ovMotivo.trim() || ovSaving"
              @click="handleSaveOverride"
            >
              <q-icon name="mdi-plus-circle" size="18px" />
              <span>Adicionar</span>
            </button>
          </div>
        </div>

      </div>

      <!-- Lista -->
      <div v-if="monthOverrides.length" class="cm-override-list">
        <div class="cm-flabel" style="margin-bottom:8px">EXCEÇÕES EM {{ mesAtualLabel.toUpperCase() }} / {{ selectedAno }}</div>
        <div class="cm-override-items">
          <div v-for="ov in monthOverrides" :key="`${ov.matricula}-${ov.semana}`" class="cm-override-item">
            <div class="cm-override-item__avatar">
              {{ ov.nome.split(" ").slice(0,2).map(p => p[0]).join("") }}
            </div>
            <div class="cm-override-item__info">
              <div class="cm-override-item__name">{{ ov.nome }}</div>
              <div class="cm-override-item__meta">
                {{ ov.matricula }} ·
                <span class="cm-override-item__sem">{{ ov.semana === 0 ? "Todo o mês" : semanasOpcoes.find(s => s.value === ov.semana)?.label }}</span>
                · {{ ov.motivo }}
              </div>
            </div>
            <div class="cm-override-item__badge">
              <span class="cm-override-item__num">{{ ov.meta_semanal }}</span>
              <span class="cm-override-item__unit">/sem</span>
              <div class="cm-override-item__mensal">{{ ov.semana === 0 ? `${ov.meta_semanal * 4}/mês` : 'só esta semana' }}</div>
            </div>
            <button class="cm-override-item__del" @click="handleRemoveOverride(ov)">
              <q-icon name="mdi-delete-outline" size="18px" />
            </button>
          </div>
        </div>
      </div>
      <div v-else class="cm-empty">
        Nenhuma exceção individual para {{ mesAtualLabel }}/{{ selectedAno }}.
      </div>
    </div>

    <!-- ── Info ────────────────────────────────────────────────────────────────── -->
    <div class="cm-section">
      <div class="cm-info">
        <q-icon name="mdi-information-outline" size="20px" class="cm-info__icon" />
        <div>
          <div class="cm-info__title">Como as metas são usadas</div>
          <ul class="cm-info__list">
            <li>As metas são aplicadas automaticamente nas páginas de Acompanhamento Semanal e Mensal.</li>
            <li>Observadores com gerência <strong>SESMT</strong> usam a meta de Segurança; os demais usam a meta Operacional.</li>
            <li>Exceções individuais têm prioridade sobre a meta do perfil.</li>
            <li>Cada mês pode ter uma meta diferente — selecione o mês e salve.</li>
          </ul>
        </div>
      </div>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useQuasar } from "quasar";
import { useGoals, type IndividualOverride } from "@/composables/useGoals";
import { supabase } from "@/lib/supabase";

const $q = useQuasar();
const { getMonthGoal, save, hasGoalDefined, getOverridesForMonth, saveOverride, removeOverride } = useGoals();

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

interface EmpOption {
  matricula: string;
  nomeCompleto: string;
  gerencia: string;
  label: string;
}

const semanasOpcoes = [
  { value: 0, label: "Todo o mês" },
  { value: 1, label: "1ª (01–08)" },
  { value: 2, label: "2ª (09–15)" },
  { value: 3, label: "3ª (16–22)" },
  { value: 4, label: "4ª (23–31)" },
];

const allEmps      = ref<EmpOption[]>([]);
const empOptions   = ref<EmpOption[]>([]);
const ovMatricula  = ref<string | null>(null);
const ovNome       = ref("");
const ovMeta       = ref(1);
const ovSemana     = ref(0);
const ovMotivo     = ref("");
const ovSaving     = ref(false);

const mesAtualLabel = computed(() => meses.find(m => m.value === selectedMes.value)?.label ?? "");
const monthOverrides = computed(() => getOverridesForMonth(selectedAno.value, selectedMes.value));

async function loadEmployees() {
  const { data } = await supabase
    .from("employees")
    .select("matricula, nome_completo, gerencia")
    .eq("ativo", true)
    .order("nome_completo");
  if (data) {
    allEmps.value = data.map(e => ({
      matricula:    e.matricula,
      nomeCompleto: e.nome_completo,
      gerencia:     e.gerencia,
      label:        `${e.nome_completo} (${e.matricula})`,
    }));
    empOptions.value = [...allEmps.value];
  }
}
loadEmployees();

function filterEmps(val: string, update: (fn: () => void) => void) {
  const needle = val.toLowerCase().trim();
  update(() => {
    empOptions.value = !needle
      ? [...allEmps.value]
      : allEmps.value.filter(e =>
          e.nomeCompleto.toLowerCase().includes(needle) ||
          e.matricula.toLowerCase().includes(needle)
        );
  });
}

function onSelectEmp(matricula: string | null) {
  const emp = allEmps.value.find(e => e.matricula === matricula);
  ovNome.value = emp?.nomeCompleto ?? "";
}

async function handleSaveOverride() {
  if (!ovMatricula.value || !ovNome.value) return;
  ovSaving.value = true;
  const ov: IndividualOverride = {
    matricula:    ovMatricula.value,
    nome:         ovNome.value,
    ano:          selectedAno.value,
    mes:          selectedMes.value,
    semana:       ovSemana.value,
    meta_semanal: ovMeta.value,
    motivo:       ovMotivo.value.trim(),
  };
  const semLabel = semanasOpcoes.find(s => s.value === ovSemana.value)?.label ?? "";
  try {
    await saveOverride(ov);
    $q.notify({ type: "positive", message: `Meta de ${ovNome.value} salva! (${semLabel})`, icon: "mdi-check-circle", position: "top-right", timeout: 2500 });
    ovMatricula.value = null;
    ovNome.value = "";
    ovMeta.value = 1;
    ovSemana.value = 0;
    ovMotivo.value = "";
  } catch {
    $q.notify({ type: "negative", message: "Erro ao salvar exceção.", position: "top-right" });
  } finally {
    ovSaving.value = false;
  }
}

async function handleRemoveOverride(ov: IndividualOverride) {
  await removeOverride(ov.matricula, ov.ano, ov.mes, ov.semana ?? 0);
  $q.notify({ type: "info", message: `Exceção de ${ov.nome} removida.`, position: "top-right", timeout: 2000 });
}

function loadInputsForPeriod(ano: number, mes: number) {
  const g = getMonthGoal(ano, mes);
  normaisInput.value   = g.normais_semanal;
  segurancaInput.value = g.seguranca_semanal;
}

loadInputsForPeriod(selectedAno.value, selectedMes.value);
watch([selectedAno, selectedMes], ([ano, mes]) => loadInputsForPeriod(ano, mes));

function onChangeMes(mes: number) { selectedMes.value = mes; }

function increment(tipo: "normais" | "seguranca") {
  if (tipo === "normais"   && normaisInput.value < 99)   normaisInput.value++;
  if (tipo === "seguranca" && segurancaInput.value < 99) segurancaInput.value++;
}

function decrement(tipo: "normais" | "seguranca") {
  if (tipo === "normais"   && normaisInput.value > 1)   normaisInput.value--;
  if (tipo === "seguranca" && segurancaInput.value > 1) segurancaInput.value--;
}

async function handleSave() {
  saving.value = true;
  try {
    await save(selectedAno.value, selectedMes.value, normaisInput.value, segurancaInput.value);
    $q.notify({
      type: "positive",
      message: `Metas de ${mesAtualLabel.value}/${selectedAno.value} salvas!`,
      caption: `Operacional: ${normaisInput.value}/sem · SESMT: ${segurancaInput.value}/sem`,
      icon: "mdi-check-circle",
      position: "top-right",
      timeout: 3000,
    });
  } finally {
    saving.value = false;
  }
}

function handleReset() {
  normaisInput.value   = 2;
  segurancaInput.value = 5;
  $q.notify({ type: "info", message: "Valores restaurados para o padrão", caption: "Clique em Salvar para confirmar", position: "top-right", timeout: 2500 });
}
</script>

<style scoped lang="scss">
$brand:   #8B1C2B;
$green:   #15803d;
$orange:  #e65100;
$border:  #e2e8f0;

// ── Página (zero padding) ──────────────────────────────────────────────────────
.cm-page {
  padding: 0;
  margin: 0;
  background: #f4f6fa;
  min-height: 100vh;
}

// ── Hero header ────────────────────────────────────────────────────────────────
.cm-hero {
  background: linear-gradient(135deg, $brand 0%, darken($brand, 8%) 100%);
  padding: 28px 32px 24px;
  color: #fff;

  &__inner {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    max-width: 1200px;
  }

  &__icon {
    background: rgba(#fff, .15);
    border-radius: 12px;
    padding: 10px;
    display: flex;
    flex-shrink: 0;
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 800;
    margin: 0 0 4px;
    letter-spacing: -.01em;
    line-height: 1.2;
  }

  &__sub {
    font-size: .85rem;
    opacity: .75;
    margin: 0;
    line-height: 1.4;
  }
}

// ── Sections ───────────────────────────────────────────────────────────────────
.cm-section {
  padding: 24px 32px;
  max-width: 1200px;
}

.cm-divider {
  height: 1px;
  background: $border;
  margin: 0 32px;
}

// ── Period ─────────────────────────────────────────────────────────────────────
.cm-period {
  background: #fff;
  border: 1px solid $border;
  border-radius: 14px;
  padding: 20px 24px;
  box-shadow: 0 1px 4px rgba(0,0,0,.05);

  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: .9rem;
    font-weight: 700;
    color: #334155;
    margin-bottom: 14px;
  }

  &__filters {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    align-items: flex-start;
  }

  &__status {
    margin-top: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: .78rem;
    font-weight: 500;

    &--ok  { color: $green; }
    &--warn { color: #c05621; }
  }
}

.cm-fgroup { display: flex; flex-direction: column; gap: 6px; }
.cm-fgroup--mes { flex: 1; }

.cm-flabel {
  font-size: 9.5px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .8px; color: #94a3b8;
}

.cm-pills { display: flex; flex-wrap: wrap; gap: 4px; }

.cm-pill {
  height: 28px; padding: 0 13px;
  border: 1.5px solid $border; border-radius: 999px;
  background: #f8fafc; color: #64748b;
  font-size: 12px; font-weight: 500; cursor: pointer;
  transition: all .13s;
  white-space: nowrap;

  &:hover:not(.cm-pill--on) { border-color: $brand; color: $brand; }
  &--on {
    background: $brand; color: #fff;
    border-color: $brand;
    box-shadow: 0 2px 8px rgba($brand, .3);
    font-weight: 600;
  }
}

// ── Meta cards ─────────────────────────────────────────────────────────────────
.cm-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;

  @media (max-width: 640px) { grid-template-columns: 1fr; }
}

.cm-meta-card {
  background: #fff;
  border: 1px solid $border;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,.06);

  &__head {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px 20px;
    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
    color: $green;

    &--sesmt {
      background: linear-gradient(135deg, #fff1f2, #ffe4e6);
      color: $brand;
    }
  }

  &__head-icon {
    background: rgba(#fff, .6);
    border-radius: 10px;
    padding: 8px;
    display: flex;
    flex-shrink: 0;
  }

  &__head-title { font-size: .95rem; font-weight: 700; line-height: 1.2; }
  &__head-sub   { font-size: .78rem; opacity: .75; margin-top: 2px; }

  &__body { padding: 16px 20px; }
}

.cm-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding-bottom: 12px;

  &__label {
    display: flex; align-items: center; gap: 6px;
    font-size: 13px; font-weight: 600; color: #475569;
  }

  &__ctrl {
    display: flex; align-items: center; gap: 6px;
  }
}

.cm-stepper {
  width: 32px; height: 32px;
  border-radius: 8px;
  border: 1.5px solid $border;
  background: #f8fafc;
  font-size: 18px; font-weight: 700;
  color: #475569; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all .12s;

  &:hover:not(:disabled) { border-color: $brand; color: $brand; background: #fff; }
  &:disabled { opacity: .35; cursor: not-allowed; }

  &--sesmt:hover:not(:disabled) { border-color: $brand; color: $brand; }
}

.cm-counter {
  display: flex; align-items: center; gap: 6px;

  &__input {
    width: 64px; height: 40px;
    border: 1.5px solid $border; border-radius: 10px;
    text-align: center; font-size: 20px; font-weight: 700; color: #1e293b;
    background: #fff; outline: none;
    transition: border-color .13s;
    &:focus { border-color: $brand; }
    &--sm { width: 56px; font-size: 16px; }

    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  }

  &__unit { font-size: 11px; color: #94a3b8; white-space: nowrap; }
}

.cm-derived {
  display: flex; align-items: center; gap: 5px;
  font-size: 13px; color: #64748b;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;

  &__hint { font-size: 11px; color: #94a3b8; }
}

// ── Ações ──────────────────────────────────────────────────────────────────────
.cm-actions {
  display: flex; gap: 10px; flex-wrap: wrap;
}

.cm-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 0 20px; height: 40px;
  border-radius: 10px; border: none;
  font-size: 13px; font-weight: 700; cursor: pointer;
  letter-spacing: .02em; text-transform: uppercase;
  transition: all .15s;

  &--save {
    background: $brand; color: #fff;
    box-shadow: 0 2px 8px rgba($brand, .35);
    &:hover:not(:disabled) { background: darken($brand, 8%); }
    &:disabled { opacity: .6; cursor: not-allowed; }
  }

  &--reset {
    background: #fff; color: #64748b;
    border: 1.5px solid $border;
    &:hover { border-color: #94a3b8; color: #334155; }
  }

  &--add {
    background: $orange; color: #fff;
    box-shadow: 0 2px 8px rgba($orange, .3);
    height: 38px;
    &:hover:not(:disabled) { background: darken($orange, 8%); }
    &:disabled { opacity: .5; cursor: not-allowed; }
  }
}

// ── Section titles ─────────────────────────────────────────────────────────────
.cm-section-title {
  display: flex; align-items: flex-start; gap: 12px;
  margin-bottom: 20px;

  &__main { font-size: 1.05rem; font-weight: 700; color: #1e293b; }
  &__sub  { font-size: .82rem; color: #64748b; margin-top: 3px; line-height: 1.4; }
}

// ── Override form ──────────────────────────────────────────────────────────────
.cm-override-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: #fff;
  border: 1px solid $border;
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,.04);

  &__field { display: flex; flex-direction: column; gap: 6px; }
  &__field--wide { flex: 1; min-width: 200px; }
  &__field--btn { justify-content: flex-end; }
}

.cm-override-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: flex-end;

  &--bottom { align-items: flex-end; }
}

.cm-pills--semana { flex-wrap: nowrap; gap: 4px; }

.cm-pill--sm {
  height: 26px; padding: 0 10px;
  font-size: 11px;
}

.cm-override-ctrl {
  display: flex; align-items: center; gap: 6px;
}

// ── Override list ──────────────────────────────────────────────────────────────
.cm-override-list { max-width: 700px; }

.cm-override-items {
  background: #fff;
  border: 1px solid $border;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,.04);
}

.cm-override-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  &:last-child { border-bottom: none; }

  &__avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: $orange; color: #fff;
    font-size: 12px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  &__info { flex: 1; min-width: 0; }
  &__name { font-size: 13px; font-weight: 600; color: #1e293b; }
  &__meta { font-size: 11px; color: #94a3b8; margin-top: 1px; }

  &__badge { text-align: right; flex-shrink: 0; }
  &__num   { font-size: 18px; font-weight: 700; color: $orange; line-height: 1; }
  &__unit  { font-size: 11px; color: #94a3b8; margin-left: 1px; }
  &__mensal{ font-size: 11px; color: #94a3b8; }
  &__sem   { color: $brand; font-weight: 600; }

  &__del {
    background: none; border: none; cursor: pointer;
    color: #f87171; padding: 4px;
    border-radius: 6px; transition: background .12s;
    display: flex; align-items: center;
    &:hover { background: #fee2e2; }
  }
}

.cm-empty { font-size: 13px; color: #94a3b8; margin-top: 4px; }

// ── Info ───────────────────────────────────────────────────────────────────────
.cm-info {
  display: flex; gap: 14px;
  background: #fff; border: 1px solid $border;
  border-radius: 14px; padding: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,.04);
  max-width: 740px;

  &__icon { color: #3b82f6; flex-shrink: 0; margin-top: 2px; }
  &__title { font-size: .88rem; font-weight: 700; color: #1e293b; margin-bottom: 8px; }
  &__list {
    padding-left: 18px; margin: 0;
    font-size: .82rem; color: #475569; line-height: 1.7;
    li + li { margin-top: 3px; }
  }
}

// ── Dark mode ──────────────────────────────────────────────────────────────────
.body--dark {
  .cm-page { background: #0f172a; }

  .cm-period,
  .cm-meta-card,
  .cm-override-form,
  .cm-override-items,
  .cm-info {
    background: #1e293b;
    border-color: #334155;
  }

  .cm-period__header,
  .cm-section-title__main { color: #e2e8f0; }

  .cm-meta-card__head { background: linear-gradient(135deg, #052e16, #14532d) !important; color: #4ade80 !important; }
  .cm-meta-card__head--sesmt { background: linear-gradient(135deg, #3b0a0f, #5c1020) !important; color: #fca5a5 !important; }

  .cm-counter__input { background: #0f172a; color: #e2e8f0; border-color: #334155; }
  .cm-stepper { background: #0f172a; border-color: #334155; color: #94a3b8; }
  .cm-pill { background: #0f172a; border-color: #334155; color: #94a3b8; }
  .cm-pill--on { background: $brand; color: #fff; border-color: $brand; }

  .cm-derived { border-top-color: #334155; color: #94a3b8; }
  .cm-override-item { border-bottom-color: #334155; }
  .cm-override-item__name { color: #e2e8f0; }
  .cm-info__title { color: #e2e8f0; }
  .cm-info__list { color: #94a3b8; }
  .cm-btn--reset { background: #1e293b; border-color: #334155; color: #94a3b8; }
}
</style>
