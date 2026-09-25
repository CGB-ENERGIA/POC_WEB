import type { Employee } from "@/data/employees";
import { getSupabase } from "@/lib/supabase";
import { isSupabaseSyncEnabled, isR2Configured } from "@/lib/config";
import type { ObservacaoChecklist } from "@/types/checklist";
import { buildChecklistPhotoKey, uploadImageToR2 } from "@/services/r2-upload";
import { uploadPhotoToStorage } from "@/services/supabase-storage";

/** Salva o rascunho em_andamento no user_observations para sobreviver a limpeza de localStorage. */
export async function syncEmAndamentoToRemote(entry: ObservacaoChecklist): Promise<void> {
  if (!isSupabaseSyncEnabled() || !navigator.onLine) return;
  const supabase = getSupabase();

  // Respostas sem foto base64 (podem ser grandes demais para JSON)
  const respostasSemFoto = entry.respostas.map(({ foto: _f, ...r }) => r);

  await supabase.from("user_observations").upsert({
    id: entry.id,
    matricula: entry.matricula,
    observador: entry.observador,
    auditagem: entry.auditagem,
    data: entry.data,
    base: entry.base,
    equipe: entry.equipe,
    resumo: {
      total: entry.resumo.total,
      conformes: entry.resumo.conformes,
      naoConformes: entry.resumo.naoConformes,
      _rascunho: { membros: entry.membros, respostas: respostasSemFoto },
    } as object,
    sync_status: "em_andamento",
    status: "pendente",
  }, { onConflict: "id" });
}

/** Remove o rascunho do remote quando o checklist é finalizado ou descartado. */
export async function deleteEmAndamentoFromRemote(id: string): Promise<void> {
  if (!isSupabaseSyncEnabled() || !navigator.onLine) return;
  const supabase = getSupabase();
  await supabase.from("user_observations").delete().eq("id", id).eq("sync_status", "em_andamento");
}

export class ChecklistSyncError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChecklistSyncError";
  }
}

async function ensureEmployee(employee: Employee): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("ensure_employee", {
    p_matricula: employee.matricula,
    p_nome: employee.nome,
    p_nome_completo: employee.nomeCompleto,
    p_gerencia: employee.gerencia,
    p_base: employee.base,
    p_funcao: employee.funcao,
  });

  if (error) {
    throw new ChecklistSyncError(error.message);
  }
}

/**
 * Tenta upload da foto: R2 primeiro (se configurado), Supabase Storage como fallback.
 * Retorna a chave R2 ou a URL pública do Supabase Storage, ou null se ambos falharem.
 */
async function uploadFoto(key: string, base64: string, r2Available: boolean): Promise<string | null> {
  if (r2Available) {
    try {
      await uploadImageToR2(key, base64);
      return key;
    } catch {
      // R2 falhou, tentar Supabase Storage
    }
  }
  try {
    return await uploadPhotoToStorage(key, base64);
  } catch {
    return null;
  }
}

/**
 * Sincroniza checklist + fotos + respostas (Supabase).
 * Fotos: R2 como primário (se configurado), Supabase Storage como fallback.
 * Idempotente via client_id = id local do registro.
 * Uploads de fotos são feitos em paralelo para reduzir tempo de envio.
 * Retorna { failedPhotos } — número de fotos que não puderam ser enviadas.
 */
export async function syncChecklistToRemote(
  entry: ObservacaoChecklist,
  employee: Employee
): Promise<{ failedPhotos: number }> {
  if (!isSupabaseSyncEnabled() || !navigator.onLine) return { failedPhotos: 0 };

  await ensureEmployee(employee);

  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from("checklist_submissions")
    .select("id")
    .eq("client_id", entry.id)
    .maybeSingle();

  if (existing) return { failedPhotos: 0 };

  const r2Available = isR2Configured();
  let failedPhotos = 0;

  // Upload de fotos gerais em paralelo
  const localPhotoResults = await Promise.all(
    entry.fotosLocal.map(async (foto, i) => {
      const key = buildChecklistPhotoKey(entry.id, "local", String(i));
      const result = await uploadFoto(key, foto, r2Available);
      if (!result) failedPhotos++;
      return result ? { key: result, sortOrder: i } : null;
    })
  );
  const localPhotoKeys = localPhotoResults.filter(
    (r): r is { key: string; sortOrder: number } => r !== null
  );

  // Upload de fotos de não conformidades em paralelo
  const responseRows = await Promise.all(
    entry.respostas.map(async (r) => {
      let fotoKey: string | null = null;
      if (r.foto) {
        const key = buildChecklistPhotoKey(entry.id, "nc", r.perguntaId);
        fotoKey = await uploadFoto(key, r.foto, r2Available);
        if (!fotoKey) failedPhotos++;
      }
      return {
        pergunta_id: r.perguntaId,
        categoria: r.categoria,
        pergunta: r.pergunta,
        gravidade: r.gravidade,
        peso: r.peso,
        resposta: r.resposta,
        observacao: r.observacao ?? null,
        foto_r2_key: fotoKey,
        resolvido: r.resolvido ?? null,
        itens: r.itens ?? null,
        atribuido_tipo: r.atribuidoTipo ?? null,
        atribuido_nome: r.atribuidoNome ?? null,
        atribuido_matricula: r.atribuidoMatricula ?? null,
      };
    })
  );

  const { data: submission, error: subErr } = await supabase
    .from("checklist_submissions")
    .insert({
      client_id: entry.id,
      matricula: entry.matricula,
      observador: entry.observador,
      auditagem: entry.auditagem,
      data: entry.data,
      base: entry.base,
      equipe: entry.equipe,
      membros: entry.membros,
      resumo: entry.resumo,
    })
    .select("id")
    .single();

  if (subErr || !submission) {
    throw new ChecklistSyncError(subErr?.message ?? "Falha ao salvar checklist");
  }

  const submissionId = submission.id;

  // Grava em user_observations (35 dias de retenção, para Minhas Observações no PWA)
  await supabase.from("user_observations").upsert({
    id: entry.id,
    matricula: entry.matricula,
    observador: entry.observador,
    auditagem: entry.auditagem,
    data: entry.data,
    base: entry.base,
    equipe: entry.equipe,
    resumo: entry.resumo,
    sync_status: "synced",
  }, { onConflict: "id" });

  if (responseRows.length) {
    const { error: respErr } = await supabase.from("checklist_responses").insert(
      responseRows.map((row) => ({
        submission_id: submissionId,
        ...row,
      }))
    );
    if (respErr) throw new ChecklistSyncError(respErr.message);
  }

  if (localPhotoKeys.length) {
    const { error: photoErr } = await supabase.from("checklist_photos").insert(
      localPhotoKeys.map(({ key, sortOrder }) => ({
        submission_id: submissionId,
        tipo: "local",
        r2_key: key,
        sort_order: sortOrder,
      }))
    );
    if (photoErr) throw new ChecklistSyncError(photoErr.message);
  }

  return { failedPhotos };
}
