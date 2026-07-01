import { appConfig, isR2Configured } from "@/lib/config";

export class R2UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "R2UploadError";
  }
}

function stripDataUrl(base64: string): string {
  const idx = base64.indexOf(",");
  return idx >= 0 ? base64.slice(idx + 1) : base64;
}

/** Envia JPEG (base64) para o Worker → Cloudflare R2. Retorna a chave do objeto. */
export async function uploadImageToR2(key: string, base64: string): Promise<string> {
  if (!isR2Configured()) {
    throw new R2UploadError("Upload R2 não configurado.");
  }

  const base = appConfig.r2UploadUrl!.replace(/\/$/, "");
  const res = await fetch(`${base}/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${appConfig.r2UploadToken}`,
    },
    body: JSON.stringify({
      key,
      contentType: "image/jpeg",
      data: stripDataUrl(base64),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new R2UploadError(detail || `Falha no upload (${res.status})`);
  }

  const body = (await res.json()) as { key?: string };
  return body.key ?? key;
}

export function buildChecklistPhotoKey(
  submissionId: string,
  tipo: "local" | "nc",
  suffix: string
): string {
  return `checklists/${submissionId}/${tipo}/${suffix}.jpg`;
}

export function r2PublicUrl(key: string): string | null {
  if (!appConfig.r2PublicBaseUrl) return null;
  const base = appConfig.r2PublicBaseUrl.replace(/\/$/, "");
  return `${base}/${key}`;
}
