insert into public.employees (matricula, nome, nome_completo, gerencia, base, funcao)
values ('12690', 'Italo B.', 'Italo Bruno da Silva Fontes', 'GOMAN', 'BCB', 'Analista de Desempenho')
on conflict (matricula) do nothing;
