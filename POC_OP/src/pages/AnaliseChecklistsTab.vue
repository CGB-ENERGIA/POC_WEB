<template>
  <div class="ac-tab">
    <q-linear-progress v-if="loading" indeterminate color="primary" style="position:sticky;top:0;z-index:200" />

    <!-- KPIs -->
    <div class="kpi-row q-mb-md">
      <div class="kpi-mini" style="--kc:#d97706;--kbg:rgba(217,119,6,.1)">
        <q-icon name="mdi-clock-outline" size="18px" class="kpi-mini__icon" />
        <div class="kpi-mini__value">{{ pendentes.length }}</div>
        <div class="kpi-mini__label">Aguardando</div>
      </div>
      <div class="kpi-mini" style="--kc:#16a34a;--kbg:rgba(22,163,74,.1)">
        <q-icon name="mdi-check-circle-outline" size="18px" class="kpi-mini__icon" />
        <div class="kpi-mini__value">{{ aprovados.length }}</div>
        <div class="kpi-mini__label">Aprovados</div>
      </div>
      <div class="kpi-mini" style="--kc:#dc2626;--kbg:rgba(220,38,38,.1)">
        <q-icon name="mdi-close-circle-outline" size="18px" class="kpi-mini__icon" />
        <div class="kpi-mini__value">{{ reprovados.length }}</div>
        <div class="kpi-mini__label">Reprovados</div>
      </div>
      <div class="kpi-mini" style="--kc:#8B1C2B;--kbg:rgba(139,28,43,.1)">
        <q-icon name="mdi-gauge" size="18px" class="kpi-mini__icon" />
        <div class="kpi-mini__value">{{ taxaAprovacao }}%</div>
        <div class="kpi-mini__label">Taxa Aprovação</div>
      </div>
    </div>

    <!-- Erro -->
    <q-banner v-if="loadError" class="bg-negative text-white q-mb-md" rounded>
      <template #avatar><q-icon name="mdi-alert-circle-outline" /></template>
      {{ loadError }}
      <template #action><q-btn flat label="Tentar novamente" @click="recarregar" /></template>
    </q-banner>

    <!-- Filtros -->
    <div class="row items-center q-mb-md q-gutter-sm">
      <button
        v-for="s in statusOpts" :key="s.value"
        :class="['pill', filtroStatus === s.value && 'pill--active']"
        @click="filtroStatus = s.value"
      >
        <q-icon :name="s.icon" size="14px" class="q-mr-xs" />
        {{ s.label }}
        <q-badge v-if="contagem(s.value) > 0" :color="s.badgeColor" :label="contagem(s.value)" class="q-ml-xs" />
      </button>
      <button
        :class="['pill', soSemEvidencias && 'pill--active']"
        @click="soSemEvidencias = !soSemEvidencias"
      >
        <q-icon name="mdi-camera-off-outline" size="14px" class="q-mr-xs" />
        Sem evidências
        <q-badge v-if="totalSemEvidencias > 0" color="negative" :label="totalSemEvidencias" class="q-ml-xs" />
      </button>
      <q-input v-model="search" dense outlined placeholder="Buscar..." class="search-input q-ml-auto" style="min-width:200px">
        <template #prepend><q-icon name="mdi-magnify" size="18px" color="grey-6" /></template>
      </q-input>
    </div>

    <!-- Lista -->
    <div class="analise-list">
      <div v-if="listaFiltrada.length === 0" class="analise-empty">
        <q-icon name="mdi-check-all" size="48px" color="grey-4" />
        <div class="text-grey-5 q-mt-sm">Nenhum checklist encontrado</div>
      </div>

      <div
        v-for="item in listaFiltrada"
        :key="item.id"
        class="analise-item"
        :class="`analise-item--${item.status}`"
      >
        <!-- Cabeçalho -->
        <div class="analise-item__header">
          <div class="analise-item__meta">
            <span class="status-badge" :class="`status-badge--${item.status}`">
              <q-icon :name="statusIcon(item.status)" size="13px" class="q-mr-xs" />
              {{ statusLabel(item.status) }}
            </span>
            <span class="aud-badge">{{ auditagemLabel(item.auditagem) }}</span>
            <span class="base-badge">{{ item.base }}</span>
            <span class="td-mono" style="font-size:11px;color:#94a3b8">{{ item.equipe }}</span>
            <span
              v-if="faltamEvidencias(item) > 0"
              class="ev-badge"
              :class="evidenciasDe(item) === 0 ? 'ev-badge--none' : 'ev-badge--part'"
            >
              <q-icon name="mdi-camera-off-outline" size="13px" class="q-mr-xs" />
              {{ evidenciasDe(item) === 0 ? "Sem evidências" : `Evidências ${evidenciasDe(item)}/${exigidas(item)}` }}
            </span>
          </div>
          <div class="analise-item__date">{{ fmtDate(item.data) }}</div>
        </div>

        <!-- Corpo -->
        <div class="analise-item__body">
          <div class="analise-item__enviado">
            <q-icon name="mdi-account" size="14px" color="grey-5" class="q-mr-xs" />
            Observador: <strong>{{ item.observador }}</strong>
            <span v-if="item.membros?.length"> · Equipe: {{ item.membros.map(m => m.nome).join(", ") }}</span>
          </div>

          <div class="checklist-resumo">
            <div class="cr-chip cr-chip--total">
              <q-icon name="mdi-clipboard-list-outline" size="14px" />
              {{ item.resumo?.total ?? 0 }} itens
            </div>
            <div class="cr-chip cr-chip--ok">
              <q-icon name="mdi-check" size="14px" />
              {{ item.resumo?.conformes ?? 0 }} conformes
            </div>
            <div class="cr-chip cr-chip--nc">
              <q-icon name="mdi-close" size="14px" />
              {{ item.resumo?.naoConformes ?? 0 }} não conformes
            </div>
          </div>

          <!-- Comentário da análise -->
          <div v-if="item.comentario_analise" class="analise-item__comentario" :class="`analise-item__comentario--${item.status}`">
            <q-icon name="mdi-message-text-outline" size="14px" class="q-mr-xs" />
            <span><strong>{{ item.analisado_por }}</strong>: {{ item.comentario_analise }}</span>
          </div>

          <!-- Ver respostas (expandível) -->
          <div class="ac-expand">
            <button class="ac-expand__btn" @click="toggleExpand(item.id)">
              <q-icon :name="expandedId === item.id ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="16px" />
              {{ expandedId === item.id ? "Ocultar respostas" : "Ver respostas do checklist" }}
            </button>
            <div v-if="expandedId === item.id" class="ac-expand__body">
              <q-spinner v-if="loadingResp" color="primary" size="20px" />
              <template v-else>
                <!-- Evidências Obrigatórias -->
                <div class="ac-evidencias">
                  <div class="ac-evidencias__header">
                    <q-icon name="mdi-camera-outline" size="15px" class="q-mr-xs" />
                    EVIDÊNCIAS OBRIGATÓRIAS
                    <span :class="['ac-evidencias__count', evidenciasDe(item) >= exigidas(item) ? 'ac-evidencias__count--ok' : 'ac-evidencias__count--warn']">
                      {{ evidenciasDe(item) }}/{{ exigidas(item) }}
                    </span>
                  </div>
                  <div class="ac-evidencias__grid">
                    <div
                      v-for="slot in slotsDe(item)"
                      :key="slot"
                      class="ac-ev-card"
                      :class="fotosExpand.find(f => f.sort_order === slot) ? 'ac-ev-card--filled' : 'ac-ev-card--empty'"
                    >
                      <template v-if="fotosExpand.find(f => f.sort_order === slot)">
                        <img
                          :src="fotoUrl(fotosExpand.find(f => f.sort_order === slot)!.r2_key)!"
                          class="ac-ev-card__img"
                          @click="abrirFoto(fotoUrl(fotosExpand.find(f => f.sort_order === slot)!.r2_key)!)"
                        />
                        <div class="ac-ev-card__caption">
                          <q-icon :name="FOTO_LABELS[slot]?.icon ?? 'mdi-camera'" size="12px" />
                          <span class="ac-ev-card__num">{{ slot + 1 }}º</span>
                          {{ FOTO_LABELS[slot]?.label ?? `Foto ${slot + 1}` }}
                        </div>
                        <div class="ac-ev-card__badge ac-ev-card__badge--ok">
                          <q-icon name="mdi-check" size="11px" />
                        </div>
                      </template>
                      <template v-else>
                        <q-icon :name="FOTO_LABELS[slot]?.icon ?? 'mdi-image-off-outline'" size="30px" class="ac-ev-card__empty-icon" />
                        <div class="ac-ev-card__empty-label">
                          <span class="ac-ev-card__num">{{ slot + 1 }}º</span>
                          {{ FOTO_LABELS[slot]?.label ?? `Foto ${slot + 1}` }}
                        </div>
                        <div class="ac-ev-card__badge ac-ev-card__badge--miss">
                          <q-icon name="mdi-alert" size="11px" />
                        </div>
                      </template>
                    </div>
                  </div>
                </div>

                <!-- Não Conformidades em destaque -->
                <div
                  v-if="respostasExpand.filter(r => r.resposta === 'nao_conforme').length"
                  class="ac-ncs q-mt-sm"
                >
                  <div class="ac-ncs__header">
                    <q-icon name="mdi-alert-circle-outline" size="15px" class="q-mr-xs" />
                    NÃO CONFORMIDADES
                    <span class="ac-ncs__count">{{ respostasExpand.filter(r => r.resposta === 'nao_conforme').length }}</span>
                  </div>
                  <div class="ac-ncs__list">
                    <div
                      v-for="r in respostasExpand.filter(r => r.resposta === 'nao_conforme')"
                      :key="'nc-' + r.pergunta_id"
                      class="ac-nc-item"
                    >
                      <q-icon name="mdi-close-circle" color="negative" size="16px" class="ac-nc-item__icon" />
                      <div class="ac-nc-item__body">
                        <div class="ac-nc-item__pergunta">{{ r.pergunta }}</div>
                        <div v-if="r.itens?.length" class="ac-nc-item__itens">
                          <span
                            v-for="it in r.itens" :key="it.nome"
                            :class="['ac-item-chip', it.conforme ? 'ac-item-chip--ok' : 'ac-item-chip--nc']"
                          >
                            <q-icon :name="it.conforme ? 'mdi-check' : 'mdi-close'" size="11px" />
                            {{ it.nome }}
                          </span>
                        </div>
                        <div v-if="r.observacao" class="ac-nc-item__obs">
                          <q-icon name="mdi-comment-text-outline" size="12px" class="q-mr-xs" />{{ r.observacao }}
                        </div>
                        <div v-if="r.atribuido_nome" class="ac-nc-item__atrib">
                          <q-icon name="mdi-account-outline" size="12px" class="q-mr-xs" />{{ r.atribuido_nome }}
                        </div>
                      </div>
                      <img
                        v-if="fotoUrl(r.foto_r2_key)"
                        :src="fotoUrl(r.foto_r2_key)!"
                        class="ac-nc-item__foto"
                        @click="abrirFoto(fotoUrl(r.foto_r2_key)!)"
                      />
                    </div>
                  </div>
                </div>

                <!-- Respostas completas -->
                <div v-if="!respostasExpand.length" class="text-caption text-grey-5 q-mt-sm">Nenhuma resposta encontrada.</div>
                <div v-else class="ac-resp-list q-mt-sm">
                  <div v-for="r in respostasExpand" :key="r.pergunta_id" class="ac-resp-row">
                    <q-icon
                      :name="r.resposta === 'conforme' ? 'mdi-check-circle' : 'mdi-close-circle'"
                      :color="r.resposta === 'conforme' ? 'positive' : 'negative'"
                      size="16px"
                    />
                    <div class="ac-resp-row__text">
                      <div class="ac-resp-row__pergunta">{{ r.pergunta }}</div>
                      <div v-if="r.itens?.length" class="ac-resp-row__itens">
                        <span
                          v-for="it in r.itens" :key="it.nome"
                          :class="['ac-item-chip', it.conforme ? 'ac-item-chip--ok' : 'ac-item-chip--nc']"
                        >
                          <q-icon :name="it.conforme ? 'mdi-check' : 'mdi-close'" size="11px" />
                          {{ it.nome }}
                        </span>
                      </div>
                      <div v-if="r.observacao" class="ac-resp-row__obs">{{ r.observacao }}</div>
                    </div>
                    <img
                      v-if="fotoUrl(r.foto_r2_key)"
                      :src="fotoUrl(r.foto_r2_key)!"
                      class="ac-resp-row__foto"
                      @click="abrirFoto(fotoUrl(r.foto_r2_key)!)"
                    />
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Ações -->
        <div class="analise-item__actions">
          <template v-if="item.status === 'pendente'">
            <q-btn
              unelevated color="positive" icon="mdi-check" label="Aprovar"
              size="sm" class="q-mr-sm"
              :loading="loadingId === item.id"
              @click="abrirAcao(item, 'aprovado')"
            />
            <q-btn
              unelevated color="negative" icon="mdi-close" label="Reprovar"
              size="sm" class="q-mr-sm"
              :disable="loadingId === item.id"
              @click="abrirAcao(item, 'reprovado')"
            />
          </template>
          <template v-else>
            <q-btn
              flat size="sm" color="grey-7"
              :icon="item.status === 'aprovado' ? 'mdi-close' : 'mdi-check'"
              :label="item.status === 'aprovado' ? 'Reverter p/ reprovado' : 'Reverter p/ aprovado'"
              :loading="item.status === 'aprovado' ? false : loadingId === item.id"
              :disable="item.status === 'reprovado' && loadingId !== null"
              @click="abrirAcao(item, item.status === 'aprovado' ? 'reprovado' : 'aprovado')"
            />
          </template>
          <q-btn
            flat icon="mdi-pencil-outline" label="Editar"
            size="sm" color="primary"
            class="q-ml-auto"
            @click="abrirEdicao(item)"
          />
          <q-btn
            flat icon="mdi-delete-outline" label="Apagar"
            size="sm" color="negative"
            @click="abrirDelete(item)"
          />
        </div>
      </div>
    </div>

    <!-- Dialog reprovar (aprovação é direta, sem dialog) -->
    <q-dialog v-model="acaoDialog.open" persistent>
      <q-card style="min-width:340px;max-width:480px;width:100%">
        <q-card-section class="row items-center q-pb-none">
          <q-icon name="mdi-close-circle" color="negative" size="24px" class="q-mr-sm" />
          <div class="text-subtitle1 text-weight-bold">Reprovar Checklist</div>
          <q-space />
          <q-btn flat round dense icon="mdi-close" @click="acaoDialog.open = false" />
        </q-card-section>
        <q-card-section>
          <div class="text-caption text-grey-7 q-mb-sm">
            O colaborador será notificado da reprovação e verá o motivo no PWA.
          </div>
          <q-input
            v-model="acaoDialog.comentario"
            outlined dense type="textarea" rows="3"
            label="Motivo da reprovação *"
            placeholder="Explique o motivo..."
            :disable="acaoDialog.saving"
            autofocus
          />
          <div v-if="acaoDialog.error" class="text-negative text-caption q-mt-xs">
            <q-icon name="mdi-alert-circle-outline" size="14px" /> {{ acaoDialog.error }}
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pb-md q-px-md">
          <q-btn flat label="Cancelar" color="grey-7" @click="acaoDialog.open = false" :disable="acaoDialog.saving" />
          <q-btn
            unelevated color="negative" label="Confirmar Reprovação"
            :loading="acaoDialog.saving"
            :disable="!acaoDialog.comentario.trim()"
            @click="confirmarReprovacao"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog editar checklist -->
    <q-dialog v-model="editDialog.open" persistent>
      <q-card style="width:720px;max-width:96vw;max-height:92vh;display:flex;flex-direction:column">
        <q-card-section class="row items-center q-pb-none">
          <q-icon name="mdi-pencil-outline" color="primary" size="24px" class="q-mr-sm" />
          <div>
            <div class="text-subtitle1 text-weight-bold">Editar Checklist</div>
            <div v-if="editDialog.item" class="text-caption text-grey-6">
              {{ fmtDate(editDialog.item.data) }} · matrícula {{ editDialog.item.matricula }}
            </div>
          </div>
          <q-space />
          <q-btn flat round dense icon="mdi-close" :disable="editDialog.saving" @click="editDialog.open = false" />
        </q-card-section>

        <q-card-section style="overflow:auto;flex:1">
          <div class="text-overline text-grey-6">Cabeçalho</div>
          <div class="row q-col-gutter-sm q-mb-sm">
            <div class="col-12 col-sm-6">
              <q-input v-model="editDialog.equipe" dense outlined label="Equipe / prefixo" />
            </div>
            <div class="col-12 col-sm-3">
              <q-select v-model="editDialog.base" dense outlined label="Base" :options="['BCB','BDC','ITM','PDS','PDT','STI','ADM']" />
            </div>
            <div class="col-12 col-sm-3">
              <q-input v-model="editDialog.observador" dense outlined label="Observador" />
            </div>
          </div>

          <div class="text-overline text-grey-6">Membros</div>
          <div v-for="(m, i) in editDialog.membros" :key="i" class="row q-col-gutter-sm q-mb-xs items-center">
            <div class="col"><q-input v-model="m.nome" dense outlined label="Nome" /></div>
            <div class="col-4"><q-input v-model="m.matricula" dense outlined label="Matrícula" /></div>
            <div class="col-auto">
              <q-btn flat round dense icon="mdi-close" color="negative" @click="editDialog.membros.splice(i, 1)" />
            </div>
          </div>
          <q-btn
            flat dense size="sm" icon="mdi-plus" label="Adicionar membro" color="primary" class="q-mb-md"
            @click="editDialog.membros.push({ nome: '', matricula: '' })"
          />

          <div class="text-overline text-grey-6">
            Respostas
            <span v-if="editDialog.loadingResp"> · carregando…</span>
            <span v-else> · {{ editDialog.respostas.length }} itens · {{ editDialog.alteradas }} alterado(s)</span>
          </div>
          <q-spinner v-if="editDialog.loadingResp" color="primary" size="22px" />
          <div
            v-for="r in editDialog.respostas" :key="r.pergunta_id"
            class="edit-resp" :class="{ 'edit-resp--changed': respostaAlterada(r) }"
          >
            <div class="edit-resp__pergunta">{{ r.pergunta }}</div>
            <div class="row items-center q-gutter-sm">
              <q-btn-toggle
                v-model="r.resposta" dense unelevated no-caps size="sm"
                toggle-color="primary"
                :options="[{ label: 'Conforme', value: 'conforme' }, { label: 'Não conforme', value: 'nao_conforme' }]"
              />
              <q-input v-model="r.observacao" dense outlined class="col" placeholder="Observação" />
            </div>
          </div>
        </q-card-section>

        <q-card-section v-if="editDialog.error" class="q-py-none">
          <div class="text-negative text-caption">
            <q-icon name="mdi-alert-circle-outline" size="14px" /> {{ editDialog.error }}
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pb-md q-px-md">
          <q-btn flat label="Cancelar" color="grey-7" :disable="editDialog.saving" @click="editDialog.open = false" />
          <q-btn
            unelevated color="primary" label="Salvar alterações" :loading="editDialog.saving"
            :disable="editDialog.loadingResp || !editDialog.equipe.trim()" @click="salvarEdicao"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Lightbox foto -->
    <q-dialog v-model="fotoDialog.open">
      <q-card style="max-width:90vw;max-height:90vh;overflow:hidden;background:transparent;box-shadow:none">
        <img :src="fotoDialog.url" style="max-width:90vw;max-height:90vh;object-fit:contain;border-radius:8px" />
      </q-card>
    </q-dialog>

    <!-- Dialog confirmação de apagar -->
    <q-dialog v-model="deleteDialog.open" persistent>
      <q-card style="min-width:320px;max-width:440px;width:100%">
        <q-card-section class="row items-center q-pb-none">
          <q-icon name="mdi-delete-outline" color="negative" size="24px" class="q-mr-sm" />
          <div class="text-subtitle1 text-weight-bold">Apagar Checklist</div>
          <q-space />
          <q-btn flat round dense icon="mdi-close" @click="deleteDialog.open = false" :disable="deleteDialog.deleting" />
        </q-card-section>
        <q-card-section>
          <div class="text-body2">
            Tem certeza que deseja apagar este checklist? Todas as respostas e fotos associadas também serão removidas. Esta ação não pode ser desfeita.
          </div>
          <div v-if="deleteDialog.error" class="text-negative text-caption q-mt-sm">
            <q-icon name="mdi-alert-circle-outline" size="14px" /> {{ deleteDialog.error }}
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pb-md q-px-md">
          <q-btn flat label="Cancelar" color="grey-7" @click="deleteDialog.open = false" :disable="deleteDialog.deleting" />
          <q-btn unelevated color="negative" label="Apagar" icon="mdi-delete" :loading="deleteDialog.deleting" @click="confirmarDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from "vue";
