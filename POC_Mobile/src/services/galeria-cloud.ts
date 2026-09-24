import { getSupabase } from "@/lib/supabase";

const BUCKET = "galeria-fotos";

export interface CloudFotoMeta {
  id: string;
  matricula: string;
  dataHora: string;
  tamanho: number;
  url: string;
}

/** Faz upload de um Blob para o Supabase Storage e retorna a URL pública. */
export async function cloudUploadFoto(
  id: string,
  matricula: string,
  blob: Blob,
): Promise<string> {
  const supabase = getSupabase();
  const path = `${matricula}/${id}.jpg`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", upsert: true });

  if (error) throw new Error(`Supabase upload: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Remove uma foto do Storage pelo id/matricula. */
export async function cloudExcluirFoto(id: string, matricula: string): Promise<void> {
  const supabase = getSupabase();
  const path = `${matricula}/${id}.jpg`;
  await supabase.storage.from(BUCKET).remove([path]);
}

/**
 * Lista metadados das fotos na nuvem para uma matrícula.
 * O Supabase Storage salva o nome do arquivo como "{id}.jpg" e inclui
 * `created_at` e `metadata.size` na resposta.
 */
export async function cloudListarFotos(matricula: string): Promise<CloudFotoMeta[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(matricula, { limit: 500, sortBy: { column: "created_at", order: "desc" } });

  if (error || !data) return [];

  return data
    .filter((f) => f.name.endsWith(".jpg"))
    .map((f) => {
      const id = f.name.replace(".jpg", "");
      // Supabase inclui created_at como ISO 8601
      const dataHora = (f as unknown as { created_at: string }).created_at ?? new Date().toISOString();
      const tamanho  = (f.metadata as unknown as { size?: number })?.size ?? 0;
      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(`${matricula}/${f.name}`);
      return { id, matricula, dataHora, tamanho, url: urlData.publicUrl };
    });
}

/** Remove fotos mais antigas que 3 meses do Storage. */
export async function cloudLimparExpirados(matricula: string): Promise<void> {
  const supabase  = getSupabase();
  const limite    = new Date();
  limite.setMonth(limite.getMonth() - 3);

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(matricula, { limit: 500 });

  if (error || !data) return;

  const expirados = data.filter((f) => {
    const created = (f as unknown as { created_at: string }).created_at;
    return created && new Date(created) < limite;
  });

  if (expirados.length) {
    const paths = expirados.map((f) => `${matricula}/${f.name}`);
    await supabase.storage.from(BUCKET).remove(paths);
  }
}
