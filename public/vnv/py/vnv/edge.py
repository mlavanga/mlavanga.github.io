"""Edge data collection and data-driven parameter optimisation.

An edge gateway sits next to the installed devices in the field, collects
operating telemetry (draw-off events, stagnation intervals, hygiene flushes,
water use) and feeds a fleet view plus *parameter recommendations* back to the
engineering side. This mirrors, in Viega's domain, the same capability the
candidate built at Hamilton (edge devices on ventilators collecting real
ventilation data to improve ventilation parameters).

The V&V tie-in is the point of the module: an optimisation proposal is a
*parameter change*, and a parameter change is only releasable after the
affected requirements are re-verified. Every recommendation therefore carries
the change-impact set from the requirement dependency graph — field data
closes the loop back into the verification plan instead of bypassing it.

Everything is deterministic (fixed 14-day usage schedules per device profile),
so numbers are reproducible in tests and CI. Fictional data.
"""

FLUSH_VOLUME_L = 1.5          # volume of one automatic hygiene flush
STAGNATION_LIMIT_H = 24.0     # DVGW W 551-style stagnation threshold
DAYS = 14                     # observation window

# The monitored fleet: three installed devices with distinct usage profiles.
# Draw-off schedule: weekday-hour pairs; `active_days` selects which of the
# 14 days see usage (0 = first Monday).
FLEET = [
    {
        "id": "EDGE-01",
        "location": "Bürogebäude, WC 2. OG",
        "profile": "regelmässig (Werktage)",
        "draw_hours": [7, 9, 12, 15, 17],
        "active_days": [d for d in range(DAYS) if d % 7 < 5],  # Mon-Fri
    },
    {
        "id": "EDGE-02",
        "location": "Hotelzimmer 314",
        "profile": "unregelmässig (Belegung wechselnd)",
        "draw_hours": [8, 21],
        "active_days": [0, 1, 4, 5, 6, 9, 10, 13],  # gaps of 2-3 days
    },
    {
        "id": "EDGE-03",
        "location": "Technikraum UG",
        "profile": "selten (Einzelentnahmen)",
        "draw_hours": [10],
        "active_days": [1, 6, 12],
    },
]


def _draw_events(dev_cfg):
    """All draw-off timestamps (hours since observation start), sorted."""
    events = []
    for day in dev_cfg["active_days"]:
        for hour in dev_cfg["draw_hours"]:
            events.append(day * 24.0 + hour)
    return sorted(events)


def _simulate_policy(draws, policy):
    """Walk the 14-day window and apply a flush policy.

    policy = "fixed_daily"      -> flush every day at 03:00 regardless of use
             "stagnation_based" -> flush once STAGNATION_LIMIT_H passes with no
                                   draw-off (the device firmware's native mode)
    Returns flush count, flush water, and the max stagnation any water sat in
    the line (both policies must keep it <= STAGNATION_LIMIT_H + epsilon).
    """
    end_h = DAYS * 24.0
    flushes = []
    max_stagnation = 0.0
    last_water_movement = 0.0

    if policy == "fixed_daily":
        flush_times = [d * 24.0 + 3.0 for d in range(1, DAYS + 1)]
        movements = sorted(draws + flush_times)
        for t in movements:
            max_stagnation = max(max_stagnation, t - last_water_movement)
            last_water_movement = t
        max_stagnation = max(max_stagnation, end_h - last_water_movement)
        flushes = flush_times
    elif policy == "stagnation_based":
        pending = sorted(draws)
        t = 0.0
        while t < end_h:
            next_draw = pending[0] if pending else end_h + 999.0
            due = last_water_movement + STAGNATION_LIMIT_H
            if next_draw <= due and next_draw <= end_h:
                max_stagnation = max(max_stagnation, next_draw - last_water_movement)
                last_water_movement = next_draw
                pending.pop(0)
                t = next_draw
            elif due <= end_h:
                flushes.append(due)
                max_stagnation = max(max_stagnation, STAGNATION_LIMIT_H)
                last_water_movement = due
                t = due
            else:
                max_stagnation = max(max_stagnation, end_h - last_water_movement)
                break
    else:
        raise ValueError(policy)

    return {
        "flushes": len(flushes),
        "flush_water_l": round(len(flushes) * FLUSH_VOLUME_L, 1),
        "max_stagnation_h": round(max_stagnation, 1),
    }


