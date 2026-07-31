"use strict";

/* Boots the REAL Python V&V core in the browser via Pyodide (WebAssembly).
 *
 * The same `vnv` package the local server imports is mounted into the Pyodide
 * filesystem (fetched from ./py/vnv/…, see manifest.json written by
 * web/build.sh), and `vnv.webapi.handle` — the single routing implementation
 * shared with vnv/server.py — is exposed as:
 *
 *     window.vnvApi(method, path, body) -> {status, body}
 *
 * `window.vnvReady` resolves once the API is usable; app.js waits for it.
 * Nothing here reimplements simulation logic in JavaScript.
 */

const PYODIDE_VERSION = "0.27.7"; // pinned; bump deliberately
const PYODIDE_BASE = "https://cdn.jsdelivr.net/pyodide/v" + PYODIDE_VERSION + "/full/";

function bootStatus(text) {
  const el = document.getElementById("boot-status");
  if (el) el.textContent = text;
}

function bootFailed(message) {
  const overlay = document.getElementById("boot-overlay");
  if (overlay) overlay.classList.add("failed");
  const el = document.getElementById("boot-status");
  if (el) {
    el.classList.add("boot-error");
    el.textContent =
      "Fehler beim Laden der Prüfumgebung: " + message +
      " — Bitte Seite neu laden (Internetverbindung erforderlich; Pyodide wird von cdn.jsdelivr.net geladen).";
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error("Skript nicht erreichbar: " + src));
    document.head.appendChild(s);
  });
}

async function fetchText(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(url + " -> HTTP " + resp.status);
  return resp.text();
}

window.vnvReady = (async () => {
  try {
    bootStatus("Python-Laufzeitumgebung (Pyodide " + PYODIDE_VERSION + ") wird geladen …");
    await loadScript(PYODIDE_BASE + "pyodide.js");
    const pyodide = await loadPyodide({ indexURL: PYODIDE_BASE });

    // sqlite3 is unvendored from the Pyodide stdlib distribution; the wheel is
    // served from the same pinned CDN directory (still a pure static setup).
    bootStatus("SQLite-Modul wird geladen …");
    await pyodide.loadPackage("sqlite3", { messageCallback: () => {} });

    bootStatus("V&V-Kern (Python-Module) wird eingerichtet …");
    const manifest = JSON.parse(await fetchText("./py/manifest.json"));
    pyodide.FS.mkdirTree("/app/vnv");
    const sources = await Promise.all(
      manifest.files.map(async (name) => [name, await fetchText("./py/vnv/" + name)])
    );
    for (const [name, code] of sources) {
      pyodide.FS.writeFile("/app/vnv/" + name, code);
    }

    bootStatus("Prüfumgebung wird initialisiert (Datenbank-Seed) …");
    const handle = pyodide.runPython(
      "import sys, json\n" +
      "sys.path.insert(0, '/app')\n" +
      "from vnv import webapi\n" +
      "def _handle(method, path, body):\n" +
      "    status, out = webapi.handle(method, path, body)\n" +
      "    return json.dumps({'status': status, 'body': out})\n" +
      "_handle"
    );
    window.vnvApi = (method, path, body = null) => JSON.parse(handle(method, path, body));

    // Self-test before declaring readiness — the core must really answer.
    const health = window.vnvApi("GET", "/api/health");
    if (health.status !== 200) throw new Error("Selbsttest fehlgeschlagen (Status " + health.status + ")");

    const overlay = document.getElementById("boot-overlay");
    if (overlay) overlay.classList.add("hidden");
  } catch (err) {
    console.error("V&V-Kern konnte nicht gestartet werden:", err);
    bootFailed(err && err.message ? err.message : String(err));
    throw err;
  }
})();
