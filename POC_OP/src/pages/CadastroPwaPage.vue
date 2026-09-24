<template>
  <q-page class="dbp-page">

    <!-- ══ HEADER ══════════════════════════════════════════════════════════════ -->
    <header class="dbp-header">
      <div class="dbp-header__left">
        <p class="dbp-eyebrow">Administração · PWA</p>
        <h1 class="dbp-title">Banco de Dados</h1>
        <div class="dbp-stats">
          <span class="dbp-stat">
            <span class="dbp-stat__n">{{ employees.length }}</span>
            <span class="dbp-stat__label">funcionários</span>
          </span>
          <span class="dbp-stat__div" />
          <span class="dbp-stat">
            <span class="dbp-stat__n">{{ equipes.length }}</span>
            <span class="dbp-stat__label">equipes</span>
          </span>
        </div>
      </div>
      <div class="dbp-header__right">
        <button class="dbp-hbtn dbp-hbtn--ghost" :class="{ 'is-loading': loading }" @click="fetchAll" title="Atualizar">
          <q-icon name="mdi-refresh" size="16px" :class="{ 'spin': loading }" />
        </button>
        <button class="dbp-hbtn dbp-hbtn--export" @click="exportExcel">
          <q-icon name="mdi-arrow-down-circle-outline" size="15px" />
          Exportar
        </button>
        <button class="dbp-hbtn dbp-hbtn--import" :class="{ 'is-loading': importing }" @click="triggerImport">
          <q-icon name="mdi-arrow-up-circle-outline" size="15px" />
          Importar
        </button>
        <input ref="importInput" type="file" accept=".xlsx,.xls" style="display:none" @change="onImportFile" />
      </div>
    </header>

    <!-- ══ TABS ═════════════════════════════════════════════════════════════════ -->
    <div class="dbp-tabs-wrap">
      <div class="dbp-tabs">
        <button class="dbp-tab" :class="{ '--active': tab === 'funcionarios' }" @click="tab = 'funcionarios'">
          <q-icon name="mdi-account-group-outline" size="15px" />
          <span>Funcionários</span>
          <span class="dbp-tab__ct">{{ employees.length }}</span>
        </button>
        <button class="dbp-tab" :class="{ '--active': tab === 'equipes' }" @click="tab = 'equipes'">
          <q-icon name="mdi-bus-multiple" size="15px" />
          <span>Equipes</span>
          <span class="dbp-tab__ct">{{ equipes.length }}</span>
        </button>
      </div>
    </div>

    <!-- ══ BODY ══════════════════════════════════════════════════════════════════ -->
    <div class="dbp-body">

      <!-- ── FUNCIONÁRIOS ─────────────────────────────────────────────────────── -->
      <template v-if="tab === 'funcionarios'">
        <div class="dbp-toolbar">
          <div class="dbp-search-shell">
            <q-icon name="mdi-magnify" size="17px" class="dbp-search-icon" />
            <input
              v-model="empSearch"
              class="dbp-search"
              placeholder="Buscar por nome ou matrícula…"
              autocomplete="off"
            />
            <button v-if="empSearch" class="dbp-search-x" @click="empSearch = ''">
              <q-icon name="mdi-close" size="13px" />
            </button>
          </div>

          <div class="dbp-pills">
            <button
              v-for="g in ['Todas', 'GOMAN', 'GSTC', 'GERE', 'SESMT']"
              :key="g"
              class="dbp-pill"
              :class="[{ '--active': empGerenciaFilter === g }, g !== 'Todas' ? `--${g.toLowerCase()}` : '']"
              @click="empGerenciaFilter = g"
            >{{ g }}</button>
          </div>

          <button class="dbp-add-btn" @click="openEmpDialog()">
            <q-icon name="mdi-plus" size="16px" />
            Adicionar
          </button>
        </div>

        <p class="dbp-count">
          <span v-if="empSearch || empGerenciaFilter !== 'Todas'">{{ filteredEmployees.length }} de </span>{{ employees.length }} registros
        </p>

        <div class="dbp-records">
          <transition-group name="rec" appear>
            <div v-for="e in filteredEmployees" :key="e.matricula" class="dbp-record">
              <div class="dbp-record__av" :data-g="e.gerencia">{{ e.nome.charAt(0) }}</div>
              <div class="dbp-record__main">
                <span class="dbp-record__name">{{ e.nome_completo }}</span>
                <span class="dbp-record__sub">
                  <code class="dbp-mat">{{ e.matricula }}</code>
                  <span class="dbp-record__dot">·</span>
                  {{ e.funcao }}
                </span>
              </div>
              <div class="dbp-record__chips">
                <span class="dbp-chip" :data-g="e.gerencia">{{ e.gerencia }}</span>
                <span class="dbp-chip dbp-chip--base">{{ e.base }}</span>
                <span v-if="!e.ativo" class="dbp-chip dbp-chip--off">INATIVO</span>
              </div>
              <div class="dbp-record__acts">
                <button class="dbp-act" @click="openEmpDialog(e)" title="Editar">
                  <q-icon name="mdi-pencil-outline" size="14px" />
                </button>
                <button class="dbp-act dbp-act--del" @click="deleteEmployee(e)" title="Remover">
                  <q-icon name="mdi-delete-outline" size="14px" />
                </button>
              </div>
            </div>
          </transition-group>

          <div v-if="!filteredEmployees.length" class="dbp-empty">
            <q-icon name="mdi-account-search-outline" size="40px" />
            <p>Nenhum funcionário encontrado</p>
          </div>
        </div>
      </template>

      <!-- ── EQUIPES ───────────────────────────────────────────────────────────── -->
      <template v-if="tab === 'equipes'">
        <div class="dbp-toolbar">
          <div class="dbp-search-shell">
            <q-icon name="mdi-magnify" size="17px" class="dbp-search-icon" />
            <input
              v-model="eqSearch"
              class="dbp-search"
              placeholder="Buscar por prefixo ou base…"
              autocomplete="off"
            />
            <button v-if="eqSearch" class="dbp-search-x" @click="eqSearch = ''">
              <q-icon name="mdi-close" size="13px" />
            </button>
          </div>

          <div class="dbp-pills">
            <button
              v-for="g in ['Todas', 'GOMAN', 'GSTC', 'GERE']"
              :key="g"
              class="dbp-pill"
              :class="[{ '--active': eqGerenciaFilter === g }, g !== 'Todas' ? `--${g.toLowerCase()}` : '']"
              @click="eqGerenciaFilter = g"
            >{{ g }}</button>
          </div>

          <button class="dbp-add-btn" @click="openEqDialog()">
            <q-icon name="mdi-plus" size="16px" />
            Adicionar
          </button>
        </div>

        <p class="dbp-count">
          <span v-if="eqSearch || eqGerenciaFilter !== 'Todas'">{{ filteredEquipes.length }} de </span>{{ equipes.length }} equipes
        </p>

        <div class="dbp-records">
          <transition-group name="rec" appear>
            <div v-for="eq in filteredEquipes" :key="eq.id" class="dbp-record">
              <div class="dbp-record__av dbp-record__av--bus" :data-g="eq.gerencia">
                <q-icon name="mdi-bus" size="16px" />
              </div>
              <div class="dbp-record__main">
                <span class="dbp-record__name">{{ eq.prefixo }}</span>
                <span class="dbp-record__sub">Base {{ eq.base }}</span>
              </div>
              <div class="dbp-record__chips">
                <span class="dbp-chip" :data-g="eq.gerencia">{{ eq.gerencia }}</span>
              </div>
              <div class="dbp-record__acts">
                <button class="dbp-act" @click="openEqDialog(eq)" title="Editar">
                  <q-icon name="mdi-pencil-outline" size="14px" />
                </button>
                <button class="dbp-act dbp-act--del" @click="deleteEquipe(eq)" title="Remover">
                  <q-icon name="mdi-delete-outline" size="14px" />
                </button>
              </div>
            </div>
          </transition-group>

          <div v-if="!filteredEquipes.length" class="dbp-empty">
            <q-icon name="mdi-bus-alert" size="40px" />
            <p>Nenhuma equipe encontrada</p>
          </div>
        </div>
      </template>
    </div>

    <!-- ══ DIALOG FUNCIONÁRIO ══════════════════════════════════════════════════ -->
    <q-dialog v-model="empDialog" persistent transition-show="scale" transition-hide="scale">
      <q-card class="dbp-dlg">
        <div class="dbp-dlg__bar" :data-g="empForm.gerencia || 'GOMAN'" />
        <div class="dbp-dlg__head">
          <div>
            <p class="dbp-dlg__title">{{ empIsEditing ? 'Editar Funcionário' : 'Novo Funcionário' }}</p>
            <p class="dbp-dlg__sub">{{ empIsEditing ? `Mat. ${empForm.matricula}` : 'Preencha os dados do colaborador' }}</p>
          </div>
          <button class="dbp-dlg__x" v-close-popup><q-icon name="mdi-close" size="18px" /></button>
        </div>
        <div class="dbp-dlg__body">
          <q-input v-model="empForm.matricula" label="Matrícula *" dense outlined :disable="empIsEditing" />
          <q-input v-model="empForm.nome" label="Nome curto *" dense outlined />
          <q-input v-model="empForm.nome_completo" label="Nome completo *" dense outlined />
          <div class="row q-gutter-sm">
            <q-select v-model="empForm.gerencia" :options="['GOMAN','GSTC','GERE','SESMT']" label="Gerência *" dense outlined class="col" />
            <q-input v-model="empForm.base" label="Base *" dense outlined class="col" />
          </div>
          <div class="row q-gutter-sm items-center">
            <q-input v-model="empForm.funcao" label="Função *" dense outlined class="col" />
            <q-toggle v-model="empForm.ativo" label="Ativo" color="positive" />
          </div>
          <p v-if="empError" class="text-negative text-caption q-mb-none">{{ empError }}</p>
        </div>
        <div class="dbp-dlg__foot">
          <button class="dbp-dlg__cancel" v-close-popup>Cancelar</button>
          <button class="dbp-dlg__save" :disabled="saving" @click="saveEmployee">
            <q-spinner v-if="saving" size="13px" color="white" />
            {{ saving ? 'Salvando…' : 'Salvar' }}
          </button>
        </div>
      </q-card>
    </q-dialog>

    <!-- ══ DIALOG EQUIPE ════════════════════════════════════════════════════════ -->
    <q-dialog v-model="eqDialog" persistent transition-show="scale" transition-hide="scale">
      <q-card class="dbp-dlg">
        <div class="dbp-dlg__bar" :data-g="eqForm.gerencia || 'GOMAN'" />
        <div class="dbp-dlg__head">
          <div>
            <p class="dbp-dlg__title">{{ eqForm.id ? 'Editar Equipe' : 'Nova Equipe' }}</p>
            <p class="dbp-dlg__sub">{{ eqForm.id ? eqForm.prefixo : 'Preencha os dados da equipe' }}</p>
          </div>
          <button class="dbp-dlg__x" v-close-popup><q-icon name="mdi-close" size="18px" /></button>
        </div>
        <div class="dbp-dlg__body">
          <q-input v-model="eqForm.base" label="Base *" dense outlined />
          <q-input v-model="eqForm.prefixo" label="Prefixo *" dense outlined />
          <q-select v-model="eqForm.gerencia" :options="['GOMAN','GSTC','GERE']" label="Gerência *" dense outlined />
          <p v-if="eqError" class="text-negative text-caption q-mb-none">{{ eqError }}</p>
        </div>
        <div class="dbp-dlg__foot">
          <button class="dbp-dlg__cancel" v-close-popup>Cancelar</button>
          <button class="dbp-dlg__save" :disabled="saving" @click="saveEquipe">
            <q-spinner v-if="saving" size="13px" color="white" />
            {{ saving ? 'Salvando…' : 'Salvar' }}
          </button>
        </div>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useQuasar } from "quasar";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

