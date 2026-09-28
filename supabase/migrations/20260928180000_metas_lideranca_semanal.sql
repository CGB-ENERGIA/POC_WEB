alter table public.metas
  add column if not exists lideranca_semanal integer not null default 4;
