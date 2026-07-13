// Edge Function: face-login
// Autentica por reconhecimento facial SEM alterar a senha do usuário.
// Fluxo: valida descritor via RPC face_match → gera magic link token
// via API admin → cliente troca o token por uma sessão com verifyOtp.

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { descriptor } = await req.json();

    if (!Array.isArray(descriptor) || descriptor.length !== 128) {
      return new Response(JSON.stringify({ error: "Descritor inválido" }), {
        status: 400,
        headers: CORS,
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Compara o rosto (função SQL só faz leitura)
    const { data: match, error: matchErr } = await admin.rpc("face_match", {
      descriptor,
    });

    if (matchErr || !match || match.error || !match.email) {
      return new Response(
        JSON.stringify({ error: "Rosto não reconhecido", distance: match?.distance }),
        { status: 401, headers: CORS },
      );
    }

    // 2. Gera magic link token (não altera a senha)
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: match.email,
    });

    if (linkErr || !link?.properties?.hashed_token) {
      return new Response(
        JSON.stringify({ error: "Falha ao gerar sessão" }),
        { status: 500, headers: CORS },
      );
    }

    return new Response(
      JSON.stringify({
        email: match.email,
        token_hash: link.properties.hashed_token,
        distance: match.distance,
      }),
      { status: 200, headers: CORS },
    );
  } catch {
    return new Response(JSON.stringify({ error: "Requisição inválida" }), {
      status: 400,
      headers: CORS,
    });
  }
});