const $q      = useQuasar();
const loading = ref(false);
const saving  = ref(false);
const tab     = ref("funcionarios");

// ─── Funcionários ─────────────────────────────────────────────────────────────

interface Employee {
  matricula: string;
  nome: string;
  nome_completo: string;
  gerencia: string;
  base: string;
  funcao: string;
  ativo: boolean;
}

const employees        = ref<Employee[]>([]);
const empSearch        = ref("");
const empGerenciaFilter = ref("Todas");
const empDialog        = ref(false);
const empError         = ref("");
const empIsEditing     = ref(false);
const empForm          = ref<Partial<Employee>>({});

const filteredEmployees = computed(() => {
  const q  = empSearch.value.toLowerCase();
  const gr = empGerenciaFilter.value;
  return employees.value.filter((e) => {
    const matchSearch   = !q || e.nome_completo.toLowerCase().includes(q) || e.matricula.includes(q) || e.nome.toLowerCase().includes(q);
    const matchGerencia = gr === "Todas" || e.gerencia === gr;
    return matchSearch && matchGerencia;
  });
});

function openEmpDialog(e?: Employee) {
  empError.value  = "";
  empIsEditing.value = !!e;
  empForm.value   = e ? { ...e } : { gerencia: "GOMAN", base: "BCB", ativo: true };
  empDialog.value = true;
}