import { useQuasar } from "quasar";
import {
  fetchChecklistsParaAnalise,
  atualizarStatusChecklist,
  deletarChecklist,
  editarChecklist,
  fetchResponses,
  fetchFotosChecklist,
  fetchContagemEvidencias,
  evidenciasExigidas,
  type ChecklistParaAnalise,
  type ResponseRow,
  type FotoChecklistRow,
  type AnaliseStatus,
} from "@/lib/dashboard";
import { useAuth } from "@/composables/useAuth";

const R2_PUBLIC_BASE = (import.meta.env.VITE_R2_PUBLIC_BASE_URL as string ?? "").replace(/\/$/, "");

const $q = useQuasar();
const { user } = useAuth();
function nomeAnalista(): string {
  return (user.value?.user_metadata?.name as string | undefined)
    ?? user.value?.email
    ?? "Sistema";
}

function fotoUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.startsWith("http")) return key;
  if (!R2_PUBLIC_BASE) return null;
  return `${R2_PUBLIC_BASE}/${key}`;
}

const AUDITAGEM_LABELS: Record<string, string> = {
  GOMAN: "GOMAN",
  GSTC: "GSTC",
  ADMINISTRATIVO: "Administrativo",
  ALOJAMENTO: "Alojamento",
  LOGISTICA: "Logística",
  OFICINA: "Oficina",
};
function auditagemLabel(a: string) { return AUDITAGEM_LABELS[a] ?? a; }

