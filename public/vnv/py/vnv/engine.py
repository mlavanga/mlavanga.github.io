"""V&V core: suite execution, traceability aggregation, impact analysis, report.

`run_automated_suite` executes every automated test case as a HiL procedure
against a fresh simulated device (optionally with an injected fault) and stores
the full evidence (guard-banded checks + signal trace) with the run — the CI
analogue with per-run records. `traceability`/`kpis` compute the dashboard view.
`impact` walks the requirement dependency graph to answer "what must be
re-verified if this requirement changes". `verification_report` renders an
audit-oriented Markdown verification report with a gated release recommendation.
"""
import json
from datetime import datetime, timezone

from . import db, seed_data, hil, seed_data


def run_automated_suite(conn, fault: str = "none") -> dict:
    """Execute every automated procedure and record runs with evidence."""
    passed = failed = 0
    results = []
    for tc_id, _req, _title, kind, _suite in seed_data.TEST_CASES:
        if kind != "automated":
            continue
        res = hil.execute(tc_id, fault=fault)
        summary = "; ".join(
            f"{c['name']}: {c['measured']} {c['op']} {c['limit']} ({'OK' if c['passed'] else 'FAIL'})"
            for c in res["checks"]
        )
        db.record_run(conn, tc_id, res["status"], json.dumps(
            {"summary": summary, "checks": res["checks"], "trace": res["trace"], "fault": fault},
            ensure_ascii=False,
        ))
        results.append({"test_case_id": tc_id, "status": res["status"], "detail": summary})
        passed += res["status"] == "passed"
        failed += res["status"] == "failed"
    return {"executed": len(results), "passed": passed, "failed": failed,
            "fault": fault, "results": results}


def latest_evidence(conn, test_case_id: str) -> dict | None:
    row = conn.execute(
        "SELECT status, detail, run_at FROM test_runs WHERE test_case_id=? ORDER BY id DESC LIMIT 1",
        (test_case_id,),
    ).fetchone()
    if not row:
        return None
    out = {"status": row["status"], "run_at": row["run_at"]}
    try:
        out.update(json.loads(row["detail"]))
    except (TypeError, ValueError):
        out["summary"] = row["detail"]
    return out


def traceability(conn) -> list:
    """One row per requirement with its linked test cases and their latest status."""
    rows = []
    for req in conn.execute("SELECT * FROM requirements ORDER BY id").fetchall():
        cases = conn.execute(
            "SELECT * FROM test_cases WHERE requirement_id=? ORDER BY id", (req["id"],)
        ).fetchall()
        case_list = []
        for c in cases:
            case_list.append(
                {
                    "id": c["id"],
                    "title": c["title"],
                    "kind": c["kind"],
                    "suite": c["suite"],
                    "status": db.latest_status(conn, c["id"]),
                    # Why this case is automated / manual / blocked — shown in the
                    # UI so a status is never presented without its justification.
                    "rationale": seed_data.METHOD_RATIONALE.get(c["id"], ""),
                }
            )
        statuses = [c["status"] for c in case_list]
        if not case_list:
            verdict = "uncovered"
        elif "failed" in statuses:
            verdict = "failed"
        elif "invalid" in statuses:
            verdict = "invalid"
        elif "blocked" in statuses:
            verdict = "blocked"
        elif all(s == "passed" for s in statuses):
            verdict = "verified"
        else:
            verdict = "open"
        rows.append(
            {
                "id": req["id"],
                "level": req["level"],
                "title": req["title"],
                "norm": req["norm"],
                "owner": req["owner"],
                "verdict": verdict,
                "cases": case_list,
            }
        )
    return rows


