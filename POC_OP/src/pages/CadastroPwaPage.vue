<template>
  <q-page class="cp-page">

    <div class="cp-topbar">
      <div>
        <p class="cp-eyebrow">Administração · PWA</p>
        <h1 class="cp-title">Banco de Dados da PWA</h1>
      </div>
      <q-btn flat dense round icon="mdi-refresh" :loading="loading" @click="fetchAll">
        <q-tooltip>Atualizar</q-tooltip>
      </q-btn>
    </div>

    <q-separator class="cp-sep" />

    <q-tabs v-model="tab" dense align="left" active-color="primary" indicator-color="primary" class="cp-tabs">
      <q-tab name="funcionarios" icon="mdi-account-group" label="Funcionários" />
      <q-tab name="equipes"      icon="mdi-bus-multiple"  label="Equipes" />
    </q-tabs>

    <q-tab-panels v-model="tab" animated class="cp-panels">

      <!-- ─── ABA FUNCIONÁRIOS ─────────────────────────────────────────────── -->
      <q-tab-panel name="funcionarios" class="q-pa-none">
        <div class="cp-toolbar">
          <q-input v-model="empSearch" dense outlined clearable placeholder="Buscar por nome ou matrícula…" class="cp-search">
            <template #prepend><q-icon name="mdi-magnify" size="18px" /></template>
          </q-input>
          <q-select
            v-model="empGerenciaFilter"
            :options="['Todas', 'GOMAN', 'GSTC', 'GERE', 'SESMT']"
            dense outlined label="Gerência"
            style="min-width:140px"
          />
          <q-btn unelevated color="primary" icon="mdi-plus" label="Adicionar" size="sm" @click="openEmpDialog()" />
        </div>

        <div class="cp-count">{{ filteredEmployees.length }} funcionários</div>

        <q-card flat bordered class="q-mt-sm">
          <q-list separator>
            <q-item v-for="e in filteredEmployees" :key="e.id" class="cp-item">
              <q-item-section avatar>
                <q-avatar size="36px" color="blue-grey-8" text-color="white" class="text-weight-bold" style="font-size:13px">
                  {{ e.nome.charAt(0) }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="cp-name">
                  {{ e.nome_completo }}
                  <q-badge v-if="!e.ativo" color="grey-6" label="Inativo" class="q-ml-xs" />
                </q-item-label>
                <q-item-label caption>Mat. {{ e.matricula }} · {{ e.funcao }} · {{ e.gerencia }} · {{ e.base }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row gap-xs">
                  <q-btn flat round dense icon="mdi-pencil-outline" color="grey-6" size="sm" @click="openEmpDialog(e)">
                    <q-tooltip>Editar</q-tooltip>
                  </q-btn>
                  <q-btn flat round dense icon="mdi-delete-outline" color="negative" size="sm" @click="deleteEmployee(e)">
                    <q-tooltip>Remover</q-tooltip>
                  </q-btn>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </q-tab-panel>

      <!-- ─── ABA EQUIPES ──────────────────────────────────────────────────── -->
      <q-tab-panel name="equipes" class="q-pa-none">
        <div class="cp-toolbar">
          <q-input v-model="eqSearch" dense outlined clearable placeholder="Buscar por prefixo ou base…" class="cp-search">
            <template #prepend><q-icon name="mdi-magnify" size="18px" /></template>
          </q-input>
          <q-select
            v-model="eqGerenciaFilter"
            :options="['Todas', 'GOMAN', 'GSTC', 'GERE']"
            dense outlined label="Gerência"
            style="min-width:140px"
          />
          <q-btn unelevated color="primary" icon="mdi-plus" label="Adicionar" size="sm" @click="openEqDialog()" />
        </div>

        <div class="cp-count">{{ filteredEquipes.length }} equipes</div>

        <q-card flat bordered class="q-mt-sm">
          <q-list separator>
            <q-item v-for="eq in filteredEquipes" :key="eq.id" class="cp-item">
              <q-item-section avatar>
                <q-icon name="mdi-bus-multiple" color="blue-grey-6" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="cp-name">{{ eq.prefixo }}</q-item-label>
                <q-item-label caption>Base {{ eq.base }} · {{ eq.gerencia }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row gap-xs">
                  <q-btn flat round dense icon="mdi-pencil-outline" color="grey-6" size="sm" @click="openEqDialog(eq)">
                    <q-tooltip>Editar</q-tooltip>
                  </q-btn>
                  <q-btn flat round dense icon="mdi-delete-outline" color="negative" size="sm" @click="deleteEquipe(eq)">
                    <q-tooltip>Remover</q-tooltip>
                  </q-btn>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </q-tab-panel>
    </q-tab-panels>

    <!-- ─── DIALOG FUNCIONÁRIO ───────────────────────────────────────────────── -->
    <q-dialog v-model="empDialog" persistent>
      <q-card style="min-width:380px;max-width:460px">
        <q-card-section>
          <p class="text-subtitle1 text-weight-bold q-mb-none">
            {{ empIsEditing ? 'Editar Funcionário' : 'Novo Funcionário' }}
          </p>
        </q-card-section>
        <q-card-section class="q-gutter-sm q-pt-none">
          <q-input v-model="empForm.matricula"     label="Matrícula *"      dense outlined />
          <q-input v-model="empForm.nome"          label="Nome curto *"     dense outlined />
          <q-input v-model="empForm.nome_completo" label="Nome completo *"  dense outlined />
          <div class="row q-gutter-sm">
            <q-select
              v-model="empForm.gerencia"
              :options="['GOMAN','GSTC','GERE','SESMT']"
              label="Gerência *" dense outlined class="col"
            />
            <q-input v-model="empForm.base"  label="Base *"   dense outlined class="col" />
          </div>
          <div class="row q-gutter-sm items-center">
            <q-input v-model="empForm.funcao" label="Função *" dense outlined class="col" />
            <q-toggle v-model="empForm.ativo" label="Ativo" class="q-ml-sm" />
          </div>
          <p v-if="empError" class="text-negative text-caption q-mb-none">{{ empError }}</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn unelevated color="primary" label="Salvar" :loading="saving" @click="saveEmployee" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ─── DIALOG EQUIPE ────────────────────────────────────────────────────── -->
    <q-dialog v-model="eqDialog" persistent>
      <q-card style="min-width:340px;max-width:420px">
        <q-card-section>
          <p class="text-subtitle1 text-weight-bold q-mb-none">
            {{ eqForm.id ? 'Editar Equipe' : 'Nova Equipe' }}
          </p>
        </q-card-section>
        <q-card-section class="q-gutter-sm q-pt-none">
          <q-input v-model="eqForm.base"     label="Base *"     dense outlined />
          <q-input v-model="eqForm.prefixo"  label="Prefixo *"  dense outlined />
          <q-select
            v-model="eqForm.gerencia"
            :options="['GOMAN','GSTC','GERE']"
            label="Gerência *" dense outlined
          />
          <p v-if="eqError" class="text-negative text-caption q-mb-none">{{ eqError }}</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn unelevated color="primary" label="Salvar" :loading="saving" @click="saveEquipe" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useQuasar } from "quasar";
import { supabase } from "@/lib/supabase";

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
</script>

<style scoped lang="scss">
.cp-page {
  padding: 32px 40px;
  max-width: 1100px;
  margin: 0 auto;
}
.cp-topbar {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 20px;
}
.cp-eyebrow {
  font-size: 10px; font-weight: 700; letter-spacing: .18em;
  text-transform: uppercase; color: $primary; margin: 0 0 6px; opacity: .85;
}
.cp-title { font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -.02em; }
.cp-sep   { margin-bottom: 24px; }
.cp-tabs  { margin-bottom: 20px; }
.cp-panels { background: transparent !important; }

.cp-toolbar {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  margin-bottom: 8px;
}
.cp-search { flex: 1; min-width: 200px; }
.cp-count  { font-size: 11px; opacity: .4; margin-bottom: 4px; }

.cp-item { padding: 10px 16px; }
.cp-name { font-size: 13px; font-weight: 600; }

@media (max-width: 600px) {
  .cp-page { padding: 20px 16px; }
}
</style>
