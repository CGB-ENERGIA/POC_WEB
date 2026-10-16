-- Observadores da base histórica jan-jun/2026 (POC - Jan a jul 2026.xlsx) ainda sem cadastro.
-- Entram INATIVOS; quem já existe (ativo ou inativo) é ignorado.
insert into public.employees (matricula, nome, nome_completo, gerencia, base, funcao, ativo, coordenador)
values
  ('12507', 'Neto', 'Neto', 'GOMAN', 'BCB', 'Observador (histórico)', false, 'Luis C.'),
  ('12556', 'Bruno N.', 'Bruno N.', 'GSTC', 'BCB', 'Observador (histórico)', false, 'Afonso'),
  ('12562', 'Francisco W.', 'FRANCISCO WILLIAN MIRANDA DE ASSIS', 'GERE', 'BCB', 'Observador (histórico)', false, 'Antonio M'),
  ('12732', 'Luiz A.', 'LUIZ AUGUSTO ARAUJO JUNIOR', 'GSTC', 'ITM', 'Observador (histórico)', false, 'Afonso'),
  ('12769', 'Silvano J.', 'SILVANO JOSE DOS PRAZERES', 'GOMAN', 'ITM', 'Observador (histórico)', false, 'Luis C.'),
  ('12915', 'Ronaldo S.', 'RONALDO DOS SANTOS SAMPAIO', 'GOMAN', 'BCB', 'Observador (histórico)', false, 'Luis C.'),
  ('13032', 'Arlison', 'Arlison', 'GSTC', 'STI', 'Observador (histórico)', false, 'Afonso'),
  ('13049', 'Luciano L.', 'LUCIANO JOSE MARQUES DE LEMOS JUNIOR', 'GOMAN', 'STI', 'Observador (histórico)', false, 'Luis C.'),
  ('13136', 'Emanuel', 'Emanuel', 'GSTC', 'STI', 'Observador (histórico)', false, 'Afonso'),
  ('13669', 'Daniel Silva', 'Daniel Silva', 'GSTC', 'BCB', 'Observador (histórico)', false, 'Valvick'),
  ('13750', 'Geraldo M.', 'GERALDO MOREIRA RODRIGUES', 'GOMAN', 'BDC', 'Observador (histórico)', false, 'Rafaela'),
  ('14042', 'Edivan Jr.', 'Edivan Jr.', 'GERE', 'PDT', 'Observador (histórico)', false, 'Antonio M'),
  ('15559', 'Ricardo', 'Ricardo', 'GOMAN', 'BCB', 'Observador (histórico)', false, 'Luis C.'),
  ('16677', 'Fabio L.', 'Fabio L.', 'GSTC', 'PDT', 'Observador (histórico)', false, 'Paulo'),
  ('18196', 'Leiziane', 'Leiziane', 'GSTC', 'BCB', 'Observador (histórico)', false, 'Daniel'),
  ('20270', 'Joise', 'Joise', 'GSTC', 'STI', 'Observador (histórico)', false, 'Daniel'),
  ('21574', 'Normam', 'Normam', 'GSTC', 'BCB', 'Observador (histórico)', false, 'Daniel'),
  ('22025', 'Julio', 'Julio', 'GERE', 'BCB', 'Observador (histórico)', false, 'Antonio M'),
  ('22315', 'Luiz F.', 'Luiz F.', 'GOMAN', 'PDT', 'Observador (histórico)', false, 'Rafaela'),
  ('22511', 'Wemesson', 'Wemesson', 'GSTC', 'PDT', 'Observador (histórico)', false, 'Paulo'),
  ('23742', 'Leandro', 'Leandro', 'GSTC', 'BCB', 'Observador (histórico)', false, 'Daniel')
on conflict (matricula) do nothing;
