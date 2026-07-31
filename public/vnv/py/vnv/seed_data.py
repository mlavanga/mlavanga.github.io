"""Seed data for the V&V traceability demo.

Models the verification of a connected mechatronic Viega-style product line
(fictional model numbers, deliberately no real SKUs):

- **AquaSim SF-01** sensor faucet — a water-carrying device with a valve and
  temperature/pressure/volume-flow sensors (mechanics), a control PCB with a
  Bluetooth module (electronics), and firmware + a mobile app (software).
  Device-tier connectivity is BLE + app.
- **AquaSim AC-64S** system controller — networks the flush-point nodes over
  a simulated Ethernet/IP link, holds the central configuration and the
  tamper-proof (hash-chained) event log, raises Störmeldungen and integrates
  to the building automation (GLT).

Requirements sit at three verification levels (component / product / system),
each tied to the norm it satisfies and to one or more test cases. Automated
cases execute as HiL procedures against the simulated device in `device.py`
or the simulated system in `controller.py` (see `hil.py`); manual cases carry
lab results.

`REQUIREMENT_DEPS` is the dependency graph used for change-impact analysis:
when a requirement changes, everything downstream of it must be re-verified.

The data is intentionally realistic but fictional; it is here to demonstrate the
traceability structure, not to describe a real Viega product.
"""

# id, level, title, norm, owner
# Norm assignments are ILLUSTRATIVE (demo): plausibly mapped, clause-level
# applicability deliberately left to a standards owner. Swiss context (SVGW W3)
# is named alongside the German DVGW directives where both apply.
REQUIREMENTS = [
    ("R-C1", "component", "Temperatur-Sensor Genauigkeit ±0.5 °C (15–43 °C)", "Produktspezifikation (Referenzmesskette: IEC 60751)", "Sensorik"),
    ("R-C2", "component", "Magnetventil schaltet < 250 ms bei 0.5–10 bar", "EN 60730-2-8", "Aktorik"),
    ("R-C3", "component", "Steuer-PCB Betrieb 4.5–5.5 V, Ruhestrom < 50 µA", "Designspez. (EMV: IEC 61000-4)", "Elektronik"),
    ("R-C4", "component", "Bluetooth-Modul erfüllt Funk-Grenzwerte", "RED 2014/53/EU", "Elektronik"),
    ("R-C5", "component", "Durchfluss-/Drucksensor plausibel zur Rig-Referenz (±8 % / ±0.2 bar)", "Produktspezifikation (Sensorik: Temperatur/Druck/Durchfluss)", "Sensorik"),
    ("R-P1", "product", "Durchfluss regelbar 2–8 l/min, Toleranz ±10 %", "SN EN 15091", "Produkt"),
    ("R-P2", "product", "Verbrühschutz: Sicherheitsgrenze 43 °C (Werk 38 °C, Nutzer 38–45 °C)", "DIN EN 1111 / SN EN 15091", "Produkt"),
    ("R-P3", "product", "Dichtheit bei 16 bar über 60 s, Leckvolumen ≤ 0.5 ml", "SN EN 15091 (Dichtheit)", "Produkt"),
    ("R-P4", "product", "App-Kopplung < 30 s, verschlüsselt; Parametrierung 38–45 °C", "RED 2014/53/EU", "Software"),
    ("R-S1", "system", "Hygienespülung nach 24 h Stagnation automatisch (Knoten-lokal)", "DVGW W 551 / SVGW W3/E3", "System"),
    ("R-S2", "system", "Thermische Desinfektion hält 70 °C für 3 min", "DVGW W 551 / SVGW W3/E3", "System"),
    ("R-S3", "system", "Rückflussverhinderung schützt Trinkwasser", "EN 1717 / SVGW W3/E1", "System"),
    # Controller-tier (AquaSim AC-64S): GLT/Gebäudeautomation, koordinierte
    # Spülung, manipulationssichere Protokollierung, Kommunikation, DB-Sync.
    ("R-S4", "system", "GLT-Schnittstelle des Controllers meldet Anlagenzustand alle 60 s", "ISO 16484 (GLT)", "Controller"),
    ("R-S5", "system", "Koordinierte Hygienespülung aller Entnahmestellen bei Stagnation", "DVGW W 551 / SVGW W3/E3", "Controller"),
    ("R-S6", "system", "Manipulationssichere zentrale Ereignis-Protokollierung (Hash-Kette)", "TrinkwV (Dokumentationspflicht; illustrativ)", "Controller"),
    ("R-S7", "system", "Controller↔Knoten-Kommunikation überwacht; Ausfall ⇒ Störmeldung", "Designspez. (Ethernet/IP, Heartbeat)", "Controller"),
    ("R-S8", "system", "Zentrale Konfiguration konsistent auf allen Knoten (DB-Synchronisation)", "Designspez. (verteilte Datenhaltung)", "Controller"),
]

