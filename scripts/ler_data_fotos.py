"""Lê o carimbo de data/hora das fotos de evidência dos checklists e calcula a data da inspeção (foto mais antiga).

O carimbo ("16/10/2026 | 18:35:24") está escrito na própria imagem, na faixa inferior. Para cada checklist ainda sem
`resumo.dataFoto`, lê a 1ª foto; se ela for bem anterior ao envio, lê as outras e fica com a mais antiga.
Só grava o resultado em um arquivo JSON (id -> data ISO em UTC); quem aplica no banco é o gerar_sql().

Uso: python ler_data_fotos.py --desde 2026-10-01T00:00:00Z --saida resultado.json [--sql saida.sql]
Requer: pip install rapidocr-onnxruntime pillow
"""
import argparse
import datetime as dt
import io
import json
import re
import sys
import threading
import urllib.request
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, __import__("os").path.dirname(__import__("os").path.abspath(__file__)))
import exportar_mes as em  # noqa: E402
import importar_historico as h  # noqa: E402
import numpy as np  # noqa: E402
from PIL import Image  # noqa: E402
from rapidocr_onnxruntime import RapidOCR  # noqa: E402

FUSO = dt.timedelta(hours=3)  # o carimbo é hora local (UTC-3)
RE_CARIMBO = re.compile(r"(\d{2})/(\d{2})/(\d{4})\D{0,4}(\d{2}):(\d{2}):(\d{2})")
_tls = threading.local()


def motor():
    if not hasattr(_tls, "m"):
        _tls.m = RapidOCR()
    return _tls.m


def baixar(base, chave):
    req = urllib.request.Request(base + "/" + chave, headers={"User-Agent": "Mozilla/5.0"})
    return urllib.request.urlopen(req, timeout=60).read()


def ler_carimbo(base, chave):
    """Data/hora do carimbo da foto em UTC (naive) ou None."""
    try:
        im = Image.open(io.BytesIO(baixar(base, chave))).convert("RGB")
    except Exception:
        return None
    w, hh = im.size
    res, _ = motor()(np.array(im.crop((0, int(hh * 0.78), w, hh))))
    texto = " | ".join(r[1] for r in (res or []))
    m = RE_CARIMBO.search(texto)
    if not m:
        return None
    d, mo, a, hh_, mi, se = (int(x) for x in m.groups())
    try:
        return dt.datetime(a, mo, d, hh_, mi, se) + FUSO
    except ValueError:
        return None


def parse_iso(s):
    return dt.datetime.fromisoformat(s.replace("Z", "+00:00")).replace(tzinfo=None)


def processar(base, sub, fotos):
    envio = parse_iso(sub["data"])

    def plausivel(t):
        return t is not None and envio - dt.timedelta(days=45) <= t <= envio + dt.timedelta(minutes=30)

    t0 = ler_carimbo(base, fotos[0])
    achadas = [t0] if plausivel(t0) else []
    # 1ª foto bem anterior ao envio: as outras podem ser ainda mais antigas
    if achadas and envio - achadas[0] > dt.timedelta(minutes=30):
        for chave in fotos[1:]:
            t = ler_carimbo(base, chave)
            if plausivel(t):
                achadas.append(t)
    return min(achadas) if achadas else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--desde", required=True, help="created_at mínimo (ISO UTC)")
    ap.add_argument("--saida", required=True)
    ap.add_argument("--workers", type=int, default=4)
    args = ap.parse_args()

    key = h.chave_env()
    base = ""
    for linha in open(h.ENV_FILE, encoding="utf-8"):
        if linha.startswith("VITE_R2_PUBLIC_BASE_URL="):
            base = linha.split("=", 1)[1].strip().rstrip("/")

    subs = em.paginar("checklist_submissions", key, {"select": "id,data,created_at,resumo", "created_at": f"gte.{args.desde}"},
                      "created_at.asc,id.asc")
    subs = [s for s in subs if not (s["resumo"] or {}).get("legado") and not (s["resumo"] or {}).get("dataFoto")]
    fotos = em.em_lotes("checklist_photos", key, "submission_id", [s["id"] for s in subs], "submission_id,tipo,r2_key,sort_order",
                        extra={"tipo": "eq.local"}, ordem="submission_id.asc,sort_order.asc")
    por_sub = {}
    for f in fotos:
        por_sub.setdefault(f["submission_id"], []).append(f["r2_key"])
    alvo = [s for s in subs if por_sub.get(s["id"])]
    print(f"{len(alvo)} checklists com fotos a ler", flush=True)

    resultado, feitos = {}, 0

    def tarefa(s):
        try:
            return s["id"], processar(base, s, por_sub[s["id"]])
        except Exception as e:  # noqa: BLE001
            return s["id"], f"erro: {e}"

    with ThreadPoolExecutor(args.workers) as ex:
        for sid, t in ex.map(tarefa, alvo):
            feitos += 1
            resultado[sid] = t.strftime("%Y-%m-%dT%H:%M:%S.000+00:00") if isinstance(t, dt.datetime) else t
            if feitos % 50 == 0:
                print(f"{feitos}/{len(alvo)}", flush=True)
                json.dump(resultado, open(args.saida, "w"), ensure_ascii=False)
    json.dump(resultado, open(args.saida, "w"), ensure_ascii=False)
    lidos = sum(1 for v in resultado.values() if v and not str(v).startswith("erro"))
    print(f"pronto: {lidos} com data lida de {len(alvo)}", flush=True)


if __name__ == "__main__":
    main()
