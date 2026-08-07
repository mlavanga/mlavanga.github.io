"""In-memory SQLite store, rebuilt from seed on startup.

Keeping the store in memory and reseeding on boot makes every run of the demo
reproducible and the container stateless — the same property we want from a CI
test environment. The schema is the traceability spine: requirements ->
test_cases -> test_runs, with norms attached to requirements.
"""
import sqlite3
import threading
from datetime import datetime, timezone

from . import seed_data

# One lock guards ALL access to the shared in-memory connection: sqlite3
# connections are not safe for concurrent use from multiple threads, and the
# HTTP server is threaded. Writers use it via record_run; the request handler
# serialises API reads with it too (see server.py).
_LOCK = threading.RLock()
LOCK = _LOCK


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(":memory:", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    _create_schema(conn)
    _seed(conn)
    return conn


def _create_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE requirements (
            id TEXT PRIMARY KEY,
            level TEXT NOT NULL,      -- component | product | system
            title TEXT NOT NULL,
            norm TEXT NOT NULL,
            owner TEXT NOT NULL
        );
        CREATE TABLE test_cases (
            id TEXT PRIMARY KEY,
            requirement_id TEXT NOT NULL REFERENCES requirements(id),
            title TEXT NOT NULL,
            kind TEXT NOT NULL,       -- automated | manual
            suite TEXT NOT NULL
        );
        CREATE TABLE test_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            test_case_id TEXT NOT NULL REFERENCES test_cases(id),
            status TEXT NOT NULL,     -- passed | failed | blocked | not_run
            detail TEXT,
            run_at TEXT NOT NULL
        );
        """
    )


def _seed(conn: sqlite3.Connection) -> None:
    conn.executemany(
        "INSERT INTO requirements (id, level, title, norm, owner) VALUES (?,?,?,?,?)",
        seed_data.REQUIREMENTS,
    )
    conn.executemany(
        "INSERT INTO test_cases (id, requirement_id, title, kind, suite) VALUES (?,?,?,?,?)",
        seed_data.TEST_CASES,
    )
    # Seed manual results as historical runs; automated cases start as not_run
    # until the suite is executed via the API / button. Manual entries are
    # clearly labelled as fictional placeholders — in a real system they would
    # reference the lab-management record.
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    for tc_id, _req, _title, kind, _suite in seed_data.TEST_CASES:
        if kind == "manual":
            status = seed_data.MANUAL_RESULTS.get(tc_id, "not_run")
            # Store WHY this case is manual/blocked, so the dashboard can show a
            # reason instead of an unexplained status. A "blocked" item nobody can
            # explain is indistinguishable from a forgotten one.
            detail = seed_data.METHOD_RATIONALE.get(
                tc_id, "Laborbericht (fiktiver Demo-Platzhalter)"
            )
            conn.execute(
                "INSERT INTO test_runs (test_case_id, status, detail, run_at) VALUES (?,?,?,?)",
                (tc_id, status, detail, now),
            )
    conn.commit()


def latest_status(conn: sqlite3.Connection, test_case_id: str) -> str:
    row = conn.execute(
        "SELECT status FROM test_runs WHERE test_case_id=? ORDER BY id DESC LIMIT 1",
        (test_case_id,),
    ).fetchone()
    return row["status"] if row else "not_run"


def record_run(conn: sqlite3.Connection, test_case_id: str, status: str, detail: str) -> None:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    with _LOCK:
        conn.execute(
            "INSERT INTO test_runs (test_case_id, status, detail, run_at) VALUES (?,?,?,?)",
            (test_case_id, status, detail, now),
        )
        conn.commit()
