"""Hardware-in-the-loop test procedures and runner (two rigs, two tiers).

Each automated test case is a *procedure*: it gets a fresh simulated DUT —
either a single faucet (`device.py`, device tier) or the controller rig with
its flush-point nodes (`controller.py`, system tier) — stimulates it, samples
signals into a trace (the rig's independent reference `true_temp` alongside
the device's own `reported_temp`), and evaluates acceptance criteria. The
result carries machine-checkable evidence:

    {"checks": [{name, measured, unc, limit, op, passed}], "trace": [...]}

Three verification-discipline points are built in:

* **Measurement uncertainty**: every check carries the reference channel's
  expanded uncertainty ``U`` (coverage factor ``k = 2``) and acceptance is
  guard-banded — ``measured + U <= limit`` (resp. ``measured - U >= limit``).
  The conformance margin is stored with the evidence so borderline results
  cannot hide behind a green verdict.
* **Preconditions → invalid, not passed**: if the stimulus was not achieved
  (e.g. no water flow during the scald test because the valve is stuck), the
  procedure result is ``invalid`` — an unfulfilled test must never count as a
  pass. Invalid blocks release exactly like a failure.
* **Stated duration is executed duration** (e.g. the 60 s tightness hold really
  runs 60 simulated seconds).

Note: this is a software-only rig simulation following the HiL principle; the
reference channel is the simulation's ground truth with a declared uncertainty,
not a physical instrument.
"""
import copy

from . import controller as ctl
from . import device as dev

# All injectable faults: device tier + system tier, selectable through one
# selector. Fault injection is tier-scoped — device faults act on the device
# HiL rig, system faults on the system rig (see `execute`).
ALL_FAULTS = dev.FAULTS + ctl.SYSTEM_FAULTS

# Declared measurement uncertainty of the (simulated) reference channels.
UNC_TEMP_K = 0.15       # reference PT100 chain
UNC_TIME_MS = 5.0       # switching-time measurement
UNC_FLOW_PCT = 0.5      # flow deviation, percentage points
UNC_VOLUME_ML = 0.2     # collected leakage volume
UNC_PRESSURE_BAR = 0.05 # pressure reference chain


def _sample(d, trace, signals=("flow_lpm", "true_temp", "reported_temp", "valve")):
    row = {}
    if "flow_lpm" in signals:
        row["flow_lpm"] = round(d.flow_lpm(), 3)
    if "true_temp" in signals:
        row["true_temp"] = round(d.true_temp_c, 2)
    if "reported_temp" in signals:
        row["reported_temp"] = round(d.reported_temp_c(), 2)
    if "valve" in signals:
        row["valve"] = round(d.valve_actual, 3)
    trace.append([round(d.time_s, 2), row])


def _run(d, seconds, trace, dt=0.01, sample_every=0.2):
    steps = int(seconds / dt)
    next_sample = 0.0
    for _ in range(steps):
        d.tick(dt)
        if d.time_s >= next_sample:
            _sample(d, trace)
            next_sample += sample_every


def _check(name, measured, limit, op, unc=0.0):
    """Guard-banded acceptance: the measured value must satisfy the limit even
    at the unfavourable edge of the measurement uncertainty."""
    if op == "<=":
        ok = (measured + unc) <= limit
        margin = limit - (measured + unc)
    elif op == ">=":
        ok = (measured - unc) >= limit
        margin = (measured - unc) - limit
    else:  # "=="
        ok = measured == limit
        margin = None
    return {
        "name": name,
        "measured": round(measured, 3) if isinstance(measured, float) else measured,
        "unc": unc,
        "limit": limit,
        "op": op,
        "passed": bool(ok),
        "margin": round(margin, 3) if isinstance(margin, (int, float)) else None,
    }


def _precondition(name, satisfied, detail):
    """A failed precondition renders the procedure INVALID (not failed)."""
    return {"name": f"Vorbedingung: {name}", "measured": detail, "unc": 0.0,
            "limit": "erfüllt", "op": "==", "passed": bool(satisfied),
            "precondition": True}


# --------------------------------------------------------------- procedures

def proc_sensor_calibration(d):
    """T-C1a — device sensor vs. rig reference across its declared use range."""
    trace = []
    checks = []
    for opening, setpoint in ((0.25, 15.0), (0.4, 25.0), (0.6, 35.0), (0.7, 43.0)):
        d.command_flow(opening, setpoint)
        _run(d, 10.0, trace)
        error = abs(d.reported_temp_c() - d.true_temp_c)
        checks.append(_check(f"Sensorabweichung bei ~{setpoint:.0f} °C [K]",
                             error, 0.5, "<=", unc=UNC_TEMP_K))
    return checks, trace


