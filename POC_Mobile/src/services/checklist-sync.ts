import type { Employee } from "@/data/employees";
import { getSupabase } from "@/lib/supabase";
import { isSupabaseSyncEnabled, isR2Configured } from "@/lib/config";
import type { ObservacaoChecklist } from "@/types/checklist";
import { buildChecklistPhotoKey, uploadImageToR2 } from "@/services/r2-upload";
import { uploadPhotoToStorage } from "@/services/supabase-storage";

const BUCKET_DRAFT = "checklist-photos";

function base64ToBlob(base64: string): Blob {
  const idx = base64.indexOf(",");
  const data = idx >= 0 ? base64.slice(idx + 1) : base64;
  const bytes = atob(data);
  const ab = new ArrayBuffer(bytes.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < bytes.length; i++) view[i] = bytes.charCodeAt(i);
  return new Blob([ab], { type: "image/jpeg" });
}

/** Faz upload das fotosLocal do rascunho para Storage e retorna as URLs públicas. */
async function uploadFotosRascunho(id: string, matricula: string, fotosLocal: string[]): Promise<string[]> {
  const supabase = getSupabase();
  const urls: string[] = [];
  for (let i = 0; i < fotosLocal.length; i++) {
    const foto = fotosLocal[i];
    if (!foto) { urls.push(""); continue; }
    if (foto.startsWith("http")) { urls.push(foto); continue; } // já é URL
    try {
      const blob = base64ToBlob(foto);
      const path = `rascunho/${matricula}/${id}/foto_${i}.jpg`;
      const { error } = await supabase.storage.from(BUCKET_DRAFT).upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from(BUCKET_DRAFT).getPublicUrl(path);
      urls.push(urlData.publicUrl);
    } catch {
      urls.push(""); // falhou (offline) — foto será pedida ao retomar
    }
  }
  return urls;
}

/** Salva o rascunho em_andamento no user_observations para sobreviver a limpeza de localStorage.
 *  Fotos de evidência são upadas para Storage e as URLs salvas no rascunho. */
export async function syncEmAndamentoToRemote(entry: ObservacaoChecklist): Promise<void> {
  if (!isSupabaseSyncEnabled() || !navigator.onLine) return;
  const supabase = getSupabase();

  const fotosUrls = await uploadFotosRascunho(entry.id, entry.matricula, entry.fotosLocal);
  const respostasSemFoto = entry.respostas.map(({ foto: _f, ...r }) => r);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      _rascunho: { membros: entry.membros, respostas: respostasSemFoto, fotosUrls },
    },
    sync_status: "em_andamento",
    status: "pendente",
  } as any, { onConflict: "id" });
}

/** Remove o rascunho do remote. As fotos no Storage são mantidas: o checklist
 *  retomado (novo rascunho ou envio final) reaproveita essas URLs. */
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
  // Foto já upada durante o rascunho — reutilizar URL diretamente
  if (base64.startsWith("http")) return base64;

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

const UNIQUE_VIOLATION = "23505";

async function findSubmissionId(clientId: string): Promise<string | null> {
  const { data, error } = await getSupabase()
    .from("checklist_submissions")
    .select("id")
    .eq("client_id", clientId)
    .maybeSingle();
  if (error) throw new ChecklistSyncError(error.message);
  return data?.id ?? null;
}

/**
 * Envia checklist + fotos + respostas ao Supabase.
 * Retomável e idempotente (client_id = id local): se um envio anterior caiu no
 * meio, completa só o que faltou, sem duplicar submissão, respostas ou fotos.
 * Falha de foto aborta o envio (para tentar de novo com a foto ainda no aparelho),
 * a menos que allowPhotoLoss — usado após várias tentativas, para não travar a fila.
 */
export async function syncChecklistToRemote(
  entry: ObservacaoChecklist,
  employee: Employee,
  opts: { allowPhotoLoss?: boolean } = {}
): Promise<{ failedPhotos: number }> {
  if (!navigator.onLine) throw new ChecklistSyncError("Sem conexão com a internet");

  await ensureEmployee(employee);
  const supabase = getSupabase();

  let submissionId = await findSubmissionId(entry.id);

  let needLocalPhotos = entry.fotosLocal.length > 0;
  if (submissionId && needLocalPhotos) {
    const { count, error } = await supabase
      .from("checklist_photos")
      .select("id", { count: "exact", head: true })
      .eq("submission_id", submissionId);
    if (error) throw new ChecklistSyncError(error.message);
    needLocalPhotos = (count ?? 0) === 0;
  }

  const r2Available = isR2Configured();
  let failedPhotos = 0;

  const localPhotoResults = needLocalPhotos
    ? await Promise.all(
        entry.fotosLocal.map(async (foto, i) => {
          if (!foto) return null;
          const key = buildChecklistPhotoKey(entry.id, "local", String(i));
          const result = await uploadFoto(key, foto, r2Available);
          if (!result) failedPhotos++;
          return result ? { key: result, sortOrder: i } : null;
        })
      )
    : [];
  const localPhotoKeys = localPhotoResults.filter(
    (r): r is { key: string; sortOrder: number } => r !== null
  );

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

  if (failedPhotos > 0 && !opts.allowPhotoLoss) {
    throw new ChecklistSyncError(
      `${failedPhotos} foto${failedPhotos > 1 ? "s" : ""} não ${failedPhotos > 1 ? "puderam" : "pôde"} ser enviada${failedPhotos > 1 ? "s" : ""}`
    );
  }

  if (!submissionId) {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        membros: entry.membros as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resumo: entry.resumo as any,
      })
      .select("id")
      .single();

    if (subErr?.code === UNIQUE_VIOLATION) {
      submissionId = await findSubmissionId(entry.id);
    } else if (subErr || !submission) {
      throw new ChecklistSyncError(subErr?.message ?? "Falha ao salvar checklist");
    } else {
      submissionId = submission.id;
    }
    if (!submissionId) throw new ChecklistSyncError("Falha ao salvar checklist");
  }

  if (responseRows.length) {
    // ON CONFLICT DO NOTHING: completa respostas faltantes de um envio interrompido.
    const { error: respErr } = await supabase.from("checklist_responses").upsert(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      responseRows.map((row) => ({ submission_id: submissionId, ...row })) as any,
      { onConflict: "submission_id,pergunta_id", ignoreDuplicates: true }
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

  // Por último: é o que faz o registro aparecer em Minhas Observações (35 dias).
  const { error: uoErr } = await supabase.from("user_observations").upsert({
    id: entry.id,
    matricula: entry.matricula,
    observador: entry.observador,
    auditagem: entry.auditagem,
    data: entry.data,
    base: entry.base,
    equipe: entry.equipe,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resumo: entry.resumo as any,
    sync_status: "synced",
  }, { onConflict: "id" });
  // Não bloqueia a fila: a submissão já está gravada; fetchSynced reconcilia depois.
  if (uoErr) console.warn("[sync] user_observations:", uoErr.message);

  return { failedPhotos };
}

/** client_ids (entre os informados) que já existem no servidor. */
export async function fetchExistingClientIds(clientIds: string[]): Promise<Set<string>> {
  const found = new Set<string>();
  const supabase = getSupabase();
  for (let i = 0; i < clientIds.length; i += 100) {
    const chunk = clientIds.slice(i, i + 100);
    const { data, error } = await supabase
      .from("checklist_submissions")
      .select("client_id")
      .in("client_id", chunk);
    if (error) throw new ChecklistSyncError(error.message);
    for (const row of data ?? []) if (row.client_id) found.add(row.client_id);
  }
  return found;
}
