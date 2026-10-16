"""Importa a base histórica (Base POC 4.0.xlsx) para checklist_submissions / checklist_responses.

Padrão: dry-run (não grava nada). Use --apply para gravar.
Idempotente: cada checklist recebe client_id determinístico (uuid5) e linhas já existentes são puladas.
"""
import argparse
import collections
import datetime as dt
import json
import re
import sys
import unicodedata
import uuid
import difflib
import urllib.error
import urllib.parse
import urllib.request

import pandas as pd

XLSX = r"C:\Users\Italo\Downloads\Base POC 4.0.xlsx"
CATALOG_DIR = r"C:\POC\POC_Mobile\src\data"
ENV_FILE = r"C:\POC\POC_OP\.env"
SUPABASE_URL = "https://uqjabgsxzeekxznybhns.supabase.co/rest/v1"
NS = uuid.UUID("6f1d2c3a-0000-4000-8000-00000000cafe")
# Horário de parede da planilha gravado como UTC: o painel conta mês/dia/semana pela data UTC gravada.
OFFSET = "+00:00"
ROUO_ITENS = ["Desligar", "Bloquear", "Sinalizar", "Testar", "Aterrar", "Proteger"]
MOJIBAKE_CONFORME = "N\ufffdo Conforme"

SHEET_TIPO = {
    ("Operacional", "GOMAN"): ("goman", "GOMAN"),
    ("Operacional", "GSTC"): ("gstc", "GSTC"),
    ("Operacional", "GERE"): ("gstc", "GSTC"),
    ("Administrativo", "LOG\u00cdSTICA"): ("logistica", "LOGISTICA"),
    ("Administrativo", "OFICINA"): ("oficina", "OFICINA"),
    ("Administrativo", "ADMINISTRATIVO"): ("administrativo", "ADMINISTRATIVO"),
    ("Administrativo", "ALOJAMENTO"): ("alojamento", "ALOJAMENTO"),
}


def norm(s):
    s = str(s).replace("\ufffd", "")
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"\d+$", "", s.strip())
    return re.sub(r"\s+", " ", s).strip().lower().rstrip("?").strip()


def carregar_catalogos():
    label_re = re.compile(r'(?:"label"|label):\s*"([^"]+)"')
    perg_re = re.compile(
        r'(?:"id"|id):\s*"([^"]+)",\s*(?:"texto"|texto):\s*"(.*?)",\s*(?:"peso"|peso):\s*(\d+),\s*(?:"gravidade"|gravidade):\s*"([^"]+)"'
    )
    out = {}
    for nome in ["goman", "gstc", "logistica", "oficina", "administrativo", "alojamento"]:
        txt = open(f"{CATALOG_DIR}\\{nome}-checklist.ts", encoding="utf-8").read()
        eventos = [(m.start(), "cat", m.group(1)) for m in label_re.finditer(txt)]
        eventos += [(m.start(), "perg", m) for m in perg_re.finditer(txt)]
        eventos.sort(key=lambda e: e[0])
        cat, perguntas = None, []
        for _, tipo, v in eventos:
            if tipo == "cat":
                cat = v
            else:
                perguntas.append({"categoria": cat, "id": v.group(1), "texto": v.group(2),
                                  "peso": int(v.group(3)), "gravidade": v.group(4)})
        out[nome] = perguntas
    return out


def mapa_colunas(tipo, df, catalogos):
    perguntas = catalogos[tipo]
    por_chave = {norm(p["texto"]): p for p in perguntas}
    rouo = next((p for p in perguntas if "regras de ouro" in norm(p["texto"])), None)
    mapa = {}
    for i, c in enumerate(df.columns):
        vals = set(df.iloc[:, i].dropna().astype(str).unique())
        if not (vals & {"Conforme", MOJIBAKE_CONFORME, "Não Conforme"}):
            continue
        if norm(c).startswith("cumpriu a etapa da regra de ouro"):
            if rouo is None:
                continue
            item = next(n for n, it in enumerate(ROUO_ITENS) if it.lower() in str(c).lower())
            mapa[i] = ("ROUO", rouo, item)
            continue
        k = norm(c)
        if k in por_chave:
            mapa[i] = ("Q", por_chave[k], None)
            continue
        cand = difflib.get_close_matches(k, list(por_chave), n=1, cutoff=0.8)
        if cand:
            mapa[i] = ("Q", por_chave[cand[0]], None)
    return mapa


def col_idx(df, nome):
    alvo = norm(nome)
    return next((i for i, c in enumerate(df.columns) if norm(c) == alvo or norm(c).startswith(alvo)), None)