def proc_valve_switching(d):
    """T-C2a — time from open command until 90% of target flow, 3 pressures."""
    trace = []
    checks = []
    for p in (0.5, 5.0, 10.0):
        d.supply_pressure_bar = p
        # Establish achieved steady state first. Switching time must measure
        # actuator dynamics, not conflate it with flow calibration/capacity.
        d.command_flow(1.0, 20.0)
        _run(d, 0.8, trace)
        steady_flow = d.flow_lpm()
        d.command_flow(0.0)
        _run(d, 0.5, trace)
        d.command_flow(1.0, 20.0)
        t0 = d.time_s
        switch_ms = 999.0
        if steady_flow >= 1.0:
            for _ in range(int(1.0 / 0.005)):
                d.tick(0.005)
                if d.flow_lpm() >= 0.9 * steady_flow:
                    switch_ms = (d.time_s - t0) * 1000.0
                    break
        _sample(d, trace)
        checks.append(_check(f"stationärer Durchfluss bei {p} bar [l/min]",
                             steady_flow, 1.0, ">=", unc=0.02))
        checks.append(_check(f"Schaltzeit bei {p} bar [ms]", switch_ms, 250.0, "<=",
                             unc=UNC_TIME_MS))
    return checks, trace


def proc_sleep_current(d):
    """T-C3a — quiescent current in firmware sleep."""
    return [_check("Ruhestrom [µA]", d.sleep_current_ua(), 50.0, "<=", unc=1.0)], []


def proc_flow_regulation(d):
    """T-P1a — flow setpoint ramp 2→8 l/min, deviation ≤ 10% of the commanded value.

    The commanded value comes from the firmware's nominal (linear) valve model;
    the plant has its own authority curve and, under the `flow_calibration`
    fault, delivers only 85% — so the deviation is a real plant/firmware
    mismatch, not an identity.
    """
    trace = []
    checks = []
    d.supply_pressure_bar = 3.0
    pf = min(1.0, 0.55 + 0.15 * d.supply_pressure_bar)
    for target_lpm in (2.0, 5.0, 8.0):
        opening = target_lpm / dev.MAX_FLOW_LPM
        d.command_flow(opening, 30.0)
        _run(d, 2.0, trace)
        commanded = target_lpm * pf  # what the firmware nominally promises
        deviation_pct = abs(d.flow_lpm() - commanded) / commanded * 100.0
        checks.append(_check(f"Abweichung bei {target_lpm} l/min [%]",
                             deviation_pct, 10.0, "<=", unc=UNC_FLOW_PCT))
    return checks, trace


def proc_flow_pressure_plausibility(d):
    """T-C5a — device flow/pressure sensors vs. the rig's independent reference.

    Flow plausibility at three operating points (device volume-flow sensor vs.
    rig reference flow, limit ±8 %) plus a pressure-sensor deviation check
    (±0.2 bar). Catches `flow_calibration` (the sensor converts with a stale
    calibration table and over-reports). Precondition: the rig must see real
    flow — with a stuck valve the result is INVALID, not passed.
    """
    trace = []
    checks = []
    d.supply_pressure_bar = 3.0
    ref_flows = []
    for opening in (0.4, 0.7, 1.0):
        d.command_flow(opening, 30.0)
        _run(d, 2.0, trace)
        ref = d.flow_lpm()                # rig reference channel
        rep = d.reported_flow_lpm()       # device's own sensor
        ref_flows.append(ref)
        dev_pct = abs(rep - ref) / ref * 100.0 if ref > 0.05 else 100.0
        checks.append(_check(f"Durchfluss-Plausibilität bei Öffnung {opening:.1f} [%]",
                             dev_pct, 8.0, "<=", unc=UNC_FLOW_PCT))
    press_err = abs(d.reported_pressure_bar() - d.supply_pressure_bar)
    checks.append(_check("Drucksensor-Abweichung zur Rig-Referenz [bar]",
                         press_err, 0.2, "<=", unc=UNC_PRESSURE_BAR))
    mean_flow = sum(ref_flows) / len(ref_flows)
    checks.insert(0, _precondition("Referenz-Durchfluss ≥ 1 l/min erreicht",
                                   mean_flow >= 1.0, f"{mean_flow:.2f} l/min"))
    return checks, trace