async function saveEmployee() {
  const f = empForm.value;
  if (!f.matricula || !f.nome || !f.nome_completo || !f.gerencia || !f.base || !f.funcao) {
    empError.value = "Preencha todos os campos obrigatórios.";
    return;
  }
  saving.value  = true;
  empError.value = "";

  const payload = {
    matricula: f.matricula, nome: f.nome, nome_completo: f.nome_completo,
    gerencia: f.gerencia, base: f.base, funcao: f.funcao, ativo: f.ativo ?? true,
  };

  const { error } = empIsEditing.value
    ? await supabase.from("employees").update(payload).eq("matricula", f.matricula!)
    : await supabase.from("employees").insert(payload);

  saving.value = false;
  if (error) { empError.value = error.message; return; }

  $q.notify({ type: "positive", message: empIsEditing.value ? "Funcionário atualizado." : "Funcionário adicionado." });
  empDialog.value = false;
  await fetchEmployees();
}

async function deleteEmployee(e: Employee) {
  $q.dialog({
    title: "Remover funcionário",
    message: `Remover <b>${e.nome_completo}</b> (mat. ${e.matricula})?`,
    html: true,
    ok: { label: "Remover", color: "negative", unelevated: true },
    cancel: { label: "Cancelar", flat: true },
  }).onOk(async () => {
    const { error } = await supabase.from("employees").delete().eq("matricula", e.matricula);
    if (error) { $q.notify({ type: "negative", message: error.message }); return; }
    $q.notify({ type: "positive", message: "Funcionário removido." });
    await fetchEmployees();
  });
}

