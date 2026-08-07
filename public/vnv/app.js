"use strict";

/* Dashboard logic — identical to static/app.js except for the transport:
 * instead of fetch()ing the HTTP API, requests go through window.vnvApi
 * (see bootstrap.js), which calls vnv.webapi.handle inside Pyodide. The
 * rendering, fault handling and click-throughs are unchanged. */

const LEVEL_LABEL = { component: "Komponente", product: "Produkt", system: "System" };
let allRows = [];

// Transport shim: same (status, body) contract as the HTTP server, no network.
function api(method, path, payload = null) {
  const res = window.vnvApi(method, path, payload === null ? null : JSON.stringify(payload));
  if (res.status >= 400) {
    const err = new Error(path + " -> " + res.status);
    err.status = res.status;
    throw err;
  }
  return res;
}

async function getJSON(path) {
  return JSON.parse(api("GET", path).body);
}

async function postJSON(path, payload) {
  return JSON.parse(api("POST", path, payload).body);
}

// Let the browser paint (button state, overlay) before a synchronous Python
// call blocks the main thread.
function nextPaint() {
  return new Promise((resolve) => setTimeout(resolve, 30));
}

function renderKpis(k) {
  const el = document.getElementById("kpis");
  const cards = [
    { label: "Anforderungen verifiziert", value: `${k.verified}/${k.requirements}` },
    { label: "Abdeckung", value: `${k.coverage_pct}%` },
    { label: "Testfälle ausgeführt", value: `${k.executed}/${k.test_cases}` },
    { label: "Pass-Rate", value: `${k.pass_rate_pct}%` },
    { label: "Offene Punkte", value: k.open_issues, alert: k.open_issues > 0 },
  ];
  el.innerHTML = cards
    .map(
      (c) =>
        `<div class="kpi${c.alert ? " alert" : ""}"><div class="value">${c.value}</div><div class="label">${c.label}</div></div>`
    )
    .join("");

  const lv = document.getElementById("levels");
  lv.innerHTML = ["component", "product", "system"]
    .map((name) => {
      const d = k.by_level[name];
      const pct = d.total ? Math.round((100 * d.verified) / d.total) : 0;
      return `<div class="level-card"><h3>${LEVEL_LABEL[name]}</h3>
        <div>${d.verified}/${d.total} verifiziert (${pct}%)</div>
        <div class="bar"><span style="width:${pct}%"></span></div></div>`;
    })
    .join("");
}

function renderMatrix(rows) {
  const tbody = document.querySelector("#matrix tbody");
  tbody.innerHTML = rows
    .map((r) => {
      const cases = r.cases
        .map(
          (c) =>
            `<span class="case"><a href="#" class="case-link" data-case="${c.id}" data-kind="${c.kind}" data-why="${encodeURIComponent(c.rationale || "")}"><code>${c.id}</code></a> ${c.title}
             <span class="kind">[${c.kind} · ${c.suite}]</span>
             <span class="pill ${c.status}">${c.status}</span></span>`
        )
        .join("");
      return `<tr>
        <td><a href="#" class="req-link" data-req="${r.id}"><code>${r.id}</code></a></td>
        <td class="level-tag">${LEVEL_LABEL[r.level]}</td>
        <td>${r.title}</td>
        <td>${r.norm}</td>
        <td>${r.owner}</td>
        <td>${cases}</td>
        <td><span class="pill ${r.verdict}">${r.verdict}</span></td>
      </tr>`;
    })
    .join("");

  tbody.querySelectorAll(".case-link").forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      showEvidence(a.dataset.case, a.dataset.kind, decodeURIComponent(a.dataset.why || ""));
    })
  );
  tbody.querySelectorAll(".req-link").forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      showImpact(a.dataset.req);
    })
  );
}

function applyFilter() {
  const f = document.getElementById("level-filter").value;
  renderMatrix(f === "all" ? allRows : allRows.filter((r) => r.level === f));
}

