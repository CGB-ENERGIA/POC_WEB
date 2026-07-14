<!--
  SQL MIGRATION — rode no Supabase SQL Editor:

  CREATE EXTENSION IF NOT EXISTS pgcrypto;

  CREATE TABLE IF NOT EXISTS public.pending_face_registrations (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name         text NOT NULL,
    email        text NOT NULL,
    user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    descriptor   float8[] NOT NULL,
    photo_base64 text,
    status       text NOT NULL DEFAULT 'pending',
    created_at   timestamptz DEFAULT now(),
    reviewed_at  timestamptz,
    reviewed_by  text,
    CONSTRAINT valid_status CHECK (status IN ('pending','approved','rejected'))
  );

  ALTER TABLE public.pending_face_registrations ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "anon insert"  ON public.pending_face_registrations FOR INSERT TO anon          WITH CHECK (true);
  CREATE POLICY "auth insert"  ON public.pending_face_registrations FOR INSERT TO authenticated  WITH CHECK (true);
  CREATE POLICY "auth select"  ON public.pending_face_registrations FOR SELECT TO authenticated  USING (true);
  CREATE POLICY "auth update"  ON public.pending_face_registrations FOR UPDATE TO authenticated  USING (true);

  CREATE OR REPLACE FUNCTION public.approve_face_registration(reg_id uuid)
  RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
  DECLARE
    reg public.pending_face_registrations;
    uid uuid := gen_random_uuid();
    tok text := gen_random_uuid()::text;
  BEGIN
    SELECT * INTO reg FROM public.pending_face_registrations WHERE id = reg_id AND status = 'pending';
    IF NOT FOUND THEN RETURN json_build_object('error','Cadastro não encontrado ou já processado'); END IF;

    IF reg.user_id IS NOT NULL THEN
      UPDATE auth.users SET encrypted_password = crypt(tok, gen_salt('bf')), updated_at = now() WHERE id = reg.user_id;
      INSERT INTO public.face_descriptors (user_id, email, descriptor, face_token)
      VALUES (reg.user_id, reg.email, reg.descriptor, tok);
    ELSE
      IF EXISTS (SELECT 1 FROM auth.users WHERE email = reg.email) THEN
        RETURN json_build_object('error','E-mail já cadastrado no sistema');
      END IF;
      INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
      VALUES (uid,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
        reg.email, crypt(tok,gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('name', reg.name), false, now(), now());
      INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
      VALUES (reg.email, uid, jsonb_build_object('sub', uid::text, 'email', reg.email), 'email', now(), now(), now());
      INSERT INTO public.face_descriptors (user_id, email, descriptor, face_token)
      VALUES (uid, reg.email, reg.descriptor, tok);
    END IF;

    UPDATE public.pending_face_registrations
    SET status = 'approved', reviewed_at = now(), reviewed_by = auth.email()
    WHERE id = reg_id;
    RETURN json_build_object('success', true);
  END; $$;
  GRANT EXECUTE ON FUNCTION public.approve_face_registration TO authenticated;

  CREATE OR REPLACE FUNCTION public.reject_face_registration(reg_id uuid)
  RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
  BEGIN
    UPDATE public.pending_face_registrations
    SET status = 'rejected', reviewed_at = now(), reviewed_by = auth.email()
    WHERE id = reg_id AND status = 'pending';
  END; $$;
  GRANT EXECUTE ON FUNCTION public.reject_face_registration TO authenticated;
-->
<template>
  <q-page class="ap-page">

    <!-- Header -->
    <div class="ap-topbar">
      <div>
        <p class="ap-eyebrow">Administração · Segurança</p>
        <h1 class="ap-title">Aprovações de Acesso Facial</h1>
      </div>
      <q-btn
        flat dense round
        icon="mdi-refresh"
        :loading="loading"
        @click="fetchAll"
      >
        <q-tooltip>Atualizar</q-tooltip>
      </q-btn>
    </div>

    <q-separator class="ap-sep" />

    <!-- Pendentes -->
    <section v-if="pending.length" class="ap-section">
      <p class="ap-section-label">
        <q-icon name="mdi-clock-outline" size="14px" class="q-mr-xs" />
        AGUARDANDO APROVAÇÃO · {{ pending.length }}
      </p>

      <div class="ap-grid">
        <q-card
          v-for="r in pending"
          :key="r.id"
          flat bordered
          class="ap-card"
        >
          <!-- Foto -->
          <div class="ap-card__photo">
            <img v-if="r.photo_base64" :src="r.photo_base64" alt="foto" />
            <div v-else class="ap-card__no-photo">
              <q-icon name="mdi-account" size="42px" color="grey-6" />
            </div>
          </div>

          <q-card-section class="ap-card__info">
            <p class="ap-card__name">{{ r.name }}</p>
            <p class="ap-card__email">{{ r.email }}</p>
            <p class="ap-card__date">
              <q-icon name="mdi-calendar" size="12px" />
              {{ formatDate(r.created_at) }}
            </p>
            <q-chip
              v-if="r.source === 'mobile'"
              size="xs"
              color="deep-orange-8"
              text-color="white"
              icon="mdi-cellphone"
              label="Checklist Mobile"
            />
            <q-chip
              v-else-if="r.user_id"
              size="xs"
              color="blue-grey-8"
              text-color="white"
              icon="mdi-account-check"
              label="Usuário existente"
            />
          </q-card-section>

          <q-separator />

          <q-card-actions class="ap-card__actions">
            <q-btn
              unelevated
              color="positive"
              label="Aprovar"
              icon="mdi-check"
              size="sm"
              class="full-width q-mb-xs"
              :loading="actionId === r.id + '_a'"
              @click="aprovar(r)"
            />
            <q-btn
              flat
              color="negative"
              label="Rejeitar"
              icon="mdi-close"
              size="sm"
              class="full-width"
              :loading="actionId === r.id + '_r'"
              @click="rejeitar(r)"
            />
          </q-card-actions>
        </q-card>
      </div>
    </section>

    <!-- Vazio -->
    <div v-else-if="!loading" class="ap-empty">
      <q-icon name="mdi-check-circle-outline" size="56px" color="positive" />
      <p>Nenhum cadastro pendente de aprovação.</p>
    </div>

    <div v-if="loading && !pending.length" class="ap-empty">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <!-- Histórico -->
    <section v-if="history.length" class="ap-section ap-section--history">
      <p class="ap-section-label">
        <q-icon name="mdi-history" size="14px" class="q-mr-xs" />
        HISTÓRICO RECENTE
      </p>

      <q-card flat bordered>
        <q-list separator>
          <q-item v-for="r in history" :key="r.id" class="ap-hist-item">
            <q-item-section avatar>
              <q-avatar size="40px" class="ap-hist-avatar">
                <img v-if="r.photo_base64" :src="r.photo_base64" />
                <q-icon v-else name="mdi-account" color="grey-6" />
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label class="ap-hist-name">
                {{ r.name }}
                <q-badge
                  v-if="r.source === 'mobile'"
                  color="deep-orange-8"
                  label="Mobile"
                  class="q-ml-xs"
                />
              </q-item-label>
              <q-item-label caption class="ap-hist-email">{{ r.email }}</q-item-label>
            </q-item-section>

            <q-item-section side class="ap-hist-side">
              <q-badge
                :color="r.status === 'approved' ? 'positive' : 'negative'"
                :label="r.status === 'approved' ? 'Aprovado' : 'Rejeitado'"
              />
              <q-item-label caption class="q-mt-xs">
                {{ formatDate(r.reviewed_at) }}
              </q-item-label>
              <q-item-label caption>por {{ r.reviewed_by }}</q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-btn
                flat round dense
                icon="mdi-delete-outline"
                color="negative"
                size="sm"
                :loading="actionId === r.id + '_del'"
                @click="remover(r)"
              >
                <q-tooltip>Remover usuário</q-tooltip>
              </q-btn>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </section>

  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = "italo.fontes@cgbengenharia.com.br";

interface Registration {
  id: string;
  name: string;
  email: string;
  user_id: string | null;
  photo_base64: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  source: "web" | "mobile";
}

const router   = useRouter();
const $q       = useQuasar();
const loading  = ref(true);
const actionId = ref<string | null>(null);
const pending  = ref<Registration[]>([]);
const history  = ref<Registration[]>([]);

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email !== ADMIN_EMAIL) {
    router.replace("/");
    return;
  }
  await fetchAll();
});

