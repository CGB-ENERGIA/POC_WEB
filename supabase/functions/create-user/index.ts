// Edge Function: create-user
// Permite que o admin (ADMIN_EMAIL) crie ou remova usuários com um papel
// definido ("admin" ou "member"). Usuários "member" só enxergam páginas de
// gráficos/visões no POC_OP (restrição aplicada no router do frontend).

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const ADMIN_EMAIL = "italo.fontes@cgbengenharia.com.br";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: CORS });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: caller, error: callerErr } = await admin.auth.getUser(token);
    if (callerErr || caller.user?.email !== ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: "Apenas o administrador pode gerenciar usuários" }), {
        status: 403,
        headers: CORS,
      });
    }

    const body = await req.json();
    const action = body.action ?? "create";

    if (action === "delete") {
      const { userId } = body;
      if (!userId) {
        return new Response(JSON.stringify({ error: "userId obrigatório" }), { status: 400, headers: CORS });
      }
      if (userId === caller.user.id) {
        return new Response(JSON.stringify({ error: "Você não pode remover a si mesmo" }), { status: 400, headers: CORS });
      }
      const { error: delErr } = await admin.auth.admin.deleteUser(userId);
      if (delErr) {
        return new Response(JSON.stringify({ error: delErr.message }), { status: 400, headers: CORS });
      }
      await admin.from("profiles").delete().eq("id", userId);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: CORS });
    }

    // action === "create"
    const { email, password, name, role } = body;
    const finalRole = role === "admin" ? "admin" : "member";

    if (!email || !password || password.length < 8) {
      return new Response(
        JSON.stringify({ error: "E-mail e senha (mín. 8 caracteres) são obrigatórios" }),
        { status: 400, headers: CORS },
      );
    }

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: name ? { name } : undefined,
    });

    if (createErr || !created.user) {
      return new Response(JSON.stringify({ error: createErr?.message ?? "Falha ao criar usuário" }), {
        status: 400,
        headers: CORS,
      });
    }

    const { error: profileErr } = await admin
      .from("profiles")
      .upsert({ id: created.user.id, email, role: finalRole });

    if (profileErr) {
      return new Response(JSON.stringify({ error: profileErr.message }), { status: 400, headers: CORS });
    }

    return new Response(
      JSON.stringify({ success: true, id: created.user.id, email, role: finalRole }),
      { status: 200, headers: CORS },
    );
  } catch {
    return new Response(JSON.stringify({ error: "Requisição inválida" }), { status: 400, headers: CORS });
  }
});
