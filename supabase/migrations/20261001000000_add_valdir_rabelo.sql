-- Adicionar Valdir Rabelo Junior que estava ausente do roster inicial.
insert into public.employees (matricula, nome, nome_completo, gerencia, base, funcao)
values ('19873', 'Valdir R.', 'Valdir Rabelo Junior', 'GOMAN', 'BCB', 'Coordenador Operacional Trainee')
on conflict (matricula) do update set
  nome          = excluded.nome,
  nome_completo = excluded.nome_completo,
  gerencia      = excluded.gerencia,
  base          = excluded.base,
  funcao        = excluded.funcao,
  ativo         = true;