async function fetchAll() {
  loading.value = true;

  const [web, mobile] = await Promise.all([
    supabase
      .from("pending_face_registrations")
      .select("id, name, email, user_id, photo_base64, status, created_at, reviewed_at, reviewed_by")
      .order("created_at", { ascending: false }),
    supabase
      .from("mobile_face_pending")
      .select("id, nome, matricula, photo_base64, status, created_at, reviewed_at, reviewed_by")
      .order("created_at", { ascending: false }),
  ]);

  loading.value = false;
  const error = web.error ?? mobile.error;
  if (error) { $q.notify({ type: "negative", message: "Erro ao carregar: " + error.message }); return; }

  const all: Registration[] = [
    ...(web.data ?? []).map((r) => ({ ...r, source: "web" as const })),
    ...(mobile.data ?? []).map((r) => ({
      id: r.id,
      name: r.nome,
      email: `Matrícula ${r.matricula}`,
      user_id: null,
      photo_base64: r.photo_base64,
      status: r.status as Registration["status"],
      created_at: r.created_at,
      reviewed_at: r.reviewed_at,
      reviewed_by: r.reviewed_by,
      source: "mobile" as const,
    })),
  ].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));

  pending.value = all.filter((r) => r.status === "pending");
  history.value = all.filter((r) => r.status !== "pending").slice(0, 20);
}

