"""Alinha a semana dos checklists históricos com a exportação do BI (Resumo.xlsx: um item por linha, coluna "Semana").

O BI nem sempre coloca o checklist na semana que o sistema calcula pela data (a planilha tem a semana informada na origem).
Para os meses informados, este script:
  1. confere se os itens (conforme / não conforme) do BI e do banco são idênticos no mês; se não forem, o mês é recusado
     (a exportação do BI corta em 150 mil linhas: mês incompleto não pode ser casado);
  2. casa cada checklist do BI com o do banco por (mês, equipe, observador, tipo, nº de conformes, nº de não conformes),
     na ordem das datas; grupos com quantidade diferente nos dois lados não são casados (ficam de fora e são listados);
  3. gera uma migração que grava resumo.semanaManual só nos checklists cuja semana do BI difere da semana pela data.

Uso: python ajustar_semana_bi.py --resumo C:\\...\\Resumo.xlsx --meses 2024-07,2024-08,2024-09 --saida ..\\supabase\\migrations\\<ts>_semana_bi_2024.sql
Requer o Supabase CLI ligado ao projeto (npx supabase db query --linked).
"""
import argparse
import collections
import json
import os
import subprocess
import sys
import time
import warnings

warnings.filterwarnings("ignore")
import pandas as pd

RAIZ = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
FIMS_PADRAO = (8, 15, 22)


def consulta(sql):
    caminho = os.path.join(os.environ.get("TEMP", "."), "ajustar_semana_bi.sql")
    with open(caminho, "w", encoding="utf-8") as f:
        f.write(sql)
    for tentativa in range(4):
        r = subprocess.run(["npx", "supabase", "db", "query", "--linked", "-f", caminho, "-o", "json"], cwd=RAIZ,
                           capture_output=True, text=True, encoding="utf-8", shell=(os.name == "nt"))
        t = r.stdout
        try:
            return json.loads(t[t.index("{"):t.rindex("}") + 1])["rows"]
        except (ValueError, KeyError):
            time.sleep(5 * (tentativa + 1))
    raise SystemExit(f"consulta falhou:\n{r.stdout}\n{r.stderr}")