# Change-impact graph: requirement -> requirements that build on it.
# Example: the temperature sensor (R-C1) feeds the scald guard (R-P2) and the
# thermal disinfection (R-S2); the valve (R-C2) feeds flow regulation (R-P1),
# tightness (R-P3) and the hygiene flush (R-S1).
REQUIREMENT_DEPS = {
    "R-C1": ["R-P2", "R-S2"],
    "R-C2": ["R-P1", "R-P3", "R-S1"],
    "R-C3": ["R-P4"],
    "R-C4": ["R-P4"],
    "R-C5": ["R-P1", "R-P3"],
    "R-P1": ["R-S1"],
    "R-P2": ["R-S2"],
    # Controller tier: the coordinated flush (R-S5) builds on the node-local
    # flush capability (R-S1), on supervised communication (R-S7) and on a
    # consistent central configuration (R-S8); GLT reporting and DB sync also
    # ride on the supervised link.
    "R-S1": ["R-S5"],
    "R-S7": ["R-S4", "R-S5", "R-S8"],
    "R-S8": ["R-S5"],
}

# id, requirement_id, title, kind (automated|manual), suite
TEST_CASES = [
    ("T-C1a", "R-C1", "Sensor-Kalibrierung gegen Referenz-PT100 (Rig)", "automated", "hil"),
    ("T-C1b", "R-C1", "Drift über 8 h Dauerlauf im Klimaschrank", "manual", "lab"),
    ("T-C2a", "R-C2", "Schaltzeit-Messung über Druckbereich (HiL)", "automated", "hil"),
    ("T-C3a", "R-C3", "Ruhestrom-Messung Firmware-Sleep", "automated", "unit"),
    ("T-C3b", "R-C3", "EMV-Störfestigkeit Burst/Surge", "manual", "lab"),
    ("T-C4a", "R-C4", "Sendeleistung + Frequenzband konform", "manual", "lab"),
    ("T-C5a", "R-C5", "Durchfluss-/Druck-Plausibilität gegen Rig-Referenz (HiL)", "automated", "hil"),
    ("T-P1a", "R-P1", "Durchfluss-Regelung Sollwert-Rampe (HiL)", "automated", "hil"),
    ("T-P2a", "R-P2", "Verbrühschutz-Test mit unabhängiger Rig-Referenz", "automated", "hil"),
    ("T-P3a", "R-P3", "Dichtheitsprüfung 16 bar / 60 s (HiL)", "automated", "hil"),
    ("T-P4a", "R-P4", "App-Pairing + Parametrierung End-to-End (BLE-Mock)", "automated", "integration"),
    ("T-P4b", "R-P4", "Verschlüsselung Handshake Review", "manual", "review"),
    ("T-S1a", "R-S1", "Hygienespülung nach Stagnation (Zeitraffer)", "automated", "system"),
    ("T-S2a", "R-S2", "Thermische Desinfektion Halte-Zeit", "automated", "system"),
    ("T-S3a", "R-S3", "Rückfluss-Test mit Prüfstand", "manual", "lab"),
    ("T-S4a", "R-S4", "GLT-Telegramm des Controllers: Intervall + Payload", "automated", "integration"),
    ("T-S5a", "R-S5", "Koordinierte Spülung über 3 Knoten (Systemprüfstand)", "automated", "system"),
    ("T-S6a", "R-S6", "Log-Integrität: Hash-Kette + Manipulationserkennung", "automated", "system"),
    ("T-S7a", "R-S7", "Heartbeat-Überwachung + Ausfall-Störmeldung", "automated", "system"),
    ("T-S8a", "R-S8", "Konfigurations-Synchronisations-Audit", "automated", "system"),
    # Coverage gaps on purpose: R-C4 & R-S3 rely on manual tests only, and
    # T-S3a is blocked on the backflow rig — the dashboard must surface this.
]

# Manual test cases carry the last recorded outcome from the lab (a real system
# would read these from the lab management system / test reports).
MANUAL_RESULTS = {
    "T-C1b": "passed",
    "T-C3b": "passed",
    "T-C4a": "passed",
    "T-P4b": "passed",
    "T-S3a": "blocked",  # waiting on the backflow test rig — a real, visible gap
}
