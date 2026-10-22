"""Gera o SQL que grava resumo.dataFoto nos checklists, a partir do resultado de ler_data_fotos.py.

Só entram checklists cuja foto mais antiga é pelo menos 10 minutos anterior ao envio e do mesmo mês (UTC) do envio.

Uso: python aplicar_data_fotos.py --resultado datas_fotos.json --saida ..\\supabase\\migrations\\<timestamp>_checklists_data_foto.sql
"""
import argparse
import datetime as dt
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import exportar_mes as em  # noqa: E402
import importar_historico as h  # noqa: E402


def parse(s):
    return dt.datetime.fromisoformat(s.replace("Z", "+00:00")).replace(tzinfo=None)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--resultado", required=True)
    ap.add_argument("--saida", required=True)
    args = ap.parse_args()

    lidas = {k: v for k, v in json.load(open(args.resultado, encoding="utf-8")).items() if v and not str(v).startswith("erro")}
    key = h.chave_env()
    subs = em.em_lotes("checklist_submissions", key, "id", list(lidas), "id,data")
    linhas = []
    for s in subs:
        envio, foto = parse(s["data"]), parse(lidas[s["id"]])
        if envio - foto >= dt.timedelta(minutes=10) and (envio.year, envio.month) == (foto.year, foto.month):
            linhas.append(f"('{s['id']}', '{lidas[s['id']]}')")
    with open(args.saida, "w", encoding="utf-8", newline="\n") as f:
        f.write("-- Data da inspeção (foto mais antiga) lida do carimbo das fotos: define a semana do checklist no painel.\n")
        for i in range(0, len(linhas), 400):
            f.write(
                "update public.checklist_submissions s\n"
                "set resumo = s.resumo || jsonb_build_object('dataFoto', v.d)\n"
                "from (values\n" + ",\n".join(linhas[i:i + 400]) + "\n) as v(id, d)\n"
                "where s.id = v.id::uuid and not (s.resumo ? 'dataFoto');\n"
            )
    print(f"{len(linhas)} checklists com data da foto anterior ao envio -> {args.saida}")


if __name__ == "__main__":
    main()
