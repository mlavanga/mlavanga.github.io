"""System tier: simulated water-management controller ("AquaSim AC-64S").

Real-world anchor (illustrative, fictional model number): an AquaVip-style
system controller networks up to 32 actuators / 64 sensors over Ethernet/IP +
CAN, is configured via web browser, keeps distributed databases in sync,
writes a tamper-proof central log (documentation duty per
Trinkwasserverordnung), shows Störmeldungen and optionally integrates into
the building automation (GLT). The *device* tier (the SF-01 faucet in
`device.py`) speaks only BLE + app — networking, central logging and GLT live
here, on the controller.

This module simulates that tier:

- ``FlushNode`` — a flush point (an SF-01 faucet node) on a simulated
  Ethernet/IP link. A node can become unreachable (``eth_link_loss``) or hold
  a stale configuration replica (``db_sync_lag``).
- ``EventLog`` — the tamper-proof central log: a SHA-256 hash chain. Every
  entry commits to its predecessor; verification walks the chain and reports
  the first broken entry. Manipulating any recorded entry — even recomputing
  its own hash — breaks the chain at or after the manipulated entry.
- ``SystemController`` — polls the nodes, audits configuration sync, raises
  latched Störmeldungen, emits GLT telegrams, and runs the system-level
  function this tier exists for: **cross-node stagnation detection with a
  coordinated, staggered hygiene flush**. With a node unreachable the flush
  degrades safely: reachable nodes are still flushed and a Störmeldung is
  raised for the missing one.

Everything is deterministic (logical clock, no randomness), so evidence and
hashes are reproducible — the same reseeded/idempotent design as the rest of
the demo. Fault injection is tier-scoped: the system rig only reacts to
``SYSTEM_FAULTS``; device fault names are ignored here (the device HiL rig
handles those), and vice versa.
"""
import hashlib
import json

from . import device as dev

CONTROLLER_MODEL = "AquaSim AC-64S"   # fictional model number, not a real SKU

SYSTEM_FAULTS = (
    "eth_link_loss",   # one node unreachable on the Ethernet/IP link
    "db_sync_lag",     # one node's config replica lags the central version
)

CONFIG_VERSION = 7
STAGNATION_LIMIT_H = 24.0
FLUSH_STAGGER_S = 30.0        # coordinated flushes are staggered, never parallel
HEARTBEAT_LIMIT_MS = 100.0
GLT_INTERVAL_S = 58.0
GENESIS_HASH = "0" * 64


class LinkDown(Exception):
    """Simulated Ethernet/IP link failure for one node."""


