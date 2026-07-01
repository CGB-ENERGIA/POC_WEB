-- POC CGB: dados escritos (checklists, observações, colaboradores)
-- Imagens ficam no Cloudflare R2; aqui guardamos apenas r2_key.

create extension if not exists "pgcrypto";

create table if not exists public.employees (
  matricula text primary key,
  nome text not null,
  nome_completo text not null,
  gerencia text not null,
  base text not null,
  funcao text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checklist_submissions (
  id uuid primary key default gen_random_uuid(),
  matricula text not null references public.employees (matricula),
  observador text not null,
  auditagem text not null check (auditagem in ('GOMAN', 'GSTC')),
  data timestamptz not null,
  base text not null,
  equipe text not null,
  membros jsonb not null default '[]'::jsonb,
  resumo jsonb not null default '{}'::jsonb,
  client_id uuid,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_checklist_submissions_matricula
  on public.checklist_submissions (matricula);

create index if not exists idx_checklist_submissions_data
  on public.checklist_submissions (data desc);

create unique index if not exists idx_checklist_submissions_client_id
  on public.checklist_submissions (client_id)
  where client_id is not null;

create table if not exists public.checklist_responses (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.checklist_submissions (id) on delete cascade,
  pergunta_id text not null,
  categoria text not null,
  pergunta text not null,
  gravidade text not null,
  peso integer not null,
  resposta text not null check (resposta in ('conforme', 'nao_conforme')),
  observacao text,
  foto_r2_key text,
  created_at timestamptz not null default now(),
  unique (submission_id, pergunta_id)
);

create table if not exists public.checklist_photos (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.checklist_submissions (id) on delete cascade,
  tipo text not null check (tipo in ('local', 'nc')),
  pergunta_id text,
  r2_key text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_checklist_photos_submission
  on public.checklist_photos (submission_id);

create table if not exists public.observacoes_livres (
  id uuid primary key default gen_random_uuid(),
  matricula text not null references public.employees (matricula),
  observador text not null,
  auditagem text not null,
  data timestamptz not null,
  base text not null,
  equipe text not null,
  categoria text not null,
  item text not null,
  tipo text not null check (tipo in ('conforme', 'inconforme', 'feedback')),
  severidade text not null,
  descricao text not null,
  resolvido boolean not null default false,
  client_id uuid,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_observacoes_livres_client_id
  on public.observacoes_livres (client_id)
  where client_id is not null;

-- RLS (políticas temporárias para POC — substituir por Auth + claims de matrícula)
alter table public.employees enable row level security;
alter table public.checklist_submissions enable row level security;
alter table public.checklist_responses enable row level security;
alter table public.checklist_photos enable row level security;
alter table public.observacoes_livres enable row level security;

create policy employees_read_anon
  on public.employees for select to anon, authenticated
  using (ativo = true);

create policy checklist_submissions_read_anon
  on public.checklist_submissions for select to anon, authenticated
  using (true);

create policy checklist_submissions_insert_anon
  on public.checklist_submissions for insert to anon, authenticated
  with check (true);

create policy checklist_responses_read_anon
  on public.checklist_responses for select to anon, authenticated
  using (true);

create policy checklist_responses_insert_anon
  on public.checklist_responses for insert to anon, authenticated
  with check (true);

create policy checklist_photos_read_anon
  on public.checklist_photos for select to anon, authenticated
  using (true);

create policy checklist_photos_insert_anon
  on public.checklist_photos for insert to anon, authenticated
  with check (true);

create policy observacoes_livres_read_anon
  on public.observacoes_livres for select to anon, authenticated
  using (true);

create policy observacoes_livres_insert_anon
  on public.observacoes_livres for insert to anon, authenticated
  with check (true);

create policy observacoes_livres_update_anon
  on public.observacoes_livres for update to anon, authenticated
  using (true)
  with check (true);
