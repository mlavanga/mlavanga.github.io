"""Transport-independent API routing — ONE implementation for server & browser.

`handle(method, path, body)` implements every `/api/...` route the demo exposes
and returns `(status, body_string)` — JSON for the API routes, Markdown for
`/api/report`. Two frontends delegate to it:

- `vnv/server.py` (http.server) for the local/Docker deployment, and
- the Pyodide bootstrap in `web/` for the static GitHub-Pages build, where the
  same Python core runs in the browser via WebAssembly.

The module owns the sqlite connection and the active-fault state exactly the
way the server always did: an in-memory DB created (and therefore reseeded)
once per process at import time — every boot is a known baseline. All DB access
is serialised through `db.LOCK` so the threaded HTTP server stays safe; under
Pyodide the lock is simply uncontended.
"""
import json
from urllib.parse import urlparse, parse_qs

from . import db, edge, engine
from .controller import SYSTEM_FAULTS
from .device import FAULTS as DEVICE_FAULTS
from .hil import ALL_FAULTS as FAULTS

_CONN = db.connect()
_STATE = {"fault": "none"}


def reset() -> None:
    """Reseed the store and clear the fault state (tests / fresh baseline)."""
    global _CONN
    with db.LOCK:
        _CONN.close()
        _CONN = db.connect()
        _STATE["fault"] = "none"


def _json(payload, status=200):
    return status, json.dumps(payload, ensure_ascii=False)


def handle(method: str, path: str, body: str | None = None) -> tuple[int, str]:
    """Route one API request. Returns (HTTP status, response body string)."""
    parsed = urlparse(path)
    route = parsed.path
    query = parse_qs(parsed.query)
    with db.LOCK:
        if method == "GET":
            return _handle_get(route, query)
        if method == "POST":
            return _handle_post(route, body)
    return _json({"error": "method not allowed"}, 405)


def _handle_get(route, query):
    if route == "/api/health":
        return _json({"status": "ok"})
    if route == "/api/kpis":
        return _json(engine.kpis(_CONN))
    if route == "/api/traceability":
        return _json({"requirements": engine.traceability(_CONN)})
    if route == "/api/faults":
        return _json({
            "available": list(FAULTS),
            "device": [f for f in DEVICE_FAULTS if f != "none"],
            "system": list(SYSTEM_FAULTS),
            "active": _STATE["fault"],
        })
    if route == "/api/evidence":
        case = (query.get("case") or [""])[0]
        ev = engine.latest_evidence(_CONN, case)
        if ev is None:
            return _json({"error": f"no runs for {case}"}, 404)
        return _json({"case": case, "evidence": ev})
    if route == "/api/impact":
        req = (query.get("req") or [""])[0]
        if not req:
            return _json({"error": "missing ?req="}, 400)
        return _json(engine.impact(_CONN, req))
    if route == "/api/edge/fleet":
        return _json({"days": edge.DAYS, "devices": edge.fleet_telemetry()})
    if route == "/api/edge/recommendations":
        recs = edge.recommendations(impact_fn=lambda rid: engine.impact(_CONN, rid))
        return _json({"recommendations": recs})
    if route == "/api/report":
        return 200, engine.verification_report(_CONN, fault=_STATE["fault"])
    return _json({"error": "not found"}, 404)


def _parse_body(body):
    try:
        payload = json.loads(body or "{}")
    except ValueError:
        payload = {}
    return payload if isinstance(payload, dict) else {}


def _handle_post(route, body):
    if route == "/api/run":
        # The fault can be passed per run (preferred: no shared state between
        # visitors of a public instance); falls back to the session selection.
        payload = _parse_body(body)
        fault = payload.get("fault", _STATE["fault"])
        if fault not in FAULTS:
            return _json({"error": f"unknown fault: {fault}", "available": list(FAULTS)}, 400)
        _STATE["fault"] = fault
        return _json(engine.run_automated_suite(_CONN, fault=fault))
    if route == "/api/fault":
        payload = _parse_body(body)
        fault = payload.get("fault", "none")
        # JSON null means "clear the fault", same as omitting the key — it must
        # not silently keep the previous selection or bounce as unknown.
        if fault is None:
            fault = "none"
        if fault not in FAULTS:
            return _json({"error": f"unknown fault: {fault}", "available": list(FAULTS)}, 400)
        _STATE["fault"] = fault
        return _json({"active": fault})
    return _json({"error": "not found"}, 404)