def kpis(conn) -> dict:
    trace = traceability(conn)
    total = len(trace)
    verified = sum(r["verdict"] == "verified" for r in trace)
    by_level = {}
    for lvl in ("component", "product", "system"):
        subset = [r for r in trace if r["level"] == lvl]
        by_level[lvl] = {
            "total": len(subset),
            "verified": sum(r["verdict"] == "verified" for r in subset),
        }
    cases = conn.execute("SELECT id FROM test_cases").fetchall()
    case_status = [db.latest_status(conn, c["id"]) for c in cases]
    # A test counts as executed only if it actually produced a result
    # (passed/failed/invalid). Blocked and not_run are NOT executed.
    executed = [s for s in case_status if s in ("passed", "failed", "invalid")]
    passed = sum(s == "passed" for s in executed)
    return {
        "requirements": total,
        "verified": verified,
        "coverage_pct": round(100 * verified / total) if total else 0,
        "test_cases": len(cases),
        "executed": len(executed),
        "pass_rate_pct": round(100 * passed / len(executed)) if executed else 0,
        "open_issues": sum(s in ("failed", "blocked", "invalid") for s in case_status),
        "by_level": by_level,
    }


# ----------------------------------------------------------- impact analysis

def impact(conn, requirement_id: str) -> dict:
    """Change-impact: the requirement, everything downstream, and their tests.

    If `requirement_id` changes, all transitively dependent requirements lose
    their verified status and every linked test case must be re-run.
    """
    affected = []
    seen = set()
    stack = [requirement_id]
    while stack:
        rid = stack.pop()
        if rid in seen:
            continue
        seen.add(rid)
        affected.append(rid)
        stack.extend(seed_data.REQUIREMENT_DEPS.get(rid, []))

    detail = []
    for rid in affected:
        req = conn.execute("SELECT * FROM requirements WHERE id=?", (rid,)).fetchone()
        if not req:
            continue
        cases = conn.execute(
            "SELECT id, title, kind FROM test_cases WHERE requirement_id=? ORDER BY id", (rid,)
        ).fetchall()
        detail.append(
            {
                "id": rid,
                "title": req["title"],
                "level": req["level"],
                "direct": rid == requirement_id,
                "retest": [{"id": c["id"], "title": c["title"], "kind": c["kind"]} for c in cases],
            }
        )
    n_tests = sum(len(d["retest"]) for d in detail)
    return {"changed": requirement_id, "affected_requirements": detail, "tests_to_rerun": n_tests}


# ----------------------------------------------------------- report