// ─── Equipes ──────────────────────────────────────────────────────────────────

interface Equipe {
  id: string;
  base: string;
  prefixo: string;
  gerencia: string;
}

const equipes          = ref<Equipe[]>([]);
const eqSearch         = ref("");
const eqGerenciaFilter  = ref("Todas");
const eqDialog         = ref(false);
const eqError          = ref("");
const eqForm           = ref<Partial<Equipe>>({});

const filteredEquipes = computed(() => {
  const q  = eqSearch.value.toLowerCase();
  const gr = eqGerenciaFilter.value;
  return equipes.value.filter((eq) => {
    const matchSearch   = !q || eq.prefixo.toLowerCase().includes(q) || eq.base.toLowerCase().includes(q);
    const matchGerencia = gr === "Todas" || eq.gerencia === gr;
    return matchSearch && matchGerencia;
  });
});

function openEqDialog(eq?: Equipe) {
  eqError.value  = "";
  eqForm.value   = eq ? { ...eq } : { base: "BCB", gerencia: "GOMAN" };
  eqDialog.value = true;
}

async function saveEquipe() {
  const f = eqForm.value;
  if (!f.base || !f.prefixo || !f.gerencia) {
    eqError.value = "Preencha todos os campos obrigatórios.";
    return;
  }
  saving.value = true;
  eqError.value = "";

  const payload = { base: f.base, prefixo: f.prefixo, gerencia: f.gerencia };

  const { error } = f.id
    ? await supabase.from("pwa_equipes").update(payload).eq("id", f.id)
    : await supabase.from("pwa_equipes").insert(payload);

  saving.value = false;
  if (error) { eqError.value = error.message; return; }

  $q.notify({ type: "positive", message: f.id ? "Equipe atualizada." : "Equipe adicionada." });
  eqDialog.value = false;
  await fetchEquipes();
}

