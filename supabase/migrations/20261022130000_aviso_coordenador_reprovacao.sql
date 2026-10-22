-- Aviso ao coordenador quando um checklist é reprovado na validação.
-- coordenadores_contato: telefone (WhatsApp) de cada coordenador, pelo mesmo nome usado em employees/pwa_equipes.
-- avisos_reprovacao: registro de quem foi avisado, para não perder nenhuma reprovação e mostrar "coordenador avisado".
-- Só usuários logados no painel enxergam e alteram os telefones (anon não tem acesso).

create table if not exists public.coordenadores_contato (
  nome text primary key,
  telefone text not null default '',          -- somente dígitos, com DDI (ex.: 5599984698713)
  ativo boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.coordenadores_contato enable row level security;

drop policy if exists coordenadores_contato_select on public.coordenadores_contato;
create policy coordenadores_contato_select on public.coordenadores_contato for select to authenticated using (true);
drop policy if exists coordenadores_contato_insert on public.coordenadores_contato;
create policy coordenadores_contato_insert on public.coordenadores_contato for insert to authenticated with check (true);
drop policy if exists coordenadores_contato_update on public.coordenadores_contato;
create policy coordenadores_contato_update on public.coordenadores_contato for update to authenticated using (true) with check (true);

insert into public.coordenadores_contato (nome, telefone) values
  ('Antonio M', '5599984698713'),
  ('Luis C.',   '5599981304015'),
  ('Afonso',    '5599984067733'),
  ('Marcos',    '5599991017813'),
  ('Daniel',    '5591993403983'),
  ('Rafaela',   '5599984051548'),
  ('Paulo',     '5599981683167'),
  ('Jackson',   '5599991038593'),
  ('Thiago F.', '5562993907975')
on conflict (nome) do update set telefone = excluded.telefone, updated_at = now();

create table if not exists public.avisos_reprovacao (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.checklist_submissions(id) on delete cascade,
  coordenador text not null,
  canal text not null default 'whatsapp',
  enviado_por text,
  created_at timestamptz not null default now()
);

create index if not exists avisos_reprovacao_submission_idx on public.avisos_reprovacao (submission_id);

alter table public.avisos_reprovacao enable row level security;

drop policy if exists avisos_reprovacao_select on public.avisos_reprovacao;
create policy avisos_reprovacao_select on public.avisos_reprovacao for select to authenticated using (true);
drop policy if exists avisos_reprovacao_insert on public.avisos_reprovacao;
create policy avisos_reprovacao_insert on public.avisos_reprovacao for insert to authenticated with check (true);