def proc_scald_protection(d):
    """T-P2a — request 60 °C; the RIG's reference must never see > 43 °C.

    Judged on `true_temp` (independent reference), not on what the device
    reports — a drifted device sensor must make this test FAIL. Precondition:
    water must actually flow during the test, otherwise the result is INVALID.
    """
    trace = []
    d.command_flow(0.7, 60.0)
    max_true = dev.COLD_TEMP_C
    flow_integral = 0.0
    for _ in range(int(20.0 / 0.01)):
        d.tick(0.01)
        max_true = max(max_true, d.true_temp_c)
        flow_integral += d.flow_lpm() * 0.01
        if int(d.time_s * 100) % 20 == 0:
            _sample(d, trace)
    mean_flow = flow_integral / 20.0
    checks = [
        _precondition("Durchfluss während der Prüfung ≥ 1 l/min",
                      mean_flow >= 1.0, f"{mean_flow:.2f} l/min"),
        _check("max. Auslauftemperatur (Rig-Referenz) [°C]", max_true,
               dev.SCALD_LIMIT_C, "<=", unc=UNC_TEMP_K),
    ]
    return checks, trace


def proc_tightness(d):
    """T-P3a — stable 16 bar for 60 s; collect leakage volume with valve closed."""
    trace = []
    d.supply_pressure_bar = 16.0
    d.command_flow(0.0)
    pressure_samples = []
    leaked_ml = 0.0
    steps = int(60.0 / 0.05)
    for _ in range(steps):
        d.tick(0.05)
        pressure_samples.append(d.supply_pressure_bar)
        leaked_ml += d.flow_lpm() * 1000.0 * 0.05 / 60.0
        if int(d.time_s * 20) % 40 == 0:
            _sample(d, trace)
    held_s = round(steps * 0.05, 2)
    pressure_ok = (
        min(pressure_samples) - UNC_PRESSURE_BAR >= 15.8
        and max(pressure_samples) + UNC_PRESSURE_BAR <= 16.2
    )
    checks = [
        _precondition("Prüfdruck 16.0 ± 0.2 bar stabil",
                      pressure_ok,
                      f"{min(pressure_samples):.2f}…{max(pressure_samples):.2f} bar, U={UNC_PRESSURE_BAR}"),
        _check("Prüfdauer [s]", held_s, 60.0, ">="),
        _check("gesammeltes Leckvolumen bei 16 bar [ml]", leaked_ml, 0.5, "<=",
               unc=UNC_VOLUME_ML),
    ]
    return checks, trace


def proc_ble_pairing(d):
    """T-P4a — app pairing < 30 s, encrypted; setpoint parametrisation 38–45 °C.

    Device-tier connectivity is BLE + app only (RED 2014/53 illustrative);
    building-automation/GLT integration lives on the system controller.
    """
    res = d.pair_ble()
    in_range = d.app_parametrise(41.0)
    out_of_range = d.app_parametrise(52.0)
    return [
        _check("Kopplungszeit [s]", res["seconds"], 30.0, "<=", unc=0.5),
        _check("Verschlüsselung aktiv", 1 if res["encrypted"] else 0, 1, "=="),
        _check("Sollwert 41 °C (im Nutzerbereich) übernommen [°C]",
               in_range["applied"], 41.0, "=="),
        _check("Sollwert 52 °C auf Nutzerbereichs-Maximum begrenzt [°C]",
               out_of_range["applied"], dev.USER_SETPOINT_MAX_C, "<="),
    ], []


def proc_hygiene_flush(d):
    """T-S1a — 25 h stagnation must trigger ≥ 1 flush with real delivered volume."""
    d.fast_forward_stagnation(25.0)
    flushes = len(d.flush_events)
    volume = sum(e["volume_l"] for e in d.flush_events)
    return [
        _check("Spülungen nach 25 h Stagnation", flushes, 1, ">="),
        _check("abgegebenes Spülvolumen [l]", volume, 1.0, ">=", unc=0.05),
    ], []


def proc_thermal_disinfection(d):
    """T-S2a — disinfection mode holds ≥ 70 °C for ≥ 180 s."""
    trace = []
    d.start_disinfection()
    time_above_70 = 0.0
    for _ in range(int(400.0 / 0.05)):
        d.tick(0.05)
        if d.true_temp_c - UNC_TEMP_K >= 70.0:
            time_above_70 += 0.05
        if int(d.time_s * 20) % 100 == 0:
            _sample(d, trace)
        if time_above_70 >= 200.0:
            break
    d.stop_disinfection()
    return [_check("Haltezeit ≥ 70 °C [s]", time_above_70, 180.0, ">=", unc=1.0)], trace


