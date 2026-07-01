import type { Employee } from "@/data/employees";
import type { Observacao } from "@/stores/observacoes";
import { getSupabase } from "@/lib/supabase";
import { isRemoteSyncEnabled } from "@/lib/config";

export async function syncObservacaoLivreToRemote(
  entry: Observacao,
  employee: Employee
): Promise<void> {
  if (!isRemoteSyncEnabled() || !navigator.onLine) return;

  const supabase = getSupabase();

  await supabase.rpc("ensure_employee", {
    p_matricula: employee.matricula,
    p_nome: employee.nome,
    p_nome_completo: employee.nomeCompleto,
    p_gerencia: employee.gerencia,
    p_base: employee.base,
    p_funcao: employee.funcao,
  });

  const { data: existing } = await supabase
    .from("observacoes_livres")
    .select("id")
    .eq("client_id", entry.id)
    .maybeSingle();

  if (existing) return;

  const { error } = await supabase.from("observacoes_livres").insert({
    client_id: entry.id,
    matricula: entry.matricula,
    observador: entry.observador,
    auditagem: entry.auditagem,
    data: entry.data,
    base: entry.base,
    equipe: entry.equipe,
    categoria: entry.categoria,
    item: entry.item,
    tipo: entry.tipo,
    severidade: entry.severidade,
    descricao: entry.descricao,
    resolvido: entry.resolvido,
  });

  if (error) throw error;
}