async function deleteEquipe(eq: Equipe) {
  $q.dialog({
    title: "Remover equipe",
    message: `Remover a equipe <b>${eq.prefixo}</b>?`,
    html: true,
    ok: { label: "Remover", color: "negative", unelevated: true },
    cancel: { label: "Cancelar", flat: true },
  }).onOk(async () => {
    const { error } = await supabase.from("pwa_equipes").delete().eq("id", eq.id);
    if (error) { $q.notify({ type: "negative", message: error.message }); return; }
    $q.notify({ type: "positive", message: "Equipe removida." });
    await fetchEquipes();
  });
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchEmployees() {
  const { data } = await supabase
    .from("employees")
    .select("matricula, nome, nome_completo, gerencia, base, funcao, ativo")
    .order("nome_completo");
  if (data) employees.value = data as Employee[];
}

async function fetchEquipes() {
  const { data } = await supabase
    .from("pwa_equipes")
    .select("*")
    .order("base")
    .order("prefixo");
  if (data) equipes.value = data as Equipe[];
}

async function fetchAll() {
  loading.value = true;
  await Promise.all([fetchEmployees(), fetchEquipes()]);
  loading.value = false;
}

onMounted(fetchAll);

// ─── Export / Import ──────────────────────────────────────────────────────────

const importInput = ref<HTMLInputElement | null>(null);
const importing   = ref(false);

function exportExcel() {
  const wb = XLSX.utils.book_new();

  const empData = employees.value.map((e) => ({
    Matricula:     e.matricula,
    Nome:          e.nome,
    Nome_Completo: e.nome_completo,
    Gerencia:      e.gerencia,
    Base:          e.base,
    Funcao:        e.funcao,
    Ativo:         e.ativo ? "SIM" : "NÃO",
  }));
  const wsEmp = XLSX.utils.json_to_sheet(empData);
  wsEmp["!cols"] = [10, 22, 40, 8, 8, 22, 6].map((w) => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, wsEmp, "Funcionarios");

  const eqData = equipes.value.map((eq) => ({
    ID:       eq.id,
    Base:     eq.base,
    Prefixo:  eq.prefixo,
    Gerencia: eq.gerencia,
  }));
  const wsEq = XLSX.utils.json_to_sheet(eqData);
  wsEq["!cols"] = [38, 8, 14, 8].map((w) => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, wsEq, "Equipes");

  XLSX.writeFile(wb, "banco_pwa.xlsx");
  $q.notify({ type: "positive", message: "Arquivo exportado com sucesso." });
}

function triggerImport() {
  importInput.value?.click();
}

async function onImportFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file  = input.files?.[0];
  if (!file) return;
  input.value = "";

  importing.value = true;

  try {
    const buffer = await file.arrayBuffer();
    const wb     = XLSX.read(buffer, { type: "array" });

    let empUpdated = 0, eqUpdated = 0;

    const wsEmp = wb.Sheets["Funcionarios"];
    if (wsEmp) {
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(wsEmp);
      const REQUIRED = ["Matricula", "Nome", "Nome_Completo", "Gerencia", "Base", "Funcao"];
      const missing  = REQUIRED.filter((k) => !rows[0]?.[k]);
      if (missing.length) throw new Error(`Colunas ausentes na aba Funcionarios: ${missing.join(", ")}`);

      const payload = rows.map((r) => ({
        matricula:     String(r["Matricula"]).trim(),
        nome:          String(r["Nome"]).trim(),
        nome_completo: String(r["Nome_Completo"]).trim(),
        gerencia:      String(r["Gerencia"]).trim(),
        base:          String(r["Base"]).trim(),
        funcao:        String(r["Funcao"]).trim(),
        ativo:         String(r["Ativo"] ?? "SIM").trim().toUpperCase() !== "NÃO",
      })).filter((r) => r.matricula);

      for (let i = 0; i < payload.length; i += 50) {
        const batch = payload.slice(i, i + 50);
        const { error } = await supabase.from("employees").upsert(batch, { onConflict: "matricula" });
        if (error) throw new Error("Erro ao importar funcionários: " + error.message);
      }
      empUpdated = payload.length;
    }

    const wsEq = wb.Sheets["Equipes"];
    if (wsEq) {
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(wsEq);
      if (rows.length) {
        const REQUIRED = ["Base", "Prefixo", "Gerencia"];
        const missing  = REQUIRED.filter((k) => !rows[0]?.[k]);
        if (missing.length) throw new Error(`Colunas ausentes na aba Equipes: ${missing.join(", ")}`);

        const payload = rows.map((r) => {
          const obj: Record<string, string> = {
            base:     String(r["Base"]).trim(),
            prefixo:  String(r["Prefixo"]).trim(),
            gerencia: String(r["Gerencia"]).trim(),
          };
          if (r["ID"]) obj["id"] = String(r["ID"]).trim();
          return obj;
        }).filter((r) => r["base"] && r["prefixo"]);

        for (let i = 0; i < payload.length; i += 50) {
          const batch = payload.slice(i, i + 50);
          const { error } = await supabase.from("pwa_equipes").upsert(batch, { onConflict: "prefixo" });
          if (error) throw new Error("Erro ao importar equipes: " + error.message);
        }
        eqUpdated = payload.length;
      }
    }

    await fetchAll();
    $q.notify({
      type: "positive",
      message: `Importação concluída: ${empUpdated} funcionários · ${eqUpdated} equipes`,
      timeout: 5000,
    });
  } catch (e: unknown) {
    $q.notify({ type: "negative", message: (e as Error).message ?? "Erro ao importar." });
  } finally {
    importing.value = false;
  }
}
</script>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