# ------------------------------------------------- system-tier procedures
# These run against the simulated AC-64S controller rig (controller.py), not
# against a single faucet: multiple flush-point nodes on a simulated
# Ethernet/IP link, central config, hash-chained event log, Störmeldungen,
# GLT integration.

def proc_glt_telegram(s):
    """T-S4a — controller GLT telegram every ≤ 60 s, system payload complete.

    Building-automation (GLT) integration lives at the CONTROLLER tier: the
    telegram aggregates node availability, alarms and worst-case stagnation.
    """
    s.run_glt(125.0)
    times = [t["t"] for t in s.glt_telegrams]
    intervals = ([times[0]] if times else []) + [b - a for a, b in zip(times, times[1:])]
    max_interval = max(intervals) if intervals else 999.0
    payload_ok = all(
        {"t", "nodes_total", "nodes_ok", "alarms"} <= set(t) for t in s.glt_telegrams
    )
    return [
        _check("max. Telegrammintervall [s]", max_interval, 60.0, "<=", unc=0.05),
        _check("Payload vollständig (Systemzustand)",
               1 if (payload_ok and len(s.glt_telegrams) >= 2) else 0, 1, "=="),
    ], []


def proc_coordinated_flush(s):
    """T-S5a — cross-node stagnation ⇒ coordinated hygiene flush (all nodes).

    The rig preconditions every node to > 24 h stagnation; the controller must
    detect it across the fleet and flush ALL nodes with real delivered volume,
    staggered (never in parallel), logging every command tamper-proof. A node
    lost on the Ethernet/IP link makes this FAIL in the coverage check while
    the safe-degradation checks (Störmeldung raised, reachable nodes still
    flushed) stay green — degradation is safe, but the requirement is not met.
    """
    for n in s.nodes:
        n.device.stagnation_h = 25.5  # rig preconditioning (water sat > 24 h)
    res = s.coordinated_flush()
    volumes = [f["volume_l"] for f in res["flushed"]]
    max_concurrent = 0
    for a in res["schedule"]:
        overlap = sum(1 for b in res["schedule"]
                      if b["start_s"] < a["end_s"] and b["end_s"] > a["start_s"])
        max_concurrent = max(max_concurrent, overlap)
    unreported = sum(
        1 for nid in res["unreachable"]
        if not any(m["node"] == nid for m in s.stoermeldungen)
    )
    checks = [
        _precondition("alle Knoten vorkonditioniert (Stagnation > 24 h)", True,
                      f"{len(s.nodes)} Knoten, 25.5 h"),
        _check("gespülte Knoten (Soll: alle mit Stagnation)",
               len([v for v in volumes if v >= 1.0]), len(s.nodes), ">="),
        _check("min. Spülvolumen je gespültem Knoten [l]",
               min(volumes) if volumes else 0.0, 1.0, ">=", unc=0.05),
        _check("max. gleichzeitige Spülungen (Staffelung)", max_concurrent, 1, "<="),
        _check("nicht erreichbare Knoten ohne Störmeldung", unreported, 0, "<="),
        _check("Ereignisse manipulationssicher protokolliert",
               1 if s.log.verify()["ok"] else 0, 1, "=="),
    ]
    return checks, []


def proc_log_integrity(s):
    """T-S6a — tamper-proof central log: hash chain valid; manipulation detected.

    Generates representative controller activity, verifies the chain, then
    manipulates one entry in a copy — verification must fail and locate the
    manipulated entry. An audit log that cannot prove its own integrity is
    just a text file.
    """
    s.heartbeat_check()
    for n in s.nodes:
        n.device.stagnation_h = 25.0
    s.coordinated_flush()
    v = s.log.verify()
    checks = [
        _precondition("Protokoll enthält repräsentative Aktivität (≥ 5 Einträge)",
                      v["entries"] >= 5, f"{v['entries']} Einträge"),
        _check("Hash-Kette über alle Einträge gültig",
               1 if v["ok"] else 0, 1, "=="),
    ]
    tampered = copy.deepcopy(s.log)
    idx = len(tampered.entries) // 2
    tampered.entries[idx]["payload"] = {"manipuliert": True}
    tv = tampered.verify()
    checks.append(_check("Manipulation eines Eintrags wird erkannt",
                         0 if tv["ok"] else 1, 1, "=="))
    checks.append(_check("manipulierter Eintrag korrekt lokalisiert [seq]",
                         tv["first_bad_seq"], idx, "=="))
    return checks, []


