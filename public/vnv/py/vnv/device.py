"""Simulated device under test (DUT): a connected sensor faucet.

This is the demo's stand-in for a real mechatronic product — the fictional
**AquaSim SF-01** (an AquaVip-style sensor faucet; fictional model number, not
a real SKU) with water-carrying mechanics (mixing valve, flow path),
electronics (temperature/pressure/volume-flow sensors, control PCB, Bluetooth
module) and firmware (scald guard, hygiene flush, thermal disinfection).

Device tier only: the faucet speaks **BLE to the app** (pairing +
parametrisation, RED 2014/53 illustrative). Networking, GLT/building
automation, central logging and coordinated flushing live at the SYSTEM tier
on the controller (`controller.py`), not on the faucet.

Two design points matter for the V&V story:

1. The device reports its *own* sensor readings (`reported_temp`), while the
   test rig owns an *independent reference* measurement (`true_temp`). Faults
   like sensor drift make the two diverge — and only a rig with independent
   references can catch that. This mirrors how a real HiL rig verifies a
   device rather than trusting it.

2. Faults are injectable (`inject_fault`) so negative tests are first-class:
   the suite must *fail* in the right place when the device is broken.
"""
from dataclasses import dataclass, field
from math import sqrt


MODEL = "AquaSim SF-01"     # fictional model number (deliberately not a real SKU)

COLD_TEMP_C = 12.0
HOT_TEMP_C = 65.0
# Setpoint scheme (Viega-typical, illustrative): factory setting 38 °C,
# user-adjustable 38–45 °C via app, safety limit (scald guard) ~43 °C,
# thermal disinfection ≥ 70 °C hold (commanded 72 °C to hold above 70).
FACTORY_SETPOINT_C = 38.0
USER_SETPOINT_MIN_C = 38.0
USER_SETPOINT_MAX_C = 45.0
SCALD_LIMIT_C = 43.0
ALARM_LIMIT_C = 45.0
DISINFECTION_TEMP_C = 72.0
MAX_FLOW_LPM = 8.0
VALVE_TAU_S = 0.06          # valve actuation time constant
TEMP_TAU_S = 1.2            # mixing thermal time constant
SLEEP_CURRENT_UA = 41.0
PAIRING_TIME_S = 21.0

# Device-tier faults. System-tier faults (eth_link_loss, db_sync_lag) live in
# controller.SYSTEM_FAULTS; hil.ALL_FAULTS combines both for the selector.
FAULTS = (
    "none",
    "temp_sensor_drift",   # device temp sensor reads 3.5 K low
    "temp_sensor_gain",    # gain error: in-spec at the nominal point, out at range end
    "valve_stuck",         # actuator frozen: no flow, no flush volume
    "ble_pairing_slow",    # pairing takes 47 s instead of 21 s
    "seal_leak",           # worn seal: measurable leakage with the valve closed
    "flow_calibration",    # miscalibrated flow path: delivers only 85 % of nominal
)


