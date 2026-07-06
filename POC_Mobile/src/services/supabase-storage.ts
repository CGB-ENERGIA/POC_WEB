import { getSupabase } from "@/lib/supabase";

const BUCKET = "checklist-photos";

function base64ToBlob(base64: string, mimeType = "image/jpeg"): Blob {
  const idx = base64.indexOf(",");
  const data = idx >= 0 ? base64.slice(idx + 1) : base64;
  const bytes = atob(data);
  const ab = new ArrayBuffer(bytes.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < bytes.length; i++) view[i] = bytes.charCodeAt(i);
  return new Blob([ab], { type: mimeType });
}

export async function uploadPhotoToStorage(key: string, base64: string): Promise<string> {
  const supabase = getSupabase();
  const blob = base64ToBlob(base64);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(key, blob, { contentType: "image/jpeg", upsert: true });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(key);
  return data.publicUrl;
}