def proc_comm_robustness(s):
    """T-S7a — controller↔node link supervision (heartbeat + Störmeldung).

    Every node must answer the heartbeat within the latency limit; any node
    that does not answer must be reported via Störmeldung (no silent loss).
    Under `eth_link_loss` the availability check fails while the detection
    check stays green — the loss is caught and reported.
    """
    results = s.heartbeat_check()
    ok = [r for r in results if r["ok"]]
    max_latency = max((r["latency_ms"] for r in ok), default=999.0)
    unreported = sum(
        1 for r in results
        if not r["ok"] and not any(m["node"] == r["node"] for m in s.stoermeldungen)
    )
    return [
        _check("Knoten mit Heartbeat-Antwort", len(ok), len(s.nodes), ">="),
        _check("max. Antwortlatenz [ms]", max_latency, ctl.HEARTBEAT_LIMIT_MS,
               "<=", unc=0.5),
        _check("ausgefallene Knoten ohne Störmeldung", unreported, 0, "<="),
    ], []


def proc_config_sync(s):
    """T-S8a — distributed config replicas consistent with the central version.

    Precondition: every node must be reachable for the audit (an audit that
    cannot see a node is INVALID, not passed). A stale replica (`db_sync_lag`)
    must be detected and reported via Störmeldung.
    """
    rep = s.audit_config_sync()
    n_total = len(s.nodes)
    unflagged_stale = sum(
        1 for st in rep["stale"]
        if not any(m["node"] == st["node"] and m["code"] == "DB-SYNC"
                   for m in s.stoermeldungen)
    )
    checks = [
        _precondition("alle Knoten für Konfigurations-Audit erreichbar",
                      not rep["unreachable"],
                      f"{n_total - len(rep['unreachable'])}/{n_total} erreichbar"),
        _check("Knoten mit aktueller Konfigurationsversion",
               len(rep["in_sync"]), n_total, ">="),
        _check("veraltete Replikate ohne Störmeldung", unflagged_stale, 0, "<="),
    ]
    return checks, []


PROCEDURES = {
    "T-C1a": proc_sensor_calibration,
    "T-C2a": proc_valve_switching,
    "T-C3a": proc_sleep_current,
    "T-C5a": proc_flow_pressure_plausibility,
    "T-P1a": proc_flow_regulation,
    "T-P2a": proc_scald_protection,
    "T-P3a": proc_tightness,
    "T-P4a": proc_ble_pairing,
    "T-S1a": proc_hygiene_flush,
    "T-S2a": proc_thermal_disinfection,
    "T-S4a": proc_glt_telegram,
    "T-S5a": proc_coordinated_flush,
    "T-S6a": proc_log_integrity,
    "T-S7a": proc_comm_robustness,
    "T-S8a": proc_config_sync,
}

# Cases that run on the system rig (AC-64S controller + nodes) instead of a
# single faucet DUT.
SYSTEM_CASES = frozenset({"T-S4a", "T-S5a", "T-S6a", "T-S7a", "T-S8a"})


def execute(test_case_id: str, fault: str = "none") -> dict:
    """Run one procedure on a fresh rig (optionally faulted).

    Device-tier cases get a fresh `FaucetDevice`; system-tier cases get a
    fresh `SystemController` with its flush-point nodes. Fault injection is
    tier-scoped: a device fault leaves the system rig healthy and vice versa
    (each tier's rig tests its own DUT).

    Status semantics: `invalid` if any precondition is unfulfilled (the test
    could not exercise the DUT as specified), else `failed` if any acceptance
    check misses its guard-banded limit, else `passed`.
    """
    fault = fault or "none"
    if fault not in ALL_FAULTS:
        raise ValueError(f"unknown fault: {fault}")
    proc = PROCEDURES[test_case_id]
    if test_case_id in SYSTEM_CASES:
        rig = ctl.SystemController(fault=fault)
        checks, trace = proc(rig)
    else:
        d = dev.FaucetDevice()
        if fault in dev.FAULTS and fault != "none":
            d.inject_fault(fault)
        checks, trace = proc(d)
    precond_ok = all(c["passed"] for c in checks if c.get("precondition"))
    accepts_ok = all(c["passed"] for c in checks if not c.get("precondition"))
    if not precond_ok:
        status = "invalid"
    elif not accepts_ok:
        status = "failed"
    else:
        status = "passed"
    if len(trace) > 120:
        step = len(trace) // 120 + 1
        trace = trace[::step]
    return {"status": status, "checks": checks, "trace": trace, "fault": fault}