def ler_bi(caminhos):
    partes = []
    for c in caminhos:
        df = pd.read_excel(c, sheet_name=0)
        df.columns = ["ano", "mes", "semana", "base", "equipe", "gerencia", "indice", "observador", "categoria", "pergunta", "status"]
        partes.append(df)
    df = pd.concat(partes, ignore_index=True)
    df = df[df["status"].isin(["Conforme", "Não Conforme"])].copy()  # descarta as linhas de aviso do fim do arquivo
    df["ano"] = df["ano"].astype(int)
    df["m"] = pd.to_datetime(df["mes"]).dt.month
    df["sem"] = df["semana"].str[0].astype(int)
    df["conf"] = (df["status"] == "Conforme").astype(int)
    df["nc"] = 1 - df["conf"]
    df["tipo"] = df["gerencia"].replace({"GERE": "GSTC", "LOGÍSTICA": "LOGISTICA"})
    df["equipe_k"] = df["equipe"].astype(str).str.strip().str.lower()
    return df


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--resumo", required=True, nargs="+")
    ap.add_argument("--meses", required=True, help="AAAA-MM separados por vírgula (só meses completos na exportação)")
    ap.add_argument("--saida", required=True)
    args = ap.parse_args()

    meses = [tuple(int(x) for x in m.split("-")) for m in args.meses.split(",")]
    bi = ler_bi(args.resumo)
    cfg = {(r["ano"], r["mes"]): (r["fim_s1"], r["fim_s2"], r["fim_s3"])
           for r in consulta("select ano, mes, fim_s1, fim_s2, fim_s3 from public.semanas_config;")}

    linhas, resumo_geral = [], []
    for ano, mes in meses:
        b = bi[(bi.ano == ano) & (bi.m == mes)]
        if b.empty:
            print(f"{ano}-{mes:02d}: sem linhas no BI, ignorado")
            continue
        ini = f"{ano}-{mes:02d}-01"
        fim = f"{ano + (mes == 12)}-{(mes % 12) + 1:02d}-01"
        db = pd.DataFrame(consulta(f"""
            select s.id::text as id, to_char(s.data at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS') as quando, s.auditagem as tipo,
                   s.equipe, s.observador, (s.resumo ? 'legado') as legado,
                   sum(case when r.pergunta_id in ('goman-012','gstc-021') then (select count(*) from jsonb_array_elements(r.itens) e where (e ->> 'conforme')::boolean) else (r.resposta = 'conforme')::int end)::int as conf,
                   sum(case when r.pergunta_id in ('goman-012','gstc-021') then (select count(*) from jsonb_array_elements(r.itens) e where not (e ->> 'conforme')::boolean) else (r.resposta = 'nao_conforme')::int end)::int as nc
            from public.checklist_submissions s join public.checklist_responses r on r.submission_id = s.id
            where s.data >= '{ini}' and s.data < '{fim}' and s.status = 'aprovado'
            group by s.id, s.data, s.auditagem, s.equipe, s.observador, s.resumo ? 'legado'
            order by s.data, s.id;"""))
        # 1) os itens do mês precisam ser idênticos
        if (int(b.conf.sum()), int(b.nc.sum())) != (int(db.conf.sum()), int(db.nc.sum())):
            print(f"{ano}-{mes:02d}: RECUSADO — itens diferentes (BI {int(b.conf.sum())}/{int(b.nc.sum())} x banco {int(db.conf.sum())}/{int(db.nc.sum())}); "
                  "exportação incompleta ou dados divergentes")
            continue
        fims = cfg.get((ano, mes), FIMS_PADRAO)
        db["d"] = db["quando"].str[8:10].astype(int)
        db["sem_data"] = db["d"].map(lambda d: 1 if d <= fims[0] else 2 if d <= fims[1] else 3 if d <= fims[2] else 4)
        db["equipe_k"] = db["equipe"].astype(str).str.strip().str.lower()
        # 2) um registro por checklist do BI
        g = b.groupby(["equipe_k", "observador", "tipo", "indice"]).agg(conf=("conf", "sum"), nc=("nc", "sum"), sem=("sem", "first"), n_sem=("sem", "nunique")).reset_index()
        if (g.n_sem > 1).any():
            print(f"{ano}-{mes:02d}: AVISO — {(g.n_sem > 1).sum()} checklists do BI com mais de uma semana")
        chave = ["equipe_k", "observador", "tipo", "conf", "nc"]
        g = g.sort_values(chave + ["sem"])
        db = db.sort_values(chave + ["quando", "id"])
        casados = diferentes = sem_par = 0
        for k, gb in g.groupby(chave):
            gd = db[(db.equipe_k == k[0]) & (db.observador == k[1]) & (db.tipo == k[2]) & (db.conf == k[3]) & (db.nc == k[4])]
            if len(gb) != len(gd):
                sem_par += len(gb)
                resumo_geral.append(f"{ano}-{mes:02d} sem par: {k} BI={len(gb)} banco={len(gd)}")
                continue
            for (_, rb), (_, rd) in zip(gb.iterrows(), gd.iterrows()):
                casados += 1
                if int(rb["sem"]) != int(rd["sem_data"]):
                    diferentes += 1
                    linhas.append((rd["id"], int(rb["sem"]), ano, mes, rd["quando"][:10], int(rd["sem_data"])))
        print(f"{ano}-{mes:02d}: itens idênticos | checklists BI {len(g)}, banco {len(db)} | casados {casados} | sem par {sem_par} | semana diferente {diferentes}")

    with open(args.saida, "w", encoding="utf-8", newline="\n") as f:
        f.write("-- Semana dos checklists históricos conforme o BI (Resumo.xlsx). Só os que diferem da semana calculada pela data.\n"
                "-- Para desfazer: update public.checklist_submissions set resumo = resumo - 'semanaManual' where resumo ? 'legado';\n")
        for i in range(0, len(linhas), 300):
            lote = ",\n".join(f"('{x[0]}', {x[1]})" for x in linhas[i:i + 300])
            f.write("update public.checklist_submissions s\n"
                    "set resumo = s.resumo || jsonb_build_object('semanaManual', v.sem)\n"
                    f"from (values\n{lote}\n) as v(id, sem)\n"
                    "where s.id = v.id::uuid and s.resumo ? 'legado';\n")
    por_mudanca = collections.Counter((x[5], x[1]) for x in linhas)
    print(f"\n{len(linhas)} checklists mudam de semana -> {args.saida}")
    print("(semana pela data -> semana do BI):", {f"{a}->{b}": n for (a, b), n in sorted(por_mudanca.items())})
    for r in resumo_geral[:20]:
        print("  ", r)
    if len(resumo_geral) > 20:
        print(f"   ... e mais {len(resumo_geral) - 20} grupos sem par")


if __name__ == "__main__":
    main()