// ── Tokens ────────────────────────────────────────────────────────────────────
:root {
  --dbp-surface:  rgba(255,255,255,.035);
  --dbp-border:   rgba(255,255,255,.08);
  --dbp-border2:  rgba(255,255,255,.05);
  --dbp-txt:      rgba(255,255,255,.92);
  --dbp-muted:    rgba(255,255,255,.38);
  --dbp-accent:   #8B1C2B;
  --dbp-radius:   10px;
  // Gerência
  --c-goman:  #F59E0B;
  --c-gstc:   #3B82F6;
  --c-gere:   #10B981;
  --c-sesmt:  #A78BFA;
}

// ── Page ──────────────────────────────────────────────────────────────────────
.dbp-page {
  min-height: 100vh;
  padding: 0;
  background: transparent;
}

// ── Header ────────────────────────────────────────────────────────────────────
.dbp-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: 40px 48px 32px;
  border-bottom: 1px solid var(--dbp-border);
  flex-wrap: wrap;

  @media (max-width: 640px) { padding: 28px 20px 24px; }
}

.dbp-eyebrow {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--dbp-accent);
  margin: 0 0 8px;
  opacity: .9;
}

.dbp-title {
  font-family: 'Syne', sans-serif;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -.03em;
  margin: 0 0 14px;
  color: var(--dbp-txt);
  line-height: 1;
}

.dbp-stats {
  display: flex;
  align-items: center;
  gap: 12px;
}
.dbp-stat {
  display: flex;
  align-items: baseline;
  gap: 5px;
}
.dbp-stat__n {
  font-family: 'Syne', sans-serif;
  font-size: 22px;
  font-weight: 800;
  color: var(--dbp-txt);
  line-height: 1;
}
.dbp-stat__label {
  font-size: 12px;
  color: var(--dbp-muted);
  font-weight: 500;
}
.dbp-stat__div {
  width: 1px;
  height: 20px;
  background: var(--dbp-border);
}

.dbp-header__right {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 2px;
  flex-shrink: 0;
}

.dbp-hbtn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .02em;
  border: 1px solid var(--dbp-border);
  border-radius: 8px;
  padding: 7px 12px;
  cursor: pointer;
  transition: all .18s ease;
  background: var(--dbp-surface);
  color: var(--dbp-txt);

  &:hover { background: rgba(255,255,255,.07); border-color: rgba(255,255,255,.15); }

  &--ghost {
    padding: 7px;
    color: var(--dbp-muted);
    &:hover { color: var(--dbp-txt); }
    .spin { animation: spin .7s linear infinite; }
  }

  &--export {
    color: #60A5FA;
    border-color: rgba(96,165,250,.25);
    background: rgba(59,130,246,.08);
    &:hover { background: rgba(59,130,246,.16); border-color: rgba(96,165,250,.4); }
  }

  &--import {
    color: #34D399;
    border-color: rgba(52,211,153,.25);
    background: rgba(16,185,129,.08);
    &:hover { background: rgba(16,185,129,.16); border-color: rgba(52,211,153,.4); }
  }
}

@keyframes spin { to { transform: rotate(360deg); } }

// ── Tabs ──────────────────────────────────────────────────────────────────────
.dbp-tabs-wrap {
  padding: 0 48px;
  border-bottom: 1px solid var(--dbp-border);
  @media (max-width: 640px) { padding: 0 20px; }
}

.dbp-tabs {
  display: flex;
  gap: 0;
}

.dbp-tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 16px 20px 14px;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: .02em;
  color: var(--dbp-muted);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all .16s ease;
  position: relative;
  bottom: -1px;

  &:hover { color: var(--dbp-txt); }

  &.--active {
    color: var(--dbp-txt);
    border-bottom-color: var(--dbp-accent);
  }
}

