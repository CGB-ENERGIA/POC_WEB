/**
 * Cloudflare Worker — upload de fotos para R2
 * Binding R2: variável BUCKET (bind ao bucket poc-checklist-fotos)
 * Secret:     AUTH_TOKEN (deve bater com VITE_R2_UPLOAD_TOKEN no Vercel)
 * Leitura:    GET /files/:key  →  público, sem auth
 * Upload:     POST /upload     →  requer Bearer AUTH_TOKEN
 */

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // Leitura pública — sem autenticação
    if (request.method === "GET" && url.pathname.startsWith("/files/")) {
      const key = decodeURIComponent(url.pathname.slice("/files/".length));
      const object = await env.BUCKET.get(key);
      if (!object) return new Response("Not found", { status: 404 });
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      headers.set("Access-Control-Allow-Origin", "*");
      return new Response(object.body, { headers });
    }

    // Upload requer autenticação
    const auth = request.headers.get("Authorization") ?? "";
    if (auth !== `Bearer ${env.AUTH_TOKEN}`) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    if (request.method === "POST" && url.pathname === "/upload") {
      let body;
      try { body = await request.json(); }
      catch { return new Response("Invalid JSON", { status: 400, headers: corsHeaders }); }

      const { key, contentType = "image/jpeg", data } = body;
      if (!key || !data) return new Response("Missing key or data", { status: 400, headers: corsHeaders });

      const binary = atob(data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      await env.BUCKET.put(key, bytes.buffer, { httpMetadata: { contentType } });

      return new Response(JSON.stringify({ key }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders });
  },
};