def verification_report(conn, fault: str = "none") -> str:
    """Audit-oriented verification report (Markdown) with release recommendation.

    Demo scope: the evidence below comes from a software-only rig simulation
    following the HiL principle; the report structure, guard-banded acceptance
    and gated release logic are the transferable part.
    """
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    trace = traceability(conn)
    k = kpis(conn)
    failed = [r for r in trace if r["verdict"] in ("failed", "invalid")]
    blocked = [r for r in trace if r["verdict"] == "blocked"]
    open_ = [r for r in trace if r["verdict"] in ("open", "uncovered")]
    releasable = not failed and not blocked and not open_

    lines = [
        "# Verifikationsbericht — AquaSim SF-01 Sensor-Armatur + AC-64S Controller (Demo)",
        "",
        "> **SIMULIERTE/FIKTIVE NACHWEISE — KEINE PRODUKTFREIGABE.** "
        "Software-Simulation zweier Prüfstände nach HiL-Prinzip (Geräte-Ebene: "
        "Armatur; System-Ebene: Controller + Knoten); Normzuordnungen "
        "illustrativ, Modellnummern fiktiv.",
        "",
        f"Erstellt: {now} · Basis: jeweils letzter Lauf pro Testfall "
        f"(Fehlerinjektion pro Lauf im Nachweis vermerkt; aktuell gewählt: `{fault}`)",
        "",
        "## Zusammenfassung",
        "",
        f"- Anforderungen: **{k['verified']}/{k['requirements']} verifiziert** ({k['coverage_pct']} %)",
        f"- Testfälle ausgeführt: {k['executed']}/{k['test_cases']}, Pass-Rate {k['pass_rate_pct']} %",
        f"- Offene Punkte: {k['open_issues']}",
        "",
        "| Ebene | verifiziert | gesamt |",
        "|---|---|---|",
    ]
    for lvl, label in (("component", "Komponente"), ("product", "Produkt"), ("system", "System")):
        d = k["by_level"][lvl]
        lines.append(f"| {label} | {d['verified']} | {d['total']} |")

    lines += ["", "## Traceability-Matrix", "",
              "| Anforderung | Ebene | Norm | Testfälle (Status) | Ergebnis |", "|---|---|---|---|---|"]
    for r in trace:
        cases = "<br>".join(f"`{c['id']}` {c['status']}" for c in r["cases"])
        lines.append(f"| **{r['id']}** {r['title']} | {r['level']} | {r['norm']} | {cases} | **{r['verdict']}** |")

    lines += ["", "## Nachweise (automatisierte Prüfungen)", ""]
    for tc_id, _req, title, kind, _suite in seed_data.TEST_CASES:
        if kind != "automated":
            continue
        ev = latest_evidence(conn, tc_id)
        if not ev or "checks" not in ev:
            lines.append(f"- `{tc_id}` {title}: **nicht ausgeführt**")
            continue
        checks = "; ".join(
            f"{c['name']} = {c['measured']}"
            + (f" ± {c['unc']}" if c.get("unc") else "")
            + f" (Limit {c['op']} {c['limit']}, {'OK' if c['passed'] else 'FAIL'})"
            for c in ev["checks"]
        )
        fault_note = f" · Fehlerinjektion: {ev['fault']}" if ev.get("fault") and ev["fault"] != "none" else ""
        lines.append(f"- `{tc_id}` {title} — {ev['status']} ({ev['run_at']}{fault_note}): {checks}")

    lines += ["", "## Offene Punkte", ""]
    if failed:
        for r in failed:
            tag = "INVALID" if r["verdict"] == "invalid" else "FAIL"
            note = ("Prüfung konnte den Prüfling nicht spezifikationsgemäss anregen — "
                    "Prüfaufbau prüfen." if r["verdict"] == "invalid"
                    else "Ursachenanalyse erforderlich.")
            lines.append(f"- **{tag}** {r['id']} {r['title']} — {note}")
    if blocked:
        for r in blocked:
            lines.append(f"- **BLOCKED** {r['id']} {r['title']} — Prüfmittel/Prüfstand fehlt.")
    if open_:
        for r in open_:
            lines.append(f"- **OFFEN** {r['id']} {r['title']} — Nachweis unvollständig.")
    if not (failed or blocked or open_):
        lines.append("- keine")

    lines += ["", "## Freigabeempfehlung", ""]
    if releasable:
        lines.append("**FREIGABE EMPFOHLEN** — alle Anforderungen auf allen Ebenen verifiziert. "
                     "(Demo: simulierte Nachweise, keine reale Produktfreigabe.)")
    else:
        reasons = []
        if failed:
            reasons.append(f"{len(failed)} fehlgeschlagene/ungültige Anforderung(en)")
        if blocked:
            reasons.append(f"{len(blocked)} blockierte Anforderung(en)")
        if open_:
            reasons.append(f"{len(open_)} offene Anforderung(en)")
        lines.append(f"**KEINE FREIGABE** — {', '.join(reasons)}. "
                     "Freigabe erst nach Abschluss aller Nachweise auf Komponenten-, "
                     "Produkt- und Systemebene.")
    lines += ["", "---",
              "_Automatisch erzeugt aus der Traceability-Datenbank; jede Zeile ist über die "
              "Run-Historie rückverfolgbar. Messwerte mit Unsicherheits-Schutzband bewertet "
              "(measured ± U gegen Limit). Normzuordnungen illustrativ (Demo)._", ""]
    return "\n".join(lines)