.dbp-tab__ct {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 20px;
  background: var(--dbp-surface);
  border: 1px solid var(--dbp-border);
  color: var(--dbp-muted);
  transition: all .16s;

  .dbp-tab.--active & {
    background: rgba(139,28,43,.18);
    border-color: rgba(139,28,43,.3);
    color: #F87171;
  }
}

// ── Body ──────────────────────────────────────────────────────────────────────
.dbp-body {
  padding: 28px 48px 48px;
  @media (max-width: 640px) { padding: 20px 16px 40px; }
}

// ── Toolbar ───────────────────────────────────────────────────────────────────
.dbp-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.dbp-search-shell {
  flex: 1;
  min-width: 200px;
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid var(--dbp-border);
  border-radius: var(--dbp-radius);
  background: var(--dbp-surface);
  padding: 0 10px;
  transition: border-color .16s;

  &:focus-within {
    border-color: rgba(255,255,255,.2);
    background: rgba(255,255,255,.05);
  }
}
.dbp-search-icon { color: var(--dbp-muted); flex-shrink: 0; }
.dbp-search {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--dbp-txt);
  font-size: 13px;
  padding: 9px 8px;
  &::placeholder { color: var(--dbp-muted); }
}
.dbp-search-x {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--dbp-muted);
  padding: 4px;
  border-radius: 4px;
  line-height: 1;
  &:hover { color: var(--dbp-txt); }
}

.dbp-pills {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.dbp-pill {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .04em;
  padding: 5px 10px;
  border-radius: 20px;
  border: 1px solid var(--dbp-border);
  background: transparent;
  color: var(--dbp-muted);
  cursor: pointer;
  transition: all .14s;

  &:hover { color: var(--dbp-txt); border-color: rgba(255,255,255,.15); }

  &.--active {
    color: var(--dbp-txt);
    background: var(--dbp-surface);
    border-color: rgba(255,255,255,.18);
  }

  &.--active.--goman { color: var(--c-goman); border-color: rgba(245,158,11,.35); background: rgba(245,158,11,.08); }
  &.--active.--gstc  { color: var(--c-gstc);  border-color: rgba(59,130,246,.35);  background: rgba(59,130,246,.08);  }
  &.--active.--gere  { color: var(--c-gere);  border-color: rgba(16,185,129,.35);  background: rgba(16,185,129,.08);  }
  &.--active.--sesmt { color: var(--c-sesmt); border-color: rgba(167,139,250,.35); background: rgba(167,139,250,.08); }
}

.dbp-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .03em;
  padding: 8px 14px;
  border-radius: var(--dbp-radius);
  background: var(--dbp-accent);
  color: #fff;
  border: none;
  cursor: pointer;
  transition: opacity .15s, transform .12s;
  white-space: nowrap;

  &:hover { opacity: .88; transform: translateY(-1px); }
  &:active { transform: translateY(0); }
}

// ── Count ─────────────────────────────────────────────────────────────────────
.dbp-count {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  color: var(--dbp-muted);
  margin-bottom: 10px;
  letter-spacing: .04em;
}

// ── Records ───────────────────────────────────────────────────────────────────
.dbp-records {
  border: 1px solid var(--dbp-border);
  border-radius: var(--dbp-radius);
  overflow: hidden;
}

.dbp-record {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 11px 16px;
  border-bottom: 1px solid var(--dbp-border2);
  transition: background .12s;
  position: relative;

  &:last-child { border-bottom: none; }
  &:hover { background: rgba(255,255,255,.03); }
  &:hover .dbp-record__acts { opacity: 1; }
}

.dbp-record__av {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  font-weight: 800;
  flex-shrink: 0;
  letter-spacing: -.01em;

  &[data-g="GOMAN"] { background: rgba(245,158,11,.15); color: var(--c-goman); }
  &[data-g="GSTC"]  { background: rgba(59,130,246,.15);  color: var(--c-gstc);  }
  &[data-g="GERE"]  { background: rgba(16,185,129,.15);  color: var(--c-gere);  }
  &[data-g="SESMT"] { background: rgba(167,139,250,.15); color: var(--c-sesmt); }

  &--bus {
    font-size: 0;
    i { font-size: 16px !important; }
  }
}

