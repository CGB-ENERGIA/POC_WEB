"""Conferência de integridade dos dados do POC. Rode depois de qualquer importação ou leitura em lote e leia o relatório.

Verifica, direto no banco (usa o Supabase CLI ligado ao projeto: `npx supabase db query --linked`):
  1. Respostas faltando: checklists com menos respostas do que o resumo (ou o questionário) indica.
  2. Resumo diferente das respostas: total/conformes/não conformes do resumo não batem com as respostas gravadas.
  3. Cópia de "Minhas Observações" (user_observations) diferente do checklist oficial.
  4. Fotos de evidência faltando.
  5. Data da foto (resumo.dataFoto): cobertura nos checklists enviados pelo app, para não esquecer nenhum sem leitura.
  6. Metas semanais: meses sem linhas ou com meta zerada para todos.

Sai com código 1 se achar qualquer problema (serve para automatizar). Uso: python conferir_dados.py [--desde 2026-10-01]
"""
import argparse
import json
import os
import subprocess
import sys
import time

RAIZ = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))


def consulta(sql):
    caminho = os.path.join(os.environ.get("TEMP", "."), "conferir_dados.sql")
    with open(caminho, "w", encoding="utf-8") as f:
        f.write(sql)
    for tentativa in range(4):  # a conexão com o Supabase às vezes expira: tenta de novo antes de desistir
        r = subprocess.run(["npx", "supabase", "db", "query", "--linked", "-f", caminho, "-o", "json"], cwd=RAIZ,
                           capture_output=True, text=True, encoding="utf-8", shell=(os.name == "nt"))
        t = r.stdout
        try:
            return json.loads(t[t.index("{"):t.rindex("}") + 1])["rows"]
        except (ValueError, KeyError):
            time.sleep(5 * (tentativa + 1))
    raise SystemExit(f"consulta falhou:\n{r.stdout}\n{r.stderr}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--desde", default="2026-01-01", help="data mínima dos checklists (AAAA-MM-DD)")
    args = ap.parse_args()
    d = args.desde
    problemas = 0

    def relatorio(titulo, linhas, mostrar=10):
        nonlocal problemas
        if not linhas:
            print(f"OK   {titulo}")
            return
        problemas += 1
        print(f"FALHA {titulo}: {len(linhas)}")
        for l in linhas[:mostrar]:
            print("      ", {k: (str(v)[:60]) for k, v in l.items()})
        if len(linhas) > mostrar:
            print(f"       ... e mais {len(linhas) - mostrar}")

    # 1 e 2: respostas x resumo
    linhas = consulta(f"""
        select s.id::text as id, s.equipe, s.auditagem, to_char(s.data,'YYYY-MM-DD HH24:MI') as data,
               (s.resumo->>'total')::int as resumo_total, count(r.*)::int as respostas,
               (s.resumo->>'naoConformes')::int as resumo_nc, count(*) filter (where r.resposta='nao_conforme')::int as nc
        from public.checklist_submissions s left join public.checklist_responses r on r.submission_id = s.id
        where s.data >= '{d}'
        group by s.id having (s.resumo->>'total')::int <> count(r.*)
           or (s.resumo->>'naoConformes')::int <> count(*) filter (where r.resposta='nao_conforme')
        order by s.data desc;""")
    relatorio("Resumo do checklist bate com as respostas gravadas (total e não conformes)", linhas)

    # 1b: totais fora do padrão do tipo de checklist (ex.: 30 respostas num checklist de 55)
    linhas = consulta(f"""
        with t as (select auditagem, (resumo->>'total')::int as total, count(*) as n from public.checklist_submissions where data >= '{d}' group by 1,2),
        m as (select auditagem, total as padrao from (select *, row_number() over (partition by auditagem order by n desc) rn from t) x where rn=1)
        select s.id::text as id, s.equipe, s.auditagem, to_char(s.data,'YYYY-MM-DD HH24:MI') as data, (s.resumo->>'total')::int as total, m.padrao
        from public.checklist_submissions s join m using (auditagem)
        where s.data >= '{d}' and (s.resumo->>'total')::int < m.padrao * 0.7 order by s.data desc;""")
    relatorio("Checklists com muito menos respostas que o padrão do tipo (possível importação incompleta)", linhas)

    # 3: copias de Minhas Observacoes
    linhas = consulta(f"""
        select u.id::text as id, u.equipe as copia_equipe, s.equipe as oficial_equipe, to_char(u.data,'DD/MM HH24:MI') as copia_data, to_char(s.data,'DD/MM HH24:MI') as oficial_data
        from public.user_observations u join public.checklist_submissions s on s.client_id = u.id
        where u.sync_status <> 'em_andamento' and s.data >= '{d}'
          and (u.equipe is distinct from s.equipe or u.data is distinct from s.data or (u.resumo->>'naoConformes') is distinct from (s.resumo->>'naoConformes'));""")
    relatorio("Cópias de 'Minhas Observações' iguais ao checklist oficial", linhas)

    # 4: fotos de evidencia
    linhas = consulta(f"""
        select s.id::text as id, s.equipe, s.auditagem, to_char(s.data,'YYYY-MM-DD HH24:MI') as data, count(p.*)::int as fotos
        from public.checklist_submissions s left join public.checklist_photos p on p.submission_id = s.id and p.tipo = 'local'
        where s.data >= '{d}' and s.status <> 'reprovado' and not (s.resumo ? 'legado') and s.auditagem in ('GOMAN','GSTC')
        group by s.id having count(p.*) < 3 order by s.data desc;""")
    relatorio("Checklists GOMAN/GSTC enviados pelo app com as 3 fotos de evidência", linhas)

    # 5: cobertura da data da foto
    linhas = consulta(f"""
        select count(*)::int as sem_data_foto, min(to_char(data,'YYYY-MM-DD')) as desde
        from public.checklist_submissions where data >= '{d}' and not (resumo ? 'legado') and not (resumo ? 'dataFoto')
          and exists (select 1 from public.checklist_photos p where p.submission_id = checklist_submissions.id and p.tipo = 'local');""")
    n = linhas[0]["sem_data_foto"] if linhas else 0
    print(f"INFO Checklists do app sem data da foto gravada: {n} (rode ler_data_fotos.py + aplicar_data_fotos.py; os enviados pelo app atualizado já gravam sozinhos)")

    # 6: metas semanais
    linhas = consulta("""
        select ano, mes, aba, count(*)::int as linhas, sum(meta)::int as meta_total from public.metas_semanais group by 1,2,3 having sum(meta) = 0 or count(*) < 20 and aba = 'Operacional' order by 1,2;""")
    relatorio("Metas semanais: nenhum mês Operacional vazio ou com meta zerada", linhas)

    print("\nResultado:", "TUDO OK" if problemas == 0 else f"{problemas} verificação(ões) com problema")
    sys.exit(1 if problemas else 0)


if __name__ == "__main__":
    main()