def _entry_hash(body: dict) -> str:
    payload = json.dumps(body, sort_keys=True, ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


class EventLog:
    """Tamper-proof central event log (hash chain, Trinkwasserverordnung-style).

    Each entry stores ``prev_hash`` (the predecessor's hash) and its own
    ``hash`` over the canonical entry body. ``verify()`` recomputes the chain
    from the genesis hash; any manipulation of a recorded entry is detected
    and located.
    """

    def __init__(self):
        self.entries = []

    def append(self, ts: float, event: str, payload: dict) -> dict:
        prev = self.entries[-1]["hash"] if self.entries else GENESIS_HASH
        body = {
            "seq": len(self.entries),
            "ts": round(ts, 1),
            "event": event,
            "payload": payload,
            "prev_hash": prev,
        }
        entry = dict(body)
        entry["hash"] = _entry_hash(body)
        self.entries.append(entry)
        return entry

    def verify(self) -> dict:
        prev = GENESIS_HASH
        for i, e in enumerate(self.entries):
            body = {k: e[k] for k in ("seq", "ts", "event", "payload", "prev_hash")}
            if e["seq"] != i or e["prev_hash"] != prev or _entry_hash(body) != e["hash"]:
                return {"ok": False, "first_bad_seq": i, "entries": len(self.entries)}
            prev = e["hash"]
        return {"ok": True, "first_bad_seq": None, "entries": len(self.entries)}


class FlushNode:
    """A flush point (SF-01 faucet node) on the simulated Ethernet/IP link."""

    def __init__(self, node_id: str, location: str, latency_ms: float):
        self.node_id = node_id
        self.model = dev.MODEL
        self.location = location
        self.link_latency_ms = latency_ms
        self.device = dev.FaucetDevice()
        self.config_version = CONFIG_VERSION
        self.reachable = True

    def poll(self) -> dict:
        if not self.reachable:
            raise LinkDown(self.node_id)
        return {
            "node": self.node_id,
            "stagnation_h": round(self.device.stagnation_h, 1),
            "alarm": self.device.alarm,
            "config_version": self.config_version,
            "latency_ms": self.link_latency_ms,
        }

    def command_flush(self, volume_l: float) -> dict:
        """Controller-commanded hygiene flush: open the valve until the
        commanded volume is delivered (or a 60 s timeout elapses)."""
        if not self.reachable:
            raise LinkDown(self.node_id)
        d = self.device
        d.command_flow(1.0, dev.FACTORY_SETPOINT_C)
        delivered = 0.0
        t0 = d.time_s
        while delivered < volume_l and d.time_s - t0 < 60.0:
            d.tick(0.05)
            delivered += d.flow_lpm() * 0.05 / 60.0
        duration_s = d.time_s - t0
        d.command_flow(0.0)
        for _ in range(20):
            d.tick(0.05)
        return {
            "node": self.node_id,
            "volume_l": round(delivered, 2),
            "duration_s": round(duration_s, 1),
        }


class SystemController:
    """Simulated AquaSim AC-64S: central config, hash-chained log,
    Störmeldungen, GLT integration and the coordinated hygiene flush."""

    def __init__(self, fault: str = "none", n_nodes: int = 3):
        # Tier scoping: only system faults act here; device fault names are
        # handled by the device HiL rig and leave the system rig healthy.
        self.fault = fault if fault in SYSTEM_FAULTS else "none"
        self.model = CONTROLLER_MODEL
        self.clock_s = 0.0
        locations = (
            "Steigstrang A, WC EG",
            "Steigstrang A, WC 1. OG",
            "Steigstrang B, Technikraum UG",
        )
        latencies = (4.2, 6.8, 5.1)
        self.nodes = [
            FlushNode(f"N{i + 1}", locations[i % len(locations)],
                      latencies[i % len(latencies)])
            for i in range(n_nodes)
        ]
        if self.fault == "eth_link_loss" and len(self.nodes) > 1:
            self.nodes[1].reachable = False
        if self.fault == "db_sync_lag" and len(self.nodes) > 2:
            self.nodes[2].config_version = CONFIG_VERSION - 2
        self.central_config = {
            "version": CONFIG_VERSION,
            "stagnation_limit_h": STAGNATION_LIMIT_H,
            "flush_volume_l": 1.5,
            "disinfection_hold_c": 70.0,
        }
        self.log = EventLog()
        self.stoermeldungen = []
        self.glt_telegrams = []
        self._glt_due_s = GLT_INTERVAL_S
        self.log.append(self.clock_s, "controller_start",
                        {"model": self.model, "config_version": CONFIG_VERSION,
                         "nodes": [n.node_id for n in self.nodes]})

    # ------------------------------------------------------- Störmeldungen
    def raise_stoermeldung(self, code: str, node_id: str, text: str) -> dict:
        """Latched Störmeldung: raised once per (code, node) until cleared."""
        for m in self.stoermeldungen:
            if m["code"] == code and m["node"] == node_id:
                return m
        m = {"t": round(self.clock_s, 1), "code": code, "node": node_id, "text": text}
        self.stoermeldungen.append(m)
        self.log.append(self.clock_s, "stoermeldung", m)
        return m

    # ------------------------------------------------------- communication
    def poll_all(self):
        """Poll every node; unreachable nodes yield a Störmeldung."""
        statuses, unreachable = [], []
        for n in self.nodes:
            self.clock_s += 0.01
            try:
                statuses.append(n.poll())
            except LinkDown:
                unreachable.append(n.node_id)
                self.raise_stoermeldung(
                    "ETH-LINK", n.node_id,
                    f"Knoten {n.node_id} nicht erreichbar (Ethernet/IP)")
        return statuses, unreachable

    def heartbeat_check(self) -> list:
        """One heartbeat round across all nodes (link supervision)."""
        results = []
        for n in self.nodes:
            self.clock_s += 0.01
            if n.reachable:
                results.append({"node": n.node_id, "ok": True,
                                "latency_ms": n.link_latency_ms})
            else:
                results.append({"node": n.node_id, "ok": False, "latency_ms": None})
                self.raise_stoermeldung(
                    "ETH-LINK", n.node_id,
                    f"Heartbeat von Knoten {n.node_id} ausgeblieben")
        self.log.append(self.clock_s, "heartbeat",
                        {"ok": sum(r["ok"] for r in results), "total": len(results)})
        return results

    # ------------------------------------------------------- configuration
    def audit_config_sync(self) -> dict:
        """Audit every node's config replica against the central version
        (distributed-database consistency). Stale replicas are detected and
        reported via Störmeldung."""
        in_sync, stale, unreachable = [], [], []
        for n in self.nodes:
            self.clock_s += 0.01
            try:
                st = n.poll()
            except LinkDown:
                unreachable.append(n.node_id)
                self.raise_stoermeldung(
                    "ETH-LINK", n.node_id,
                    f"Knoten {n.node_id} für Konfigurations-Audit nicht erreichbar")
                continue
            if st["config_version"] == self.central_config["version"]:
                in_sync.append(n.node_id)
            else:
                stale.append({"node": n.node_id, "version": st["config_version"]})
                self.raise_stoermeldung(
                    "DB-SYNC", n.node_id,
                    f"Konfigurationsstand veraltet (v{st['config_version']} < "
                    f"v{self.central_config['version']})")
        self.log.append(self.clock_s, "config_audit",
                        {"central_version": self.central_config["version"],
                         "in_sync": in_sync, "stale": [s["node"] for s in stale],
                         "unreachable": unreachable})
        return {"central_version": self.central_config["version"],
                "in_sync": in_sync, "stale": stale, "unreachable": unreachable}

    # ------------------------------------------------------- system function
    def coordinated_flush(self) -> dict:
        """Cross-node stagnation detection -> coordinated hygiene flush.

        Nodes whose stagnation exceeds the central limit are flushed
        sequentially (staggered by ``FLUSH_STAGGER_S`` so draw-offs never run
        in parallel). Unreachable nodes degrade safely: the remaining nodes
        are still flushed and a Störmeldung marks the gap. Every command is
        written to the tamper-proof log.
        """
        statuses, unreachable = self.poll_all()
        limit = self.central_config["stagnation_limit_h"]
        due = [s["node"] for s in statuses if s["stagnation_h"] >= limit]
        flushed, schedule = [], []
        for i, node_id in enumerate(due):
            start = self.clock_s + i * FLUSH_STAGGER_S
            node = next(n for n in self.nodes if n.node_id == node_id)
            res = node.command_flush(self.central_config["flush_volume_l"])
            schedule.append({"node": node_id, "start_s": round(start, 1),
                             "end_s": round(start + res["duration_s"], 1)})
            flushed.append(res)
            self.log.append(start, "flush_commanded",
                            {"node": node_id, "volume_l": res["volume_l"]})
        self.clock_s += len(due) * FLUSH_STAGGER_S
        self.log.append(self.clock_s, "coordinated_flush",
                        {"due": due, "unreachable": unreachable,
                         "flushed": [f["node"] for f in flushed]})
        return {"due": due, "unreachable": unreachable,
                "flushed": flushed, "schedule": schedule}

    # ------------------------------------------------------- GLT integration
    def run_glt(self, seconds: float, dt: float = 1.0):
        """Advance the controller clock and emit periodic GLT telegrams with
        the aggregated system state (building-automation integration lives at
        THIS tier, not on the faucet)."""
        end = self.clock_s + seconds
        while self.clock_s < end:
            self.clock_s += dt
            if self.clock_s >= self._glt_due_s:
                self.glt_telegrams.append({
                    "t": round(self.clock_s, 1),
                    "nodes_total": len(self.nodes),
                    "nodes_ok": sum(1 for n in self.nodes if n.reachable),
                    "alarms": len(self.stoermeldungen),
                    "max_stagnation_h": round(
                        max(n.device.stagnation_h for n in self.nodes), 1),
                })
                self._glt_due_s += GLT_INTERVAL_S