.dbp-record__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.dbp-record__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--dbp-txt);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -.01em;
}
.dbp-record__sub {
  font-size: 11.5px;
  color: var(--dbp-muted);
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: nowrap;
  overflow: hidden;
}
.dbp-mat {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  color: rgba(255,255,255,.5);
  background: rgba(255,255,255,.05);
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid var(--dbp-border);
  flex-shrink: 0;
}
.dbp-record__dot {
  opacity: .3;
  flex-shrink: 0;
}

.dbp-record__chips {
  display: flex;
  gap: 5px;
  flex-shrink: 0;
  flex-wrap: nowrap;
  @media (max-width: 600px) { display: none; }
}

.dbp-chip {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .05em;
  padding: 2px 7px;
  border-radius: 4px;
  border: 1px solid transparent;

  &[data-g="GOMAN"] { color: var(--c-goman); background: rgba(245,158,11,.1);  border-color: rgba(245,158,11,.2);  }
  &[data-g="GSTC"]  { color: var(--c-gstc);  background: rgba(59,130,246,.1);  border-color: rgba(59,130,246,.2);  }
  &[data-g="GERE"]  { color: var(--c-gere);  background: rgba(16,185,129,.1);  border-color: rgba(16,185,129,.2);  }
  &[data-g="SESMT"] { color: var(--c-sesmt); background: rgba(167,139,250,.1); border-color: rgba(167,139,250,.2); }

  &--base {
    color: rgba(255,255,255,.5);
    background: rgba(255,255,255,.05);
    border-color: var(--dbp-border);
  }
  &--off {
    color: #F87171;
    background: rgba(248,113,113,.08);
    border-color: rgba(248,113,113,.2);
  }
}

.dbp-record__acts {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity .14s;
  flex-shrink: 0;
}

.dbp-act {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--dbp-muted);
  cursor: pointer;
  transition: all .14s;

  &:hover {
    background: rgba(255,255,255,.08);
    color: var(--dbp-txt);
  }
  &--del:hover {
    background: rgba(248,113,113,.12);
    color: #F87171;
  }
}

// ── Empty ─────────────────────────────────────────────────────────────────────
.dbp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 56px 20px;
  color: var(--dbp-muted);
  i { opacity: .4; }
  p { font-size: 13px; margin: 0; }
}

// ── Record entrance animation ─────────────────────────────────────────────────
.rec-enter-active {
  transition: opacity .22s ease, transform .22s ease;
}
.rec-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

// ── Dialog ────────────────────────────────────────────────────────────────────
.dbp-dlg {
  min-width: 380px;
  max-width: 460px;
  border-radius: 14px !important;
  overflow: hidden;
  border: 1px solid var(--dbp-border) !important;
}

.dbp-dlg__bar {
  height: 3px;
  &[data-g="GOMAN"] { background: var(--c-goman); }
  &[data-g="GSTC"]  { background: var(--c-gstc);  }
  &[data-g="GERE"]  { background: var(--c-gere);  }
  &[data-g="SESMT"] { background: var(--c-sesmt); }
}

.dbp-dlg__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 20px 12px;
  border-bottom: 1px solid var(--dbp-border);
}
.dbp-dlg__title {
  font-family: 'Syne', sans-serif;
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 3px;
  letter-spacing: -.01em;
}
.dbp-dlg__sub {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--dbp-muted);
  margin: 0;
}
.dbp-dlg__x {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--dbp-muted);
  padding: 4px;
  border-radius: 6px;
  line-height: 1;
  margin-top: -2px;
  flex-shrink: 0;
  &:hover { background: rgba(255,255,255,.06); color: var(--dbp-txt); }
}

.dbp-dlg__body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dbp-dlg__foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px 18px;
  border-top: 1px solid var(--dbp-border);
}
.dbp-dlg__cancel {
  font-size: 13px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid var(--dbp-border);
  background: transparent;
  color: var(--dbp-muted);
  cursor: pointer;
  transition: all .14s;
  &:hover { background: rgba(255,255,255,.05); color: var(--dbp-txt); }
}
.dbp-dlg__save {
  font-size: 13px;
  font-weight: 700;
  padding: 8px 20px;
  border-radius: 8px;
  border: none;
  background: var(--dbp-accent);
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: opacity .14s, transform .12s;
  &:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
  &:disabled { opacity: .5; cursor: not-allowed; }
}

@media (max-width: 500px) {
  .dbp-dlg { min-width: calc(100vw - 32px); }
}
</style>
