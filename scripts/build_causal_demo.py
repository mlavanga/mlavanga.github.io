#!/usr/bin/env python3
"""
Reproducible PCMCI causal discovery on an OPEN physiological dataset, for the website demo.

Dataset: BIDMC PPG and Respiration Dataset (PhysioNet, ODC-BY 1.0).
  https://physionet.org/content/bidmc/1.0.0/
We use the 1 Hz numerics (HR, PULSE, RESP, SpO2) across several recordings as multiple
realizations, and run PCMCI (Tigramite, ParCorr) to discover the lagged causal graph.

Output: app/data/causalDemo.json  (consumed by app/components/CausalGraphDemo.tsx)

Run:  conda run -n pcmci python scripts/build_causal_demo.py
"""
import io
import json
import urllib.request
from pathlib import Path

import numpy as np
from tigramite import data_processing as pp
from tigramite.pcmci import PCMCI
from tigramite.independence_tests.parcorr import ParCorr

BASE = "https://physionet.org/files/bidmc/1.0.0/bidmc_csv"
RECORDS = [f"{i:02d}" for i in range(1, 7)]  # first 6 recordings (waveforms are big)
# Waveform signals (125 Hz): respiration belt, PPG, ECG lead II — where lagged
# physiological coupling (respiratory modulation, pulse transit) is real and discoverable.
VARS = ["RESP", "PLETH", "II"]
LABELS = {"RESP": "Respiration", "PLETH": "PPG", "II": "ECG"}
UNITS = {"RESP": "a.u.", "PLETH": "a.u.", "II": "a.u."}
DECIM = 12           # 125 Hz -> ~10.4 Hz (captures both cardiac ~1 Hz and respiratory ~0.25 Hz)
MAX_SAMP = 4000      # cap per record after decimation (keeps PCMCI fast)
TAU_MAX = 25         # up to ~2.4 s of lag — long enough for respiratory-band coupling
PC_ALPHA = 0.01
OUT = Path(__file__).resolve().parents[1] / "app" / "data" / "causalDemo.json"


def fetch_waveforms(rec: str) -> np.ndarray | None:
    """Return a (T, 3) array of [RESP, PLETH, II], decimated to ~25 Hz, or None."""
    url = f"{BASE}/bidmc_{rec}_Signals.csv"
    try:
        raw = urllib.request.urlopen(url, timeout=60).read().decode("utf-8")
    except Exception as e:  # noqa: BLE001
        print(f"  skip {rec}: {e}")
        return None
    header = [h.strip().strip("﻿").replace(" ", "").upper() for h in raw.splitlines()[0].split(",")]
    idx = {}
    for v in VARS:
        for j, h in enumerate(header):
            if h == v or h == v.replace("II", "II"):
                idx[v] = j
                break
    if len(idx) < len(VARS):
        print(f"  skip {rec}: header {header} missing one of {VARS}")
        return None
    arr = np.genfromtxt(io.StringIO(raw), delimiter=",", skip_header=1)
    cols = arr[::DECIM, [idx[v] for v in VARS]]
    cols = cols[~np.isnan(cols).any(axis=1)]
    if cols.shape[0] > MAX_SAMP:
        cols = cols[:MAX_SAMP]
    if cols.shape[0] < 200:
        return None
    cols = (cols - cols.mean(0)) / (cols.std(0) + 1e-8)
    return cols


def main() -> None:
    realizations = {}
    k = 0
    for rec in RECORDS:
        a = fetch_waveforms(rec)
        if a is not None:
            realizations[k] = a
            k += 1
    if not realizations:
        raise SystemExit("No data downloaded.")
    total = sum(v.shape[0] for v in realizations.values())
    print(f"Loaded {len(realizations)} recordings, {total} total samples, {len(VARS)} variables.")

    # autocorrelation (lag-1) per variable, pooled
    auto = {}
    for vi, v in enumerate(VARS):
        rs = []
        for a in realizations.values():
            x = a[:, vi]
            rs.append(np.corrcoef(x[:-1], x[1:])[0, 1])
        auto[v] = float(np.nanmean(rs))

    dataframe = pp.DataFrame(
        data=realizations,
        analysis_mode="multiple",
        var_names=VARS,
    )
    pcmci = PCMCI(dataframe=dataframe, cond_ind_test=ParCorr(), verbosity=0)
    # PCMCI+ recovers contemporaneous (lag 0) AND lagged links and orients them — needed here
    # because the dominant physiological coupling (HR<->Pulse, RESP->HR) is contemporaneous.
    results = pcmci.run_pcmciplus(tau_min=0, tau_max=TAU_MAX, pc_alpha=PC_ALPHA)
    val = results["val_matrix"]  # (N, N, tau+1)
    graph = results["graph"]     # link types: '-->', '<--', 'o-o', ''

    N = len(VARS)
    MIN_STRENGTH = 0.05
    # Keep the single strongest edge per ordered pair (clean graph): the most significant
    # directed '-->' link over all lags, else a contemporaneous 'o-o' (recorded once).
    links = []
    seen_undirected = set()
    for i in range(N):
        for j in range(N):
            if i == j:
                continue
            best_tau = None
            for tau in range(0, TAU_MAX + 1):
                if graph[i, j, tau] == "-->" and abs(val[i, j, tau]) >= MIN_STRENGTH:
                    if best_tau is None or abs(val[i, j, tau]) > abs(val[i, j, best_tau]):
                        best_tau = tau
            if best_tau is not None:
                links.append({"from": VARS[i], "to": VARS[j], "lag": int(best_tau),
                              "strength": round(float(abs(val[i, j, best_tau])), 3),
                              "sign": 1 if val[i, j, best_tau] >= 0 else -1, "directed": True})
                continue
            if graph[i, j, 0] == "o-o" and abs(val[i, j, 0]) >= MIN_STRENGTH:
                key = tuple(sorted((i, j)))
                if key not in seen_undirected:
                    seen_undirected.add(key)
                    links.append({"from": VARS[i], "to": VARS[j], "lag": 0,
                                  "strength": round(float(abs(val[i, j, 0])), 3),
                                  "sign": 1 if val[i, j, 0] >= 0 else -1, "directed": False})

    print("val_matrix (|MCI|, rounded):")
    for i in range(N):
        for j in range(N):
            row = [f"{graph[i,j,t] or '·':>3}{abs(val[i,j,t]):.2f}" for t in range(TAU_MAX + 1)]
            print(f"  {VARS[i]:>5}->{VARS[j]:<5}", " ".join(row))

    nodes = [{"id": v, "label": LABELS[v], "unit": UNITS[v], "autoLag": round(auto[v], 2)} for v in VARS]
    out = {
        "nodes": nodes,
        "links": links,
        "meta": {
            "dataset": "BIDMC PPG and Respiration Dataset (PhysioNet, ODC-BY 1.0) — 125 Hz waveforms",
            "n_recordings": len(realizations),
            "n_samples": int(total),
            "fs_hz": round(125 / DECIM, 2),
            "method": "PCMCI+ (Tigramite) with ParCorr",
            "tau_max": TAU_MAX,
            "pc_alpha": PC_ALPHA,
        },
    }
    OUT.write_text(json.dumps(out, indent=2) + "\n")
    print(f"\nWrote {OUT}")
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
