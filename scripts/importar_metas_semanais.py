"""Gera o SQL que carrega a planilha "Metas POC" (a tabela de metas semanais que alimenta o BI) em public.metas_semanais.

Cada linha da planilha é uma pessoa em uma semana de um mês: realizado, meta e "Real" (realizado limitado à meta).
O SQL é reexecutável: antes de inserir, apaga as linhas da mesma aba/ano/mês, então dá para rodar de novo com o
arquivo atualizado (meses novos entram; meses já carregados são substituídos).

Uso:
  python importar_metas_semanais.py --arquivo "C:\\...\\Metas POC - 24 a 26.xlsx" --saida-dir ..\\supabase\\migrations --prefixo 20261020100100
    -> um arquivo .sql por ano (migrações do Supabase, aplicadas com `npx supabase db push`)
  python importar_metas_semanais.py --arquivo novo.xlsx --saida metas_novo.sql
    -> um único .sql (aplicar com `npx supabase db query --linked -f metas_novo.sql`)
"""
import argparse
import os

import pandas as pd

ABAS = {"operacional": "Operacional", "administrativo": "Administrativo", "admistrativo": "Administrativo"}
COLUNAS_SQL = "aba, ano, mes, semana, matricula, nome, funcao, base, gerencia, gerente, processo, realizado, meta, real"


def sql_txt(v):
    if v is None or (isinstance(v, float) and pd.isna(v)) or str(v).strip() == "":
        return "null"
    return "'" + str(v).strip().replace("'", "''") + "'"


def sql_int(v):
    return str(int(float(v)))


def ler(arquivo):
    x = pd.ExcelFile(arquivo)
    quadros = []
    for aba_xl in x.sheet_names:
        chave = aba_xl.lower().split()[0]
        if chave not in ABAS:
            print(f"(ignorada) aba {aba_xl!r}")
            continue
        df = pd.read_excel(arquivo, sheet_name=aba_xl, dtype={"Chapa": str})
        df.columns = [str(c).strip() for c in df.columns]
        # 2024 traz "Coordenador" na mesma posição em que 2025/2026 trazem "Gerente"
        df = df.rename(columns={"Coordenador": "Gerente"})
        df["aba"] = ABAS[chave]
        quadros.append(df)
    d = pd.concat(quadros, ignore_index=True)
    d["Mês"] = pd.to_datetime(d["Mês"])
    d["ano"] = d["Mês"].dt.year
    d["mes"] = d["Mês"].dt.month
    d["semana"] = d["Semana"].astype(str).str.strip().str[0].astype(int)
    d["Chapa"] = d["Chapa"].astype(str).str.strip().str.replace(r"\.0$", "", regex=True)
    return d


def gerar_sql(d):
    """SQL de um conjunto de linhas: apaga as abas/meses presentes e insere tudo de novo."""
    partes = ["-- Metas semanais (planilha Metas POC): realizado, meta e real por pessoa, mês e semana."]
    for (aba, ano, mes) in sorted(d[["aba", "ano", "mes"]].drop_duplicates().itertuples(index=False, name=None)):
        partes.append(f"delete from public.metas_semanais where aba = '{aba}' and ano = {ano} and mes = {mes};")
    linhas = []
    for r in d.itertuples(index=False):
        linhas.append(
            "({aba}, {ano}, {mes}, {sem}, {mat}, {nome}, {fun}, {base}, {ger}, {gte}, {proc}, {rea}, {meta}, {real})".format(
                aba=sql_txt(r.aba), ano=sql_int(r.ano), mes=sql_int(r.mes), sem=sql_int(r.semana), mat=sql_txt(r.Chapa),
                nome=sql_txt(r.Observador), fun=sql_txt(getattr(r, "Função")), base=sql_txt(r.Base),
                ger=sql_txt(getattr(r, "Gerência")), gte=sql_txt(r.Gerente), proc=sql_txt(r.Processo),
                rea=sql_int(r.Realizado), meta=sql_int(r.Meta), real=sql_int(r.Real),
            )
        )
    for i in range(0, len(linhas), 500):
        partes.append(f"insert into public.metas_semanais ({COLUNAS_SQL}) values\n" + ",\n".join(linhas[i:i + 500]) + ";")
    return "\n".join(partes) + "\n"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--arquivo", required=True)
    ap.add_argument("--saida", help="um único arquivo .sql")
    ap.add_argument("--saida-dir", help="pasta de migrações: gera um arquivo por ano")
    ap.add_argument("--prefixo", default="20261020100100", help="timestamp inicial das migrações (aumenta 1 por arquivo)")
    args = ap.parse_args()

    d = ler(args.arquivo)
    print(f"{len(d)} linhas | {d.aba.value_counts().to_dict()} | {d['Mês'].min().date()} a {d['Mês'].max().date()}")
    if args.saida:
        with open(args.saida, "w", encoding="utf-8", newline="\n") as f:
            f.write(gerar_sql(d))
        print("gerado:", args.saida)
        return
    if not args.saida_dir:
        raise SystemExit("informe --saida ou --saida-dir")
    ts = int(args.prefixo)
    for ano in sorted(d.ano.unique()):
        caminho = os.path.join(args.saida_dir, f"{ts}_metas_semanais_dados_{ano}.sql")
        with open(caminho, "w", encoding="utf-8", newline="\n") as f:
            f.write(gerar_sql(d[d.ano == ano]))
        print("gerado:", caminho, f"({os.path.getsize(caminho) // 1024} KB)")
        ts += 1


if __name__ == "__main__":
    main()