def fleet_telemetry():
    """Per-device telemetry summary over the observation window."""
    out = []
    for cfg in FLEET:
        draws = _draw_events(cfg)
        current = _simulate_policy(draws, "fixed_daily")
        daily_draws = [0] * DAYS
        for t in draws:
            daily_draws[int(t // 24)] += 1
        gaps = [b - a for a, b in zip(draws, draws[1:])] or [0.0]
        out.append(
            {
                "id": cfg["id"],
                "location": cfg["location"],
                "profile": cfg["profile"],
                "days": DAYS,
                "draw_offs": len(draws),
                "daily_draws": daily_draws,
                "max_draw_gap_h": round(max(gaps), 1),
                "policy": "fest täglich 03:00",
                "flushes": current["flushes"],
                "flush_water_l": current["flush_water_l"],
                "max_stagnation_h": current["max_stagnation_h"],
            }
        )
    return out


def recommendations(impact_fn=None):
    """Data-driven parameter proposals, each with its re-verification set.

    `impact_fn(requirement_id) -> impact dict` is injected (from engine.impact)
    so the recommendation carries exactly the tests that must be re-run before
    the changed parameter may be released.
    """
    recs = []
    for cfg in FLEET:
        draws = _draw_events(cfg)
        current = _simulate_policy(draws, "fixed_daily")
        proposed = _simulate_policy(draws, "stagnation_based")
        water_saved = round(current["flush_water_l"] - proposed["flush_water_l"], 1)
        if water_saved <= 0:
            continue
        recs.append(
            {
                "device": cfg["id"],
                "location": cfg["location"],
                "parameter": "Hygienespülung",
                "from": "fest täglich 03:00",
                "to": f"stagnationsbasiert ({STAGNATION_LIMIT_H:.0f} h ohne Entnahme)",
                "effect": {
                    "flush_water_saved_l_per_14d": water_saved,
                    "flushes_before": current["flushes"],
                    "flushes_after": proposed["flushes"],
                    "max_stagnation_before_h": current["max_stagnation_h"],
                    "max_stagnation_after_h": proposed["max_stagnation_h"],
                },
                "hygiene_guarantee_kept": proposed["max_stagnation_h"] <= STAGNATION_LIMIT_H + 0.1,
                "affects_requirements": ["R-S1"],
            }
        )

    # Long-stagnation device: propose an additional weekly thermal disinfection.
    for cfg in FLEET:
        draws = _draw_events(cfg)
        gaps = [b - a for a, b in zip(draws, draws[1:])] or [0.0]
        if max(gaps) > 72.0:
            recs.append(
                {
                    "device": cfg["id"],
                    "location": cfg["location"],
                    "parameter": "Thermische Desinfektion",
                    "from": "nur manuell",
                    "to": "automatisch wöchentlich (Nutzung < 1 Entnahme/72 h)",
                    "effect": {
                        "max_draw_gap_h": round(max(gaps), 1),
                        "rationale": "Langzeit-Stagnation über 72 h beobachtet",
                    },
                    "hygiene_guarantee_kept": True,
                    "affects_requirements": ["R-S2"],
                }
            )

    if impact_fn is not None:
        from . import seed_data

        # Change-board scope: besides everything DOWNSTREAM of the changed
        # requirement (impact graph), the direct UPSTREAM enablers must be
        # re-confirmed too — a new flush policy stresses the valve and the
        # flow regulation it relies on, not only the system behaviour itself.
        parents = {}
        for src, dsts in seed_data.REQUIREMENT_DEPS.items():
            for dst in dsts:
                parents.setdefault(dst, []).append(src)

        for rec in recs:
            retest = []
            affected = set()
            for rid in rec["affects_requirements"]:
                imp = impact_fn(rid)
                for r in imp["affected_requirements"]:
                    affected.add(r["id"])
                    retest.extend(t["id"] for t in r["retest"])
                for up in parents.get(rid, []):
                    up_imp = impact_fn(up)
                    direct = next(
                        (r for r in up_imp["affected_requirements"] if r["id"] == up), None
                    )
                    if direct:
                        affected.add(up)
                        retest.extend(t["id"] for t in direct["retest"])
            rec["reverify"] = {
                "requirements": sorted(affected),
                "tests": sorted(set(retest)),
            }
    return recs
