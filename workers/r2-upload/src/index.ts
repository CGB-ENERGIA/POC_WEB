export interface Env {
  BUCKET: R2Bucket;
  UPLOAD_TOKEN: string;
  ALLOWED_ORIGINS?: string;
}

interface UploadBody {
  key: string;
  contentType?: string;
  data: string;
}

function corsHeaders(request: Request, env: Env): HeadersInit {
  const origin = request.headers.get("Origin") ?? "";
  const allowed = (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0] ?? "*";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function json(data: unknown, status = 200, extra: HeadersInit = {}): Response {
  return Response.json(data, { status, headers: extra });
}

function unauthorized(request: Request, env: Env): Response {
  return json({ error: "Unauthorized" }, 401, corsHeaders(request, env));
}

function isAuthorized(request: Request, env: Env): boolean {
  const header = request.headers.get("Authorization");
  return header === `Bearer ${env.UPLOAD_TOKEN}`;
}

function decodeBase64(data: string): Uint8Array {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);

    if (url.pathname === "/upload" && request.method === "POST") {
      if (!isAuthorized(request, env)) return unauthorized(request, env);

      let body: UploadBody;
      try {
        body = (await request.json()) as UploadBody;
      } catch {
        return json({ error: "JSON inválido" }, 400, cors);
      }

      if (!body.key || !body.data) {
        return json({ error: "key e data são obrigatórios" }, 400, cors);
      }

      if (body.key.includes("..") || body.key.startsWith("/")) {
        return json({ error: "key inválida" }, 400, cors);
      }

      await env.BUCKET.put(body.key, decodeBase64(body.data), {
        httpMetadata: {
          contentType: body.contentType ?? "image/jpeg",
        },
      });

      return json({ ok: true, key: body.key }, 200, cors);
    }

    if (url.pathname.startsWith("/files/") && request.method === "GET") {
      const key = decodeURIComponent(url.pathname.slice("/files/".length));
      const object = await env.BUCKET.get(key);
      if (!object) {
        return new Response("Not found", { status: 404, headers: cors });
      }

      const headers = new Headers(cors);
      headers.set("Content-Type", object.httpMetadata?.contentType ?? "image/jpeg");
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      return new Response(object.body, { headers });
    }

    return json({ error: "Not found" }, 404, cors);
  },
};