// ------------------------------------------------------------- detail panel

function openDetail(title, html) {
  document.getElementById("detail-title").textContent = title;
  document.getElementById("detail-body").innerHTML = html;
  document.getElementById("detail").classList.remove("hidden");
  document.getElementById("detail").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function sparkline(trace, signal, color) {
  const pts = trace
    .map(([t, row]) => [t, row[signal]])
    .filter(([, v]) => v !== undefined && v !== null);
  if (pts.length < 2) return "";
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const W = 420, H = 80, PAD = 6;
  const sx = (x) => PAD + ((x - xMin) / (xMax - xMin || 1)) * (W - 2 * PAD);
  const sy = (y) => H - PAD - ((y - yMin) / (yMax - yMin || 1)) * (H - 2 * PAD);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join(" ");
  return `<div class="trace"><span class="trace-label" style="color:${color}">${signal}</span>
    <svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Signalverlauf ${signal}">
      <path d="${d}" fill="none" stroke="${color}" stroke-width="1.6"/>
    </svg>
    <span class="trace-range">${yMin.toFixed(1)} … ${yMax.toFixed(1)}</span></div>`;
}

function whyBlock(why) {
  // A verdict without its justification is an opinion. Every case can say why
  // its method was chosen (see METHOD_RATIONALE / VNV_MATRIX.md).
  return why
    ? `<p class="why"><strong>Methodenwahl:</strong> ${why}</p>`
    : "";
}

async function showEvidence(caseId, kind, why) {
  if (kind === "manual") {
    openDetail(
      `Messnachweis ${caseId}`,
      whyBlock(why) +
        `<p>Manueller Testfall — das Ergebnis stammt im Demo aus einem fiktiven
         Laborbericht (Seed). In der Praxis: Verweis auf Prüfbericht, Prüfmittel
         und Prüfer aus dem Labor-/PLM-System.</p>`
    );
    return;
  }
  let payload;
  try {
    payload = await getJSON(`/api/evidence?case=${encodeURIComponent(caseId)}`);
  } catch (e) {
    openDetail(`Messnachweis ${caseId}`, `<p>Noch kein Lauf vorhanden — zuerst die HiL-Testsuite ausführen.</p>`);
    return;
  }
  const ev = payload.evidence;
  const checks = (ev.checks || [])
    .map(
      (c) =>
        `<tr><td>${c.name}</td><td>${c.measured}${c.unc ? ` ± ${c.unc}` : ""}</td><td>${c.op} ${c.limit}</td>
         <td><span class="pill ${c.passed ? "passed" : "failed"}">${c.passed ? "OK" : "FAIL"}</span></td></tr>`
    )
    .join("");
  const faultNote = ev.fault && ev.fault !== "none"
    ? `<p class="fault-note">Lauf mit Fehlerinjektion: <code>${ev.fault}</code></p>` : "";
  let traces = "";
  if (ev.trace && ev.trace.length > 1) {
    traces =
      dualTraceChart(ev.trace) +
      sparkline(ev.trace, "flow_lpm", "#166a9a");
  }
  openDetail(
    `Messnachweis ${caseId} — ${ev.status} (${ev.run_at})`,
    `${whyBlock(why)}${faultNote}
     <table class="checks"><thead><tr><th>Prüfung</th><th>Messwert ± U</th><th>Limit</th><th>Ergebnis</th></tr></thead>
     <tbody>${checks}</tbody></table>
     ${traces ? `<h3>Signalverlauf (Rig-Referenz vs. Gerätesensor)</h3>${traces}` : ""}`
  );
}

// Both temperature channels on ONE shared axis: the divergence between the
// rig reference (true_temp) and the device's own reading (reported_temp) is
// the demo's central point.
function dualTraceChart(trace) {
  const series = [
    { key: "true_temp", color: "#c8102e", label: "Rig-Referenz" },
    { key: "reported_temp", color: "#b45309", label: "Gerätesensor" },
  ];
  const all = [];
  for (const s of series) {
    s.pts = trace
      .map(([t, row]) => [t, row[s.key]])
      .filter(([, v]) => v !== undefined && v !== null);
    all.push(...s.pts);
  }
  if (all.length < 4) return "";
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const W = 420, H = 110, PAD = 6;
  const sx = (x) => PAD + ((x - xMin) / (xMax - xMin || 1)) * (W - 2 * PAD);
  const sy = (y) => H - PAD - ((y - yMin) / (yMax - yMin || 1)) * (H - 2 * PAD);
  const paths = series
    .filter((s) => s.pts.length > 1)
    .map(
      (s) =>
        `<path d="${s.pts.map((p, i) => `${i ? "L" : "M"}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join(" ")}"
          fill="none" stroke="${s.color}" stroke-width="1.8"/>`
    )
    .join("");
  const legend = series
    .map((s) => `<span class="trace-label" style="color:${s.color}">${s.label}</span>`)
    .join(" ");
  return `<div class="trace">${legend}
    <svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Temperaturverlauf Referenz vs. Gerät">${paths}</svg>
    <span class="trace-range">${yMin.toFixed(1)} … ${yMax.toFixed(1)} °C</span></div>`;
}

async function showImpact(reqId) {
  const imp = await getJSON(`/api/impact?req=${encodeURIComponent(reqId)}`);
  const rows = imp.affected_requirements
    .map(
      (r) =>
        `<tr class="${r.direct ? "direct" : ""}">
          <td><code>${r.id}</code>${r.direct ? " (geändert)" : ""}</td>
          <td>${LEVEL_LABEL[r.level]}</td><td>${r.title}</td>
          <td>${r.retest.map((t) => `<code>${t.id}</code>`).join(" ")}</td></tr>`
    )
    .join("");
  openDetail(
    `Change-Impact: ${reqId} ändert sich — was muss neu verifiziert werden?`,
    `<p><strong>${imp.affected_requirements.length}</strong> Anforderung(en) betroffen,
     <strong>${imp.tests_to_rerun}</strong> Testfälle neu auszuführen (Abhängigkeitsgraph, transitiv).</p>
     <table class="checks"><thead><tr><th>Anforderung</th><th>Ebene</th><th>Titel</th><th>neu zu testen</th></tr></thead>
     <tbody>${rows}</tbody></table>`
  );
}

// ------------------------------------------------------------- actions

async function refresh() {
  const [k, t] = await Promise.all([getJSON("/api/kpis"), getJSON("/api/traceability")]);
  renderKpis(k);
  allRows = t.requirements;
  applyFilter();
}

async function loadFaults() {
  const f = await getJSON("/api/faults");
  const sel = document.getElementById("fault-select");
  const opt = (name) =>
    `<option value="${name}"${name === f.active ? " selected" : ""}>${name === "none" ? "kein Fehler" : name}</option>`;
  if (f.device && f.system) {
    // two-tier fault injection: device faults hit the faucet DUT, system
    // faults hit the controller rig (Ethernet/IP link, DB sync)
    sel.innerHTML =
      opt("none") +
      `<optgroup label="Gerät (SF-01)">${f.device.map(opt).join("")}</optgroup>` +
      `<optgroup label="System (AC-64S)">${f.system.map(opt).join("")}</optgroup>`;
  } else {
    sel.innerHTML = f.available.map(opt).join("");
  }
}

async function setFault() {
  const fault = document.getElementById("fault-select").value;
  await postJSON("/api/fault", { fault });
}

async function runSuite() {
  const btn = document.getElementById("run-btn");
  const fault = document.getElementById("fault-select").value;
  btn.disabled = true;
  btn.textContent = "HiL-Suite läuft …";
  await nextPaint();
  try {
    const s = await postJSON("/api/run", { fault });
    await refresh();
    btn.textContent = `Fertig: ${s.passed}/${s.executed} bestanden${s.fault !== "none" ? ` (Fehler: ${s.fault})` : ""}`;
  } catch (e) {
    btn.textContent = "Fehler — erneut versuchen";
  } finally {
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = "HiL-Testsuite ausführen";
    }, 3000);
  }
}

// Static build: the report is generated by the in-browser Python core and
// downloaded client-side — same filename as the server's Content-Disposition.
async function downloadReport(e) {
  e.preventDefault();
  const res = api("GET", "/api/report");
  const blob = new Blob([res.body], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "verifikationsbericht.md";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ------------------------------------------------------------- edge module

function usageBars(daily) {
  const max = Math.max(...daily, 1);
  const W = 6, GAP = 2, H = 26;
  const bars = daily
    .map((v, i) => {
      const h = Math.max(1, Math.round((v / max) * (H - 2)));
      return `<rect x="${i * (W + GAP)}" y="${H - h}" width="${W}" height="${h}" fill="#166a9a"/>`;
    })
    .join("");
  return `<svg viewBox="0 0 ${daily.length * (W + GAP)} ${H}" width="${daily.length * (W + GAP)}" height="${H}" role="img" aria-label="Entnahmen pro Tag">${bars}</svg>`;
}

async function loadEdge() {
  const [fleet, recs] = await Promise.all([
    getJSON("/api/edge/fleet"),
    getJSON("/api/edge/recommendations"),
  ]);
  document.getElementById("edge-fleet").innerHTML = fleet.devices
    .map(
      (d) => `<div class="level-card">
        <h3>${d.id} · ${d.location}</h3>
        <div class="edge-profile">${d.profile} · ${d.days} Tage Beobachtung</div>
        ${usageBars(d.daily_draws)}
        <div class="edge-kpis">${d.draw_offs} Entnahmen · max. Lücke ${d.max_draw_gap_h} h<br>
        Politik: ${d.policy} → ${d.flushes} Spülungen, ${d.flush_water_l} l Spülwasser</div>
      </div>`
    )
    .join("");
  document.querySelector("#edge-recs tbody").innerHTML = recs.recommendations
    .map((r) => {
      const eff = r.effect.flush_water_saved_l_per_14d !== undefined
        ? `−${r.effect.flush_water_saved_l_per_14d} l Spülwasser/14 d (${r.effect.flushes_before}→${r.effect.flushes_after} Spülungen), max. Stagnation ${r.effect.max_stagnation_after_h} h`
        : `${r.effect.rationale} (max. Lücke ${r.effect.max_draw_gap_h} h)`;
      const rev = r.reverify
        ? `${r.reverify.requirements.map((x) => `<code>${x}</code>`).join(" ")} → ${r.reverify.tests.map((x) => `<code>${x}</code>`).join(" ")}`
        : "";
      return `<tr>
        <td><code>${r.device}</code><br><span class="kind">${r.location}</span></td>
        <td>${r.parameter}</td>
        <td>${r.from} → <strong>${r.to}</strong></td>
        <td>${eff}</td>
        <td><span class="pill ${r.hygiene_guarantee_kept ? "passed" : "failed"}">${r.hygiene_guarantee_kept ? "gewahrt" : "verletzt"}</span></td>
        <td>${rev}</td>
      </tr>`;
    })
    .join("");
}

function init() {
  document.getElementById("run-btn").addEventListener("click", runSuite);
  document.getElementById("level-filter").addEventListener("change", applyFilter);
  document.getElementById("fault-select").addEventListener("change", setFault);
  document.getElementById("detail-close").addEventListener("click", () =>
    document.getElementById("detail").classList.add("hidden")
  );
  document.getElementById("report-link").addEventListener("click", downloadReport);
  loadFaults();
  refresh();
  loadEdge();
}

// Wait for the Pyodide bootstrap; on failure the overlay shows the error.
window.vnvReady.then(init).catch(() => {});
