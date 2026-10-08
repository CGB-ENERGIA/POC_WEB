-- Outubro/2026: semana 1 = 01–11, semana 2 = 12–18, semana 3 = 19–25, semana 4 = 26–31.
insert into public.semanas_config (ano, mes, fim_s1, fim_s2, fim_s3)
values (2026, 10, 11, 18, 25)
on conflict (ano, mes) do nothing;