@dataclass
class FaucetDevice:
    """Time-stepped simulation of the faucet + its firmware."""

    fault: str = "none"

    # actuator / plant state
    valve_target: float = 0.0       # 0..1 commanded opening
    valve_actual: float = 0.0       # 0..1 physical opening
    setpoint_c: float = FACTORY_SETPOINT_C  # mix setpoint (factory: 38 °C)
    true_temp_c: float = COLD_TEMP_C
    supply_pressure_bar: float = 3.0

    # firmware state
    disinfection_mode: bool = False
    alarm: bool = False
    stagnation_h: float = 0.0
    flush_events: list = field(default_factory=list)
    time_s: float = 0.0

    # ----------------------------------------------------------- commands
    def command_flow(self, opening: float, setpoint_c: float | None = None):
        self.valve_target = max(0.0, min(1.0, opening))
        if setpoint_c is not None:
            self.setpoint_c = setpoint_c

    def start_disinfection(self):
        self.disinfection_mode = True
        self.command_flow(0.5, DISINFECTION_TEMP_C)

    def stop_disinfection(self):
        self.disinfection_mode = False
        self.command_flow(0.0, FACTORY_SETPOINT_C)

    def sleep_current_ua(self) -> float:
        return SLEEP_CURRENT_UA

    def pair_ble(self) -> dict:
        t = PAIRING_TIME_S if self.fault != "ble_pairing_slow" else 47.0
        return {"seconds": t, "encrypted": True}

    def app_parametrise(self, setpoint_c: float) -> dict:
        """Setpoint parametrisation over the BLE app link (RED 2014/53,
        illustrative): the user setpoint is only accepted within the
        user-adjustable range 38–45 °C; out-of-range requests are clamped.
        Independently of the accepted setpoint, the firmware scald guard
        still caps the outlet at 43 °C outside disinfection mode."""
        applied = max(USER_SETPOINT_MIN_C, min(USER_SETPOINT_MAX_C, setpoint_c))
        self.setpoint_c = applied
        return {
            "requested": setpoint_c,
            "applied": applied,
            "accepted": abs(applied - setpoint_c) < 1e-9,
        }

    def inject_fault(self, name: str):
        if name not in FAULTS:
            raise ValueError(f"unknown fault: {name}")
        self.fault = name

    # ----------------------------------------------------------- firmware
    def _firmware_setpoint(self) -> float:
        """Scald guard: outside disinfection mode the mix setpoint is clamped.

        The clamp uses the DEVICE's own temperature reading — so a drifted
        sensor defeats it. That is deliberate: it is exactly the failure mode
        the independent rig reference in the scald test must catch.
        """
        if self.disinfection_mode:
            return self.setpoint_c
        return min(self.setpoint_c, SCALD_LIMIT_C)

    def reported_temp_c(self) -> float:
        """Device sensor model: offset + a small gain term.

        The healthy error grows with temperature (0.07 K at 15 °C, ~0.29 K at
        43 °C), so a multi-point calibration measures genuinely different
        values across the declared range. The `temp_sensor_gain` fault raises
        only the gain term: the sensor stays in spec near the calibration
        point but drifts out toward the range end — the classic failure a
        single-point check misses and a guard-banded multi-point check
        catches.
        """
        if self.fault == "temp_sensor_drift":
            return self.true_temp_c - 3.5
        gain = 0.0145 if self.fault == "temp_sensor_gain" else 0.008
        return self.true_temp_c + 0.15 + gain * (self.true_temp_c - 25.0)

    def flow_lpm(self) -> float:
        # flow scales with opening and (weakly) with supply pressure; the plant
        # has a small valve-authority nonlinearity, so regulation error is real
        # (just small) rather than zero by construction
        pressure_factor = min(1.0, 0.55 + 0.15 * self.supply_pressure_bar)
        authority = 1.0 - 0.03 * (1.0 - self.valve_actual)
        flow = self.valve_actual * MAX_FLOW_LPM * pressure_factor * authority
        if self.fault == "flow_calibration":
            flow *= 0.85
        if self.valve_actual < 0.01 and self.fault == "seal_leak":
            # Orifice-like leakage grows with sqrt(delta-p). At the 16 bar
            # tightness point this is 8 ml/min; at lower pressure it is less.
            return 0.002 * sqrt(max(self.supply_pressure_bar, 0.0))
        return flow

    def reported_flow_lpm(self) -> float:
        """Device volume-flow sensor (the SF-01 carries temperature, pressure
        and volume-flow sensors like its real-world archetype).

        Healthy: measures the true flow with a small gain error. Under the
        `flow_calibration` fault the mechanical flow path delivers only 85 %
        of nominal, but the sensor still converts with its stale calibration
        table — so it over-reports by ~18 % relative to the rig reference.
        Only a plausibility check against an independent reference catches
        that (T-C5a)."""
        true = self.flow_lpm()
        if self.fault == "flow_calibration":
            return true / 0.85 * 1.01
        return true * 1.01

    def reported_pressure_bar(self) -> float:
        """Device pressure sensor: true supply pressure plus a small offset."""
        return self.supply_pressure_bar + 0.03

    # ----------------------------------------------------------- simulation
    def tick(self, dt: float = 0.01):
        self.time_s += dt

        # valve dynamics (first order; stuck valve does not move)
        if self.fault != "valve_stuck":
            self.valve_actual += (self.valve_target - self.valve_actual) * dt / VALVE_TAU_S
            self.valve_actual = max(0.0, min(1.0, self.valve_actual))

        # thermal dynamics: when water flows, mix temp approaches the target
        # the firmware allows; the firmware regulates on the REPORTED temp.
        fw_set = self._firmware_setpoint()
        if self.flow_lpm() > 0.05:
            # control error as the firmware sees it (reported), applied to truth
            error_seen = fw_set - self.reported_temp_c()
            self.true_temp_c += error_seen * dt / TEMP_TAU_S
            self.true_temp_c = max(COLD_TEMP_C, min(HOT_TEMP_C + 10, self.true_temp_c))
            self.stagnation_h = 0.0
        else:
            # cool towards ambient, count stagnation
            self.true_temp_c += (20.0 - self.true_temp_c) * dt / 60.0
            self.stagnation_h += dt / 3600.0

        # firmware alarm: overtemperature (on reported temp) outside disinfection
        if not self.disinfection_mode and self.reported_temp_c() > ALARM_LIMIT_C:
            self.alarm = True
            self.valve_target = 0.0

        # hygiene flush after 24 h stagnation; delivered volume depends on the
        # valve actually moving (a stuck valve produces a zero-volume event).
        # This is the node-local fallback; the coordinated cross-node flush
        # lives on the system controller (controller.py).
        if self.stagnation_h >= 24.0:
            volume = 0.0 if self.fault == "valve_stuck" else 1.5
            self.flush_events.append({"t": self.time_s, "volume_l": volume})
            self.stagnation_h = 0.0

    def fast_forward_stagnation(self, hours: float, dt_h: float = 0.5):
        """Advance stagnation time cheaply (no water flowing)."""
        steps = int(hours / dt_h)
        for _ in range(steps):
            self.stagnation_h += dt_h
            self.time_s += dt_h * 3600.0
            if self.stagnation_h >= 24.0:
                volume = 0.0 if self.fault == "valve_stuck" else 1.5
                self.flush_events.append({"t": self.time_s, "volume_l": volume})
                self.stagnation_h = 0.0