def mat(v):
    try:
        return str(int(float(v))).zfill(5)
    except (TypeError, ValueError):
        return None


def ler_planilha(catalogos):
    checklists, cache = [], {}
    for sheet in ["Operacional", "Administrativo"]:
        df = pd.read_excel(XLSX, sheet_name=sheet).reset_index(drop=True)
        i_res = col_idx(df, "Todos as inconformidades foram resolvidas?")
        i_obs = col_idx(df, "Observador")
        i_coord = col_idx(df, "Coordenador do Obs")
        i_basobs = col_idx(df, "Base do Obs")
        cols = list(df.columns)
        mat_cols = [j for j in range(7, 19) if j < len(cols) and "matricula" in norm(cols[j])]
        nome_cols = [i for i in range(i_basobs + 1, len(cols)) if "colaborador" in norm(cols[i])]
        for idx in range(len(df)):
            row = df.iloc[idx]
            ger = str(row.iloc[4]).strip()
            if (sheet, ger) not in SHEET_TIPO:
                continue
            tipo, auditagem = SHEET_TIPO[(sheet, ger)]
            if tipo not in cache:
                cache[tipo] = mapa_colunas(tipo, df, catalogos)
            respostas, rouo_itens = {}, {}
            for i, m in cache[tipo].items():
                v = row.iloc[i]
                if pd.isna(v):
                    continue
                v = str(v).strip()
                if m[0] == "ROUO":
                    rouo_itens[m[2]] = v == "Conforme"
                    continue
                p = m[1]
                resp = "conforme" if v == "Conforme" else "nao_conforme"
                respostas[p["id"]] = {"p": p, "resposta": resp}
            if rouo_itens:
                rp = next((p for (t, p, _) in cache[tipo].values() if t == "ROUO"), None)
                if rp is not None:
                    resp = "nao_conforme" if any(not ok for ok in rouo_itens.values()) else "conforme"
                    itens = [{"nome": ROUO_ITENS[n], "conforme": rouo_itens[n]} for n in sorted(rouo_itens)]
                    respostas[rp["id"]] = {"p": rp, "resposta": resp, "itens": itens}
            ts = pd.to_datetime(row.iloc[0])
            resolvido_geral = None
            if i_res is not None and pd.notna(row.iloc[i_res]):
                resolvido_geral = str(row.iloc[i_res]).strip().lower() == "sim"
            checklists.append({
                "sheet": sheet, "row": idx, "carimbo": ts.to_pydatetime(),
                "matricula": mat(row.iloc[1]), "observador": str(row.iloc[i_obs]).strip(),
                "coordenador": str(row.iloc[i_coord]).strip() if pd.notna(row.iloc[i_coord]) else "",
                "base_obs": str(row.iloc[i_basobs]).strip().upper() if pd.notna(row.iloc[i_basobs]) else None,
                "auditagem": auditagem, "gerencia_planilha": ger, "base": str(row.iloc[2]).strip().upper(),
                "equipe": str(row.iloc[3]).strip(),
                "membros": [
                    {"nome": (str(row.iloc[nj]).strip().title() if isinstance(row.iloc[nj], str) else ""), "matricula": mat(row.iloc[mj])}
                    for mj, nj in zip(mat_cols, nome_cols) if mat(row.iloc[mj])
                ],
                "respostas": list(respostas.values()), "resolvido_geral": resolvido_geral,
            })
    return checklists


def payload(ch):
    client_id = str(uuid.uuid5(NS, f"{ch['sheet']}|{ch['row']}|{ch['carimbo'].isoformat()}|{ch['matricula']}|{ch['equipe']}"))
    respostas = []
    n_conf = n_nc = 0
    for r in ch["respostas"]:
        p, resp = r["p"], r["resposta"]
        n_conf += resp == "conforme"
        n_nc += resp == "nao_conforme"
        respostas.append({
            "pergunta_id": p["id"], "categoria": p["categoria"], "pergunta": p["texto"],
            "gravidade": p["gravidade"], "peso": p["peso"], "resposta": resp,
            "observacao": None, "foto_r2_key": None,
            "resolvido": (ch["resolvido_geral"] if resp == "nao_conforme" else None),
            "itens": r.get("itens"),
        })
    resumo = {"total": len(respostas), "conformes": n_conf, "naoConformes": n_nc,
              "legado": {"origem": "Base POC 4.0", "planilha": ch["sheet"]}}
    return client_id, {
        "client_id": client_id,
        "matricula": ch["matricula"],
        "observador": ch["observador"],
        "auditagem": ch["auditagem"],
        "data": ch["carimbo"].strftime("%Y-%m-%dT%H:%M:%S") + OFFSET,
        "base": ch["base"],
        "equipe": ch["equipe"],
        "membros": ch["membros"],
        "resumo": resumo,
        "status": "aprovado",
    }, respostas