async function aprovar(r: Registration) {
  actionId.value = r.id + "_a";
  const fn = r.source === "mobile" ? "approve_mobile_face_registration" : "approve_face_registration";
  const { data, error } = await supabase.rpc(fn, { reg_id: r.id });
  actionId.value = null;

  if (error || data?.error) {
    $q.notify({ type: "negative", message: data?.error ?? error?.message ?? "Erro ao aprovar." });
    return;
  }

  $q.notify({ type: "positive", message: `Acesso aprovado para ${r.name}.` });
  await fetchAll();
}

async function rejeitar(r: Registration) {
  actionId.value = r.id + "_r";
  const fn = r.source === "mobile" ? "reject_mobile_face_registration" : "reject_face_registration";
  const { error } = await supabase.rpc(fn, { reg_id: r.id });
  actionId.value = null;

  if (error) { $q.notify({ type: "negative", message: error.message }); return; }

  $q.notify({ type: "warning", message: `Cadastro de ${r.name} rejeitado.` });
  await fetchAll();
}

async function remover(r: Registration) {
  $q.dialog({
    title: "Remover usuário",
    message: `Isso excluirá o acesso de <b>${r.name}</b> (${r.email}) permanentemente.`,
    html: true,
    ok: { label: "Remover", color: "negative", unelevated: true },
    cancel: { label: "Cancelar", flat: true },
  }).onOk(async () => {
    actionId.value = r.id + "_del";
    const fn = r.source === "mobile" ? "remove_mobile_face_registration" : "remove_face_user";
    const { data, error } = await supabase.rpc(fn, { reg_id: r.id });
    actionId.value = null;
    if (error || data?.error) {
      $q.notify({ type: "negative", message: data?.error ?? error?.message ?? "Erro ao remover." });
      return;
    }
    $q.notify({ type: "positive", message: `Usuário ${r.name} removido.` });
    await fetchAll();
  });
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}
</script>

<style scoped lang="scss">
.ap-page {
  padding: 32px 40px;
  max-width: 1100px;
  margin: 0 auto;
}

.ap-topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.ap-eyebrow {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: $primary;
  margin: 0 0 6px;
  opacity: .85;
}

.ap-title {
  font-size: 22px;
  font-weight: 800;
  margin: 0;
  letter-spacing: -.02em;
}

.ap-sep {
  margin-bottom: 32px;
}

.ap-section {
  margin-bottom: 40px;

  &--history {
    margin-top: 8px;
  }
}

.ap-section-label {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: .18em;
  text-transform: uppercase;
  opacity: .4;
  margin: 0 0 16px;
  display: flex;
  align-items: center;
}

// Grid de cards pendentes
.ap-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.ap-card {
  border-radius: 8px;
  overflow: hidden;

  &__photo {
    width: 100%;
    aspect-ratio: 1;
    background: rgba(0,0,0,.08);
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__no-photo {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,.06);
  }

  &__info {
    padding: 12px 14px 8px;
  }

  &__name {
    font-size: 14px;
    font-weight: 700;
    margin: 0 0 4px;
    line-height: 1.2;
  }

  &__email {
    font-size: 11px;
    opacity: .55;
    margin: 0 0 6px;
    word-break: break-all;
  }

  &__date {
    font-size: 10px;
    opacity: .38;
    margin: 0 0 6px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__actions {
    padding: 10px 12px 12px;
    flex-direction: column;
    align-items: stretch;
  }
}

// Histórico
.ap-hist-item { padding: 10px 16px; }
.ap-hist-avatar { border-radius: 4px; overflow: hidden; }
.ap-hist-name  { font-size: 13px; font-weight: 600; }
.ap-hist-email { font-size: 11px; }
.ap-hist-side  { align-items: flex-end; min-width: 110px; }

// Estado vazio
.ap-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 64px 0;
  opacity: .5;

  p { font-size: 14px; margin: 0; }
}

// Mobile
@media (max-width: 600px) {
  .ap-page { padding: 24px 16px; }
  .ap-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
}
</style>