// ── Dados ─────────────────────────────────────────────────────────────────────
const loading = ref(false);
const loadError = ref<string | null>(null);
const itens = ref<ChecklistParaAnalise[]>([]);
const evidenciasMap = ref<Record<string, number>>({});

function exigidas(item: ChecklistParaAnalise) { return evidenciasExigidas(item.auditagem); }
/** Evidências enviadas (do checklist expandido usa a lista completa; senão, a contagem em lote). */
function evidenciasDe(item: ChecklistParaAnalise): number {
  if (expandedId.value === item.id && !loadingResp.value) {
    return fotosExpand.value.filter((f) => f.sort_order < exigidas(item)).length;
  }
  return evidenciasMap.value[item.id] ?? exigidas(item);
}
function faltamEvidencias(item: ChecklistParaAnalise): number {
  if (!(item.id in evidenciasMap.value)) return 0;
  return Math.max(0, exigidas(item) - evidenciasDe(item));
}
function slotsDe(item: ChecklistParaAnalise): number[] {
  return Array.from({ length: exigidas(item) }, (_, i) => i);
}

async function recarregar() {
  loading.value = true;
  loadError.value = null;
  try {
    itens.value = await fetchChecklistsParaAnalise();
    // Falha ao contar não bloqueia a tela: sem o número, nada é marcado nem travado
    evidenciasMap.value = await fetchContagemEvidencias(itens.value).catch(() => ({}));
  } catch (e) {
    loadError.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}

onMounted(recarregar);

// ── Filtros ───────────────────────────────────────────────────────────────────
const filtroStatus = ref<"todos" | AnaliseStatus>("pendente");
const search = ref("");
const soSemEvidencias = ref(false);

const statusOpts = [
  { value: "todos",    label: "Todos",     icon: "mdi-format-list-bulleted", badgeColor: "grey" },
  { value: "pendente", label: "Pendentes", icon: "mdi-clock-outline",        badgeColor: "warning" },
  { value: "aprovado", label: "Aprovados", icon: "mdi-check-circle",         badgeColor: "positive" },
  { value: "reprovado",label: "Reprovados",icon: "mdi-close-circle",         badgeColor: "negative" },
] as const;

const pendentes  = computed(() => itens.value.filter((i) => i.status === "pendente"));
const aprovados  = computed(() => itens.value.filter((i) => i.status === "aprovado"));
const reprovados = computed(() => itens.value.filter((i) => i.status === "reprovado"));
const taxaAprovacao = computed(() => {
  const analisados = aprovados.value.length + reprovados.value.length;
  return analisados === 0 ? 0 : Math.round((aprovados.value.length / analisados) * 100);
});

defineExpose({ recarregar, pendentes });

function contagem(status: string): number {
  if (status === "todos") return itens.value.length;
  return itens.value.filter((i) => i.status === status).length;
}

const totalSemEvidencias = computed(() => itens.value.filter((i) => faltamEvidencias(i) > 0).length);

const listaFiltrada = computed(() => {
  let lista = filtroStatus.value === "todos" ? itens.value : itens.value.filter((i) => i.status === filtroStatus.value);
  if (soSemEvidencias.value) lista = lista.filter((i) => faltamEvidencias(i) > 0);
  const q = search.value.toLowerCase().trim();
  if (!q) return lista;
  return lista.filter((i) =>
    [i.base, i.equipe, i.observador, i.auditagem].filter(Boolean).join(" ").toLowerCase().includes(q)
  );
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function statusLabel(s: string) {
  return s === "aprovado" ? "Aprovado" : s === "reprovado" ? "Reprovado" : "Pendente";
}
function statusIcon(s: string) {
  return s === "aprovado" ? "mdi-check-circle" : s === "reprovado" ? "mdi-close-circle" : "mdi-clock-outline";
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

// ── Expandir respostas ──────────────────────────────────────────────────────────
const expandedId = ref<string | null>(null);
const loadingResp = ref(false);
const respostasExpand = ref<ResponseRow[]>([]);
const fotosExpand = ref<FotoChecklistRow[]>([]);

const FOTO_LABELS: Record<number, { icon: string; label: string }> = {
  0: { icon: "mdi-account-group-outline", label: "Selfie com a equipe" },
  1: { icon: "mdi-truck-outline",          label: "Foto da viatura (prefixo)" },
  2: { icon: "mdi-account-hard-hat-outline", label: "Colaboradores em atividade" },
};

async function toggleExpand(id: string) {
  if (expandedId.value === id) { expandedId.value = null; return; }
  expandedId.value = id;
  loadingResp.value = true;
  respostasExpand.value = [];
  fotosExpand.value = [];
  try {
    const [respostas, fotos] = await Promise.all([fetchResponses([id]), fetchFotosChecklist(id)]);
    respostasExpand.value = respostas;
    fotosExpand.value = fotos;
  } finally {
    loadingResp.value = false;
  }
}

// ── Aprovação direta (sem dialog) ─────────────────────────────────────────────
const loadingId = ref<string | null>(null);

async function abrirAcao(item: ChecklistParaAnalise, tipo: AnaliseStatus) {
  if (tipo === "reprovado") {
    acaoDialog.item = item;
    acaoDialog.comentario = "";
    acaoDialog.error = null;
    acaoDialog.open = true;
    return;
  }
  // Sem as evidências obrigatórias não há aprovação: só reprovar (ou pedir novo envio)
  if (tipo === "aprovado" && faltamEvidencias(item) > 0) {
    $q.dialog({
      title: "Não é possível aprovar",
      message: `Este checklist tem ${evidenciasDe(item)} de ${exigidas(item)} fotos de evidência obrigatórias. `
        + "Reprove e peça que o observador refaça o envio com as fotos.",
      ok: { label: "Reprovar", color: "negative", unelevated: true, noCaps: true },
      cancel: { label: "Fechar", flat: true, noCaps: true },
    }).onOk(() => {
      acaoDialog.item = item;
      acaoDialog.comentario = "Não tem evidência fotográfica.";
      acaoDialog.error = null;
      acaoDialog.open = true;
    });
    return;
  }
  // aprovado: executa direto
  loadingId.value = item.id;
  try {
    const updated = await atualizarStatusChecklist(item.id, tipo, nomeAnalista(), undefined);
    const idx = itens.value.findIndex((i) => i.id === updated.id);
    if (idx >= 0) itens.value[idx] = { ...itens.value[idx], ...updated };
    const msg = tipo === "aprovado" ? "Checklist aprovado com sucesso!" : "Checklist revertido para aprovado.";
    $q.notify({ type: "positive", message: msg, position: "top", timeout: 3000 });
  } catch (e) {
    $q.notify({ type: "negative", message: `Erro: ${(e as Error).message}`, position: "top", timeout: 6000 });
  } finally {
    loadingId.value = null;
  }
}

// ── Dialog reprovar ───────────────────────────────────────────────────────────
const acaoDialog = reactive({
  open: false,
  item: null as ChecklistParaAnalise | null,
  comentario: "",
  saving: false,
  error: null as string | null,
});

async function confirmarReprovacao() {
  if (!acaoDialog.item) return;
  acaoDialog.saving = true;
  acaoDialog.error = null;
  try {
    const updated = await atualizarStatusChecklist(
      acaoDialog.item.id, "reprovado",
      nomeAnalista(),
      acaoDialog.comentario.trim()
    );
    const idx = itens.value.findIndex((i) => i.id === updated.id);
    if (idx >= 0) itens.value[idx] = { ...itens.value[idx], ...updated };
    acaoDialog.open = false;
  } catch (e) {
    acaoDialog.error = (e as Error).message;
  } finally {
    acaoDialog.saving = false;
  }
}

// ── Dialog editar ─────────────────────────────────────────────────────────────
type RespostaEdit = {
  pergunta_id: string;
  pergunta: string;
  resposta: "conforme" | "nao_conforme";
  observacao: string | null;
  _orig: { resposta: "conforme" | "nao_conforme"; observacao: string | null };
};

const editDialog = reactive({
  open: false,
  item: null as ChecklistParaAnalise | null,
  equipe: "",
  base: "",
  observador: "",
  membros: [] as { nome: string; matricula: string }[],
  respostas: [] as RespostaEdit[],
  loadingResp: false,
  saving: false,
  error: null as string | null,
  alteradas: 0,
});

const normObs = (v: string | null | undefined) => (v ?? "").trim();
function respostaAlterada(r: RespostaEdit) {
  return r.resposta !== r._orig.resposta || normObs(r.observacao) !== normObs(r._orig.observacao);
}

async function abrirEdicao(item: ChecklistParaAnalise) {
  editDialog.item = item;
  editDialog.equipe = item.equipe ?? "";
  editDialog.base = item.base ?? "";
  editDialog.observador = item.observador ?? "";
  editDialog.membros = (item.membros ?? []).map((m) => ({ nome: m.nome, matricula: m.matricula }));
  editDialog.respostas = [];
  editDialog.error = null;
  editDialog.open = true;
  editDialog.loadingResp = true;
  try {
    const resp = await fetchResponses([item.id]);
    editDialog.respostas = resp.map((r) => ({
      pergunta_id: r.pergunta_id,
      pergunta: r.pergunta,
      resposta: r.resposta,
      observacao: r.observacao,
      _orig: { resposta: r.resposta, observacao: r.observacao },
    }));
  } catch (e) {
    editDialog.error = (e as Error).message;
  } finally {
    editDialog.loadingResp = false;
  }
}

watch(
  () => editDialog.respostas.map((r) => `${r.resposta}|${r.observacao ?? ""}`).join("§"),
  () => { editDialog.alteradas = editDialog.respostas.filter(respostaAlterada).length; },
);

async function salvarEdicao() {
  const item = editDialog.item;
  if (!item) return;
  editDialog.saving = true;
  editDialog.error = null;
  try {
    const membros = editDialog.membros
      .map((m) => ({ nome: m.nome.trim(), matricula: m.matricula.trim() }))
      .filter((m) => m.nome || m.matricula);
    const updated = await editarChecklist(item, {
      equipe: editDialog.equipe,
      base: editDialog.base,
      observador: editDialog.observador,
      membros,
      respostas: editDialog.respostas.filter(respostaAlterada).map((r) => ({
        pergunta_id: r.pergunta_id,
        resposta: r.resposta,
        observacao: normObs(r.observacao) || null,
      })),
    });
    const idx = itens.value.findIndex((i) => i.id === updated.id);
    if (idx >= 0) itens.value[idx] = { ...itens.value[idx], ...updated };
    if (expandedId.value === item.id) {
      respostasExpand.value = await fetchResponses([item.id]);
    }
    editDialog.open = false;
    $q.notify({ type: "positive", message: "Checklist atualizado.", position: "top", timeout: 3000 });
  } catch (e) {
    editDialog.error = (e as Error).message;
  } finally {
    editDialog.saving = false;
  }
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
const fotoDialog = reactive({ open: false, url: "" });
function abrirFoto(url: string) { fotoDialog.url = url; fotoDialog.open = true; }

// ── Dialog apagar ─────────────────────────────────────────────────────────────
const deleteDialog = reactive({
  open: false,
  item: null as ChecklistParaAnalise | null,
  deleting: false,
  error: null as string | null,
});

function abrirDelete(item: ChecklistParaAnalise) {
  deleteDialog.item = item;
  deleteDialog.error = null;
  deleteDialog.open = true;
}

async function confirmarDelete() {
  if (!deleteDialog.item) return;
  deleteDialog.deleting = true;
  deleteDialog.error = null;
  try {
    await deletarChecklist(deleteDialog.item.id, deleteDialog.item.client_id);
    itens.value = itens.value.filter((i) => i.id !== deleteDialog.item!.id);
    deleteDialog.open = false;
  } catch (e) {
    deleteDialog.error = (e as Error).message;
  } finally {
    deleteDialog.deleting = false;
  }
}
</script>

<style scoped lang="scss">
$brand: #8B1C2B;
$border: #e2e8f0;
$inactive-bg: #f1f5f9;
$inactive-text: #475569;

.ac-tab { }

// ── KPI cards (compactos) ────────────────────────────────────────────────────
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  @media (max-width: 700px) { grid-template-columns: repeat(2, 1fr); }
}
.kpi-mini {
  display: flex; align-items: center; gap: 8px;
  background: #fff; border: 1.5px solid $border; border-radius: 10px;
  padding: 10px 12px;

  &__icon {
    color: var(--kc);
    background: var(--kbg);
    border-radius: 8px; padding: 6px; flex-shrink: 0;
  }
  &__value { font-size: 18px; font-weight: 800; color: var(--kc); line-height: 1; }
  &__label { font-size: 11px; font-weight: 600; color: #64748b; margin-left: 2px; }
}

// ── Filtro pills ──────────────────────────────────────────────────────────────
.pill {
  display: inline-flex; align-items: center;
  height: 32px; padding: 0 14px;
  border: 1.5px solid $border; border-radius: 999px;
  background: $inactive-bg; color: $inactive-text;
  font-size: 12px; font-weight: 500; cursor: pointer; outline: none;
  transition: background .18s, color .18s, border-color .18s, box-shadow .18s;
  &:hover:not(.pill--active) { border-color: $brand; color: $brand; background: rgba($brand,.05); }
  &--active { background: $brand; color: #fff; border-color: $brand; box-shadow: 0 2px 8px rgba($brand,.35); font-weight: 600; }
}
.search-input {
  :deep(.q-field__control) { height: 32px; min-height: 32px; border-radius: 8px; }
  :deep(.q-field__native) { font-size: 12px; }
  :deep(.q-field__prepend) { height: 32px; }
}

// ── Lista ─────────────────────────────────────────────────────────────────────
.analise-list { display: flex; flex-direction: column; gap: 12px; }
.analise-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; }

.analise-item {
  background: #fff; border-radius: 12px;
  border: 1.5px solid $border;
  padding: 14px 16px;
  transition: box-shadow .2s;
  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,.07); }

  &--pendente  { border-left: 4px solid #d97706; }
  &--aprovado  { border-left: 4px solid #16a34a; }
  &--reprovado { border-left: 4px solid #dc2626; }
}

.analise-item__header {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 6px; margin-bottom: 10px;
}
.analise-item__meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.ev-badge {
  display: inline-flex; align-items: center;
  font-size: 11px; font-weight: 700;
  padding: 2px 8px; border-radius: 999px;
  &--none { background: rgba(220,38,38,.14); color: #dc2626; }
  &--part { background: rgba(217,119,6,.15); color: #d97706; }
}
.analise-item__date { font-size: 11px; color: #94a3b8; white-space: nowrap; }

.analise-item__body { display: flex; flex-direction: column; gap: 10px; }
.analise-item__enviado { font-size: 12px; color: #64748b; display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }

.checklist-resumo { display: flex; gap: 8px; flex-wrap: wrap; }
.cr-chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 8px;
  font-size: 11.5px; font-weight: 600;
  &--total { background: #f1f5f9; color: #475569; }
  &--ok    { background: #f0fdf4; color: #15803d; }
  &--nc    { background: #fef2f2; color: #991b1b; }
}

.analise-item__comentario {
  display: flex; align-items: flex-start; gap: 6px;
  font-size: 12px; padding: 8px 12px; border-radius: 8px;
  &--aprovado  { background: #f0fdf4; color: #15803d; border: 1px solid rgba(22,163,74,.2); }
  &--reprovado { background: #fef2f2; color: #991b1b; border: 1px solid rgba(220,38,38,.2); }
  &--pendente  { background: #fffbeb; color: #92400e; border: 1px solid rgba(217,119,6,.2); }
}

.analise-item__actions { display: flex; align-items: center; margin-top: 12px; padding-top: 10px; border-top: 1px solid $border; flex-wrap: wrap; gap: 6px; }

// ── Expand respostas ───────────────────────────────────────────────────────────
.ac-expand__btn {
  display: inline-flex; align-items: center; gap: 4px;
  background: none; border: none; cursor: pointer;
  font-size: 12px; font-weight: 600; color: $brand;
  padding: 2px 0;
}
.ac-expand__body { margin-top: 8px; padding: 10px 12px; background: #f8fafc; border-radius: 8px; }
.ac-resp-list { display: flex; flex-direction: column; gap: 8px; }
.ac-resp-row { display: flex; align-items: flex-start; gap: 8px; }
.ac-resp-row__text { flex: 1; min-width: 0; }
.ac-resp-row__pergunta { font-size: 12px; color: #334155; font-weight: 500; }
.ac-resp-row__itens { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
.ac-resp-row__obs { font-size: 11px; color: #64748b; margin-top: 2px; }
.ac-resp-row__foto { width: 44px; height: 44px; object-fit: cover; border-radius: 6px; cursor: zoom-in; flex-shrink: 0; }

.ac-nc-item__itens { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 5px; }

.ac-item-chip {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 2px 7px; border-radius: 999px;
  font-size: 11px; font-weight: 600;
  &--ok { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
  &--nc { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
}

// ── Badges ────────────────────────────────────────────────────────────────────
.status-badge {
  display: inline-flex; align-items: center;
  padding: 3px 10px; border-radius: 999px;
  font-size: 11px; font-weight: 700; white-space: nowrap;
  &--pendente  { background: #fef9c3; color: #854d0e; }
  &--aprovado  { background: #dcfce7; color: #15803d; }
  &--reprovado { background: #fee2e2; color: #991b1b; }
}
.aud-badge {
  display: inline-block; padding: 2px 8px; border-radius: 999px;
  background: #ede9fe; color: #6d28d9;
  font-size: 10.5px; font-weight: 600; white-space: nowrap;
}
.base-badge {
  display: inline-block; padding: 2px 8px; border-radius: 6px;
  background: rgba($brand,.1); color: $brand;
  font-size: 11px; font-weight: 700; letter-spacing: .5px;
}
.td-mono { font-variant-numeric: tabular-nums; }

// ── Evidências Obrigatórias ───────────────────────────────────────────────────
.ac-evidencias {
  border: 1.5px solid #e2e8f0; border-radius: 12px;
  overflow: hidden; background: #f8fafc;

  &__header {
    display: flex; align-items: center;
    padding: 10px 14px;
    background: #fff;
    border-bottom: 1px solid #e2e8f0;
    font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: .8px;
  }
  &__count {
    margin-left: auto;
    font-size: 13px; font-weight: 800;
    &--ok   { color: #16a34a; }
    &--warn { color: #d97706; }
  }
  &__grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 10px; padding: 10px;
    @media (max-width: 700px) { grid-template-columns: 1fr; }
  }
}

.ac-ev-card {
  position: relative; border-radius: 8px; overflow: hidden;
  background: #fff; border: 1.5px solid #e2e8f0;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);

  &--filled { }
  &--empty {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    min-height: 130px; gap: 8px;
    border-style: dashed; border-color: #cbd5e1;
    background: #f8fafc;
  }

  &__img {
    width: 100%; aspect-ratio: 3/4;
    object-fit: contain; background: #111;
    display: block; cursor: zoom-in;
  }

  &__caption {
    position: absolute; bottom: 0; left: 0; right: 0;
    background: linear-gradient(transparent, rgba(0,0,0,.72));
    color: #fff; padding: 20px 10px 8px;
    font-size: 11px; font-weight: 600;
    display: flex; align-items: center; gap: 4px;
    pointer-events: none;
  }

  &__num { font-weight: 800; opacity: .8; }

  &__badge {
    position: absolute; top: 7px; right: 7px;
    width: 22px; height: 22px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 1px 4px rgba(0,0,0,.25);
    &--ok   { background: #16a34a; color: #fff; }
    &--miss { background: #d97706; color: #fff; }
  }

  &__empty-icon { color: #cbd5e1; }
  &__empty-label {
    font-size: 11.5px; color: #94a3b8; font-weight: 500;
    text-align: center; padding: 0 8px;
    display: flex; align-items: center; gap: 3px;
  }
}

// ── Não Conformidades destaque ────────────────────────────────────────────────
.ac-ncs {
  border: 1.5px solid rgba(220,38,38,.3); border-radius: 10px;
  overflow: hidden; background: #fff8f8;

  &__header {
    display: flex; align-items: center;
    padding: 8px 12px;
    background: #fef2f2;
    border-bottom: 1px solid rgba(220,38,38,.2);
    font-size: 11px; font-weight: 700; color: #991b1b; letter-spacing: .5px;
  }
  &__count {
    margin-left: 6px;
    background: #dc2626; color: #fff;
    border-radius: 999px; padding: 0 7px;
    font-size: 11px; font-weight: 700;
  }
  &__list { display: flex; flex-direction: column; gap: 0; }
}

.ac-nc-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(220,38,38,.1);
  &:last-child { border-bottom: none; }

  &__icon { flex-shrink: 0; margin-top: 2px; }
  &__body { flex: 1; min-width: 0; }
  &__pergunta { font-size: 12.5px; font-weight: 600; color: #7f1d1d; }
  &__obs {
    font-size: 11.5px; color: #991b1b;
    margin-top: 3px; display: flex; align-items: center;
    background: rgba(220,38,38,.06); border-radius: 4px;
    padding: 3px 6px;
  }
  &__atrib {
    font-size: 11px; color: #b91c1c; margin-top: 3px;
    display: flex; align-items: center;
  }
  &__foto {
    width: 72px; height: 72px;
    object-fit: cover; border-radius: 6px;
    cursor: zoom-in; flex-shrink: 0;
    border: 1.5px solid rgba(220,38,38,.25);
  }
}

// ── Dark mode ─────────────────────────────────────────────────────────────────
.body--dark {
  .analise-item { background: #1e293b; border-color: #334155; &:hover { box-shadow: 0 4px 16px rgba(0,0,0,.3); } }
  .analise-item__enviado { color: #94a3b8; }
  .analise-item__actions { border-top-color: #334155; }
  .kpi-mini { background: #1e293b; border-color: #334155; }
  .kpi-mini__label { color: #94a3b8; }
  .pill { background: #1e293b; border-color: #334155; color: #94a3b8; &--active { background: $brand; color: #fff; border-color: $brand; } }
  .ac-expand__body { background: #0f172a; }
  .ac-resp-row__pergunta { color: #e2e8f0; }
}

.edit-resp {
  padding: 8px 10px;
  margin-bottom: 6px;
  border: 1px solid rgba(128, 128, 128, 0.25);
  border-radius: 8px;
}
.edit-resp--changed { border-color: #d97706; background: rgba(217, 119, 6, 0.08); }
.edit-resp__pergunta { font-size: 12.5px; margin-bottom: 6px; line-height: 1.35; }
</style>
