import type { Employee } from "@/data/employees";
import { getSupabase } from "@/lib/supabase";
import { isSupabaseSyncEnabled, isR2Configured } from "@/lib/config";
import type { ObservacaoChecklist } from "@/types/checklist";
import { buildChecklistPhotoKey, uploadImageToR2 } from "@/services/r2-upload";
import { uploadPhotoToStorage } from "@/services/supabase-storage";

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
 */
export async function syncChecklistToRemote(
  entry: ObservacaoChecklist,
  employee: Employee
): Promise<void> {
  if (!isSupabaseSyncEnabled() || !navigator.onLine) return;

  await ensureEmployee(employee);

  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from("checklist_submissions")
    .select("id")
    .eq("client_id", entry.id)
    .maybeSingle();

  if (existing) return;

  const r2Available = isR2Configured();

  const localPhotoKeys: { key: string; sortOrder: number }[] = [];
  for (let i = 0; i < entry.fotosLocal.length; i++) {
    const key = buildChecklistPhotoKey(entry.id, "local", String(i));
    const result = await uploadFoto(key, entry.fotosLocal[i], r2Available);
    if (result) localPhotoKeys.push({ key: result, sortOrder: i });
  }

  const responseRows = [];
  for (const r of entry.respostas) {
    let fotoKey: string | null = null;
    if (r.foto) {
      const key = buildChecklistPhotoKey(entry.id, "nc", r.perguntaId);
      fotoKey = await uploadFoto(key, r.foto, r2Available);
    }

    responseRows.push({
      pergunta_id: r.perguntaId,
      categoria: r.categoria,
      pergunta: r.pergunta,
      gravidade: r.gravidade,
      peso: r.peso,
      resposta: r.resposta,
      observacao: r.observacao ?? null,
      foto_r2_key: fotoKey,
    });
  }

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
}