def chave_env():
    txt = open(ENV_FILE, encoding="utf-8").read()
    return re.search(r"VITE_SUPABASE_ANON_KEY=(.+)", txt).group(1).strip()


def http(method, path, key, body=None, prefer=None, query=None):
    url = f"{SUPABASE_URL}/{path}"
    if query:
        url += "?" + urllib.parse.urlencode(query)
    headers = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    if prefer:
        headers["Prefer"] = prefer
    data = json.dumps(body, ensure_ascii=False).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            raw = r.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"{e.code} {e.read().decode('utf-8', 'replace')[:400]}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="grava no banco (padrão: dry-run)")
    ap.add_argument("--lote", type=int, default=1000)
    ap.add_argument("--max-lotes", type=int, default=0, help="processa no máximo N lotes de 100 checklists (teste)")
    args = ap.parse_args()

    catalogos = carregar_catalogos()
    checklists = ler_planilha(catalogos)
    key = chave_env()

    pares = [payload(c) for c in checklists]
    vistos, subs, resp_por_sub = set(), [], {}
    duplicados = 0
    for cid, sub, resp in pares:
        if cid in vistos:
            duplicados += 1
            continue
        vistos.add(cid)
        subs.append(sub)
        resp_por_sub[cid] = resp
    total_resp = sum(len(v) for v in resp_por_sub.values())

    existentes = set()
    for i in range(0, len(subs), 300):
        lote = [s["client_id"] for s in subs[i:i + 300]]
        rows = http("GET", "checklist_submissions", key,
                    query={"select": "client_id", "client_id": f"in.({','.join(lote)})"})
        existentes.update(r["client_id"] for r in rows)
    novos = [s for s in subs if s["client_id"] not in existentes]

    matriculas_banco = {e["matricula"] for e in http("GET", "employees", key, query={"select": "matricula"})}
    faltantes = collections.defaultdict(list)
    for c in checklists:
        if c["matricula"] and c["matricula"] not in matriculas_banco:
            faltantes[c["matricula"]].append(c)

    print(f"checklists lidos: {len(checklists)} | únicos: {len(subs)} | duplicados: {duplicados}")
    print(f"já no banco (pulados): {len(existentes)} | a inserir: {len(novos)}")
    print(f"respostas a inserir: {sum(len(resp_por_sub[s['client_id']]) for s in novos)} (total lido {total_resp})")
    print(f"observadores sem cadastro em employees: {len(faltantes)} (checklists afetados: {sum(len(v) for v in faltantes.values())})")
    print("exemplo de submissão:", json.dumps(novos[0], ensure_ascii=False)[:600] if novos else None)

    if not args.apply:
        print("\nDry-run: nada foi gravado. Use --apply após aprovar as decisões pendentes.")
        return

    import os
    ck_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".importar_historico.checkpoint.json")
    feitos = set(json.load(open(ck_path))) if os.path.exists(ck_path) else set()
    TAM = 100
    lotes = [subs[i:i + TAM] for i in range(0, len(subs), TAM)]
    processados = 0
    for ci, lote in enumerate(lotes):
        if ci in feitos:
            continue
        if args.max_lotes and processados >= args.max_lotes:
            break
        cids = [s["client_id"] for s in lote]
        ja = {r["client_id"] for r in http("GET", "checklist_submissions", key,
              query={"select": "client_id", "client_id": f"in.({','.join(cids)})"})}
        faltam = [s for s in lote if s["client_id"] not in ja]
        if faltam:
            http("POST", "checklist_submissions", key, body=faltam, prefer="return=minimal")
        ids = {r["client_id"]: r["id"] for r in http("GET", "checklist_submissions", key,
               query={"select": "id,client_id", "client_id": f"in.({','.join(cids)})"})}
        linhas = [{"submission_id": ids[s["client_id"]], **r} for s in lote for r in resp_por_sub[s["client_id"]]]
        for i in range(0, len(linhas), args.lote):
            http("POST", "checklist_responses", key, body=linhas[i:i + args.lote],
                 prefer="resolution=ignore-duplicates,return=minimal", query={"on_conflict": "submission_id,pergunta_id"})
        feitos.add(ci)
        json.dump(sorted(feitos), open(ck_path, "w"))
        processados += 1
        if processados % 10 == 0 or processados == 1:
            print(f"lotes concluídos: {len(feitos)}/{len(lotes)} ({len(feitos) * TAM} checklists)", flush=True)
    print("concluído.")


if __name__ == "__main__":
    sys.exit(main())
