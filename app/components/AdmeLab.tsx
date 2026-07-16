'use client';

import { useEffect, useRef, useState } from 'react';
import panel from '../data/admelab/panel.json';
import ad from '../data/admelab/ad.json';
import examples from '../data/admelab/examples.json';

const ORT_VERSION = '1.20.1';
const RDKIT_SRC = 'https://unpkg.com/@rdkit/rdkit@2025.3.4-1.0.0/dist/RDKit_minimal.js';
const RDKIT_WASM = 'https://unpkg.com/@rdkit/rdkit@2025.3.4-1.0.0/dist/RDKit_minimal.wasm';

type Ep = {
  name: string; label: string; cat: string; task: 'reg' | 'clf'; metric: string;
  value: number; unit?: string; pos?: string; better: string; n_test: number;
  half_width?: number; coverage?: number; threshold?: number;
  mae?: number; spearman?: number; r2?: number; auroc?: number; auprc?: number;
};
const EPS = panel.endpoints as unknown as Ep[];
const CATS = ['Absorption', 'Distribution', 'Metabolism', 'Toxicity'];
type Status = 'loading' | 'ready' | 'error';

// optional reference model: ADMET-AI (Chemprop D-MPNN) served on Modal
const REF_URL = 'https://m-lavanga--adme-lab-dmpnn-web.modal.run';
const REF_MAP: Record<string, string> = {
  solubility_aqsoldb: 'Solubility_AqSolDB', lipophilicity_astrazeneca: 'Lipophilicity_AstraZeneca',
  caco2_wang: 'Caco2_Wang', hia_hou: 'HIA_Hou', bbb_martins: 'BBB_Martins', ppbr_az: 'PPBR_AZ',
  cyp3a4_veith: 'CYP3A4_Veith', cyp2d6_veith: 'CYP2D6_Veith', clearance_hepatocyte_az: 'Clearance_Hepatocyte_AZ',
  herg: 'hERG', ames: 'AMES', dili: 'DILI', ld50_zhu: 'LD50_Zhu',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global { interface Window { RDKit?: any; initRDKitModule?: any; } }

function loadRDKit(): Promise<unknown> {
  if (window.RDKit) return Promise.resolve(window.RDKit);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = RDKIT_SRC;
    s.onload = async () => {
      try { window.RDKit = await window.initRDKitModule({ locateFile: () => RDKIT_WASM }); resolve(window.RDKit); }
      catch (e) { reject(e); }
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// SMILES -> {vec: Float32Array(nbits), on: Set<number>} using RDKit-JS Morgan FP
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function featurize(RDKit: any, smiles: string) {
  const mol = RDKit.get_mol(smiles);
  if (!mol || !mol.is_valid()) { mol?.delete(); return null; }
  const bits = mol.get_morgan_fp(JSON.stringify({ radius: ad.radius, nBits: ad.n_bits }));
  mol.delete();
  const vec = new Float32Array(ad.n_bits);
  const on = new Set<number>();
  for (let i = 0; i < bits.length; i++) if (bits[i] === '1') { vec[i] = 1; on.add(i); }
  return { vec, on };
}

function maxTanimoto(on: Set<number>): number {
  let best = 0;
  for (const ref of ad.ref as number[][]) {
    let inter = 0;
    for (const b of ref) if (on.has(b)) inter++;
    const uni = on.size + ref.length - inter;
    if (uni > 0) best = Math.max(best, inter / uni);
  }
  return best;
}

// illustrative developability cut-offs (rule-of-thumb); null = not scored
function favorable(ep: Ep, val: number): boolean | null {
  if (ep.task === 'clf') {
    if (ep.better === 'low') return val < (ep.threshold ?? 0.5);
    if (ep.better === 'high') return val >= (ep.threshold ?? 0.5);
    return null;
  }
  switch (ep.name) {
    case 'solubility_aqsoldb': return val > -4;
    case 'lipophilicity_astrazeneca': return val >= 1 && val <= 3;
    case 'caco2_wang': return val > -5.5;
    case 'ppbr_az': return val < 95;
    default: return null;
  }
}

type Res = { ep: Ep; out: number; fav: boolean | null };

export default function AdmeLab() {
  const [status, setStatus] = useState<Status>('loading');
  const [smiles, setSmiles] = useState('CC(=O)Oc1ccccc1C(=O)O');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [results, setResults] = useState<Res[] | null>(null);
  const [adSim, setAdSim] = useState<number | null>(null);
  const [scored, setScored] = useState('');
  const [refVals, setRefVals] = useState<Record<string, number> | null>(null);
  const [refBusy, setRefBusy] = useState(false);
  const [refMs, setRefMs] = useState<number | null>(null);
  const [refErr, setRefErr] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ortRef = useRef<any>(null);
  const rdkitRef = useRef<unknown>(null);
  const sessRef = useRef<Map<string, unknown>>(new Map());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [ort, RDKit] = await Promise.all([import('onnxruntime-web'), loadRDKit()]);
        ort.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;
        ort.env.wasm.numThreads = 1;
        if (cancelled) return;
        ortRef.current = ort; rdkitRef.current = RDKit; setStatus('ready');
      } catch (e) { console.error(e); if (!cancelled) setStatus('error'); }
    })();
    return () => { cancelled = true; };
  }, []);

  async function session(name: string) {
    const cache = sessRef.current;
    if (!cache.has(name)) {
      const ort = ortRef.current;
      cache.set(name, await ort.InferenceSession.create(`/models/adme/${name}.onnx`, { executionProviders: ['wasm'] }));
    }
    return cache.get(name);
  }

  async function predict(sm: string) {
    if (status !== 'ready') return;
    setBusy(true); setErr(null); setRefVals(null); setRefErr(null); setScored(sm.trim());
    try {
      const feat = featurize(rdkitRef.current, sm.trim());
      if (!feat) { setErr('Could not parse that SMILES.'); setResults(null); setBusy(false); return; }
      setAdSim(maxTanimoto(feat.on));
      const ort = ortRef.current;
      const out: Res[] = [];
      for (const ep of EPS) {
        const sess = await session(ep.name);
        const input = new ort.Tensor('float32', feat.vec, [1, ad.n_bits]);
        // @ts-expect-error runtime session typing
        const r = await sess.run({ input });
        const val = ep.task === 'reg'
          ? (r['variable'].data as Float32Array)[0]
          : (r['probabilities'].data as Float32Array)[1];
        out.push({ ep, out: val, fav: favorable(ep, val) });
      }
      setResults(out);
    } catch (e) { console.error(e); setErr('Inference failed.'); }
    setBusy(false);
  }

  async function fetchRef() {
    if (!scored) return;
    setRefBusy(true); setRefErr(null);
    const t0 = performance.now();
    try {
      const r = await fetch(`${REF_URL}/predict`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smiles: scored }),
      });
      const j = await r.json();
      const row = Object.values(j.predictions)[0] as Record<string, number>;
      const out: Record<string, number> = {};
      for (const ep of EPS) { const k = REF_MAP[ep.name]; if (k && k in row) out[ep.name] = row[k]; }
      setRefVals(out); setRefMs(Math.round(performance.now() - t0));
    } catch (e) { console.error(e); setRefErr('Reference API unavailable — a cold start can take ~30 s; try again.'); }
    setRefBusy(false);
  }

  function fmtRef(ep: Ep, v: number) {
    return ep.task === 'clf' ? `${(v * 100).toFixed(0)}%` : v.toFixed(2);
  }

  const adBadge = adSim === null ? null
    : adSim < ad.ood ? { t: 'out of domain', c: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' }
    : adSim < ad.borderline ? { t: 'borderline', c: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' }
    : { t: 'in domain', c: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' };

  const liabilities = results?.filter(r => r.ep.better === 'low' && r.fav === false).map(r => r.ep.label) ?? [];
  const favs = results?.filter(r => r.fav === true).map(r => r.ep.label) ?? [];

  return (
    <div className="space-y-6">
      {/* input */}
      <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-slate-900 dark:text-white">Enter a molecule (SMILES)</h2>
          <span className={`text-[11px] font-medium px-2 py-1 rounded ${
            status === 'ready' ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
            : status === 'error' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
            : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'}`}>
            {status === 'ready' ? 'RDKit + ONNX ready · in-browser' : status === 'error' ? 'offline' : 'loading RDKit + models…'}
          </span>
        </div>
        <div className="flex gap-2">
          <input value={smiles} onChange={e => setSmiles(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') predict(smiles); }}
            className="flex-1 font-mono text-sm px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100" />
          <button onClick={() => predict(smiles)} disabled={status !== 'ready' || busy}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50">
            {busy ? 'Scoring…' : 'Predict'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {examples.samples.map(s => (
            <button key={s.name} onClick={() => { setSmiles(s.smiles); predict(s.smiles); }}
              className="text-xs px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400">
              {s.name}
            </button>
          ))}
        </div>
        {err && <p className="text-xs text-rose-600 dark:text-rose-400 mt-2">{err}</p>}
      </div>

      {results && (
        <>
          {/* developability snapshot + AD */}
          <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-slate-900 dark:text-white">Developability snapshot</h2>
              {adBadge && (
                <span className={`text-[11px] font-medium px-2 py-1 rounded ${adBadge.c}`}>
                  applicability: {adBadge.t} (max Tanimoto {adSim!.toFixed(2)})
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {liabilities.length > 0
                ? <>Liabilities flagged: <strong>{liabilities.join(', ')}</strong>. </>
                : <>No liabilities flagged. </>}
              {favs.length > 0 && <>Favourable: {favs.join(', ')}.</>}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
              Illustrative rule-of-thumb flags; not a validated developability score. Out-of-domain
              predictions are unreliable regardless of value.
            </p>
          </div>

          {/* optional reference model served on Modal */}
          <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">Compare with a reference D-MPNN</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                  Fetch predictions from <strong>ADMET-AI</strong> (a Chemprop graph neural network, the TDC
                  leaderboard reference) served as a CPU API on <strong>Modal</strong>. Adds a{' '}
                  <span className="text-violet-600 dark:text-violet-300 font-mono">ref</span> value to each row.
                  {refMs !== null && <span className="text-teal-700 dark:text-teal-400"> Last call {refMs} ms.</span>}
                </p>
              </div>
              <button onClick={fetchRef} disabled={refBusy}
                className="px-4 py-2 rounded-lg border border-violet-500 text-violet-700 dark:text-violet-300 font-medium hover:bg-violet-50 dark:hover:bg-violet-900/20 disabled:opacity-50 whitespace-nowrap">
                {refBusy ? 'Querying…' : 'Query reference model'}
              </button>
            </div>
            {refErr && <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">{refErr}</p>}
            {refBusy && <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">First call may cold-start the container (~30 s).</p>}
          </div>

          {/* endpoint panel grouped by ADMET */}
          {CATS.map(cat => {
            const rows = results.filter(r => r.ep.cat === cat);
            if (!rows.length) return null;
            return (
              <div key={cat} className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white mb-3">{cat}</h3>
                <div className="space-y-2">
                  {rows.map(r => {
                    const ep = r.ep;
                    const call = r.out >= (ep.threshold ?? 0.5) ? `likely ${ep.pos ?? 'positive'}` : 'unlikely';
                    const pred = ep.task === 'reg'
                      ? `${r.out.toFixed(2)} ± ${ep.half_width?.toFixed(2)} ${ep.unit ?? ''}`
                      : `${(r.out * 100).toFixed(0)}% · ${call}`;
                    const dot = r.fav === true ? 'bg-teal-500' : r.fav === false ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-600';
                    const perf = ep.task === 'reg' ? `test MAE ${ep.mae}` : `test ${ep.metric.toUpperCase()} ${ep.value}`;
                    return (
                      <div key={ep.name} className="flex items-center gap-3 text-sm">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} title={r.fav === null ? 'not scored' : r.fav ? 'favourable' : 'liability / unfavourable'} />
                        <span className="flex-1 text-slate-700 dark:text-slate-200">{ep.label}</span>
                        <span className="font-mono text-slate-900 dark:text-white">{pred}</span>
                        {refVals && (
                          <span className="w-24 text-right font-mono text-[11px] text-violet-600 dark:text-violet-300"
                                title="ADMET-AI (Chemprop D-MPNN), served on Modal">
                            {ep.name in refVals ? `ref ${fmtRef(ep, refVals[ep.name])}` : ''}
                          </span>
                        )}
                        <span className="w-28 text-right text-[11px] text-slate-400 dark:text-slate-500">{perf}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* honest limitations */}
          <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p className="font-semibold text-slate-600 dark:text-slate-300">Reliability &amp; limitations</p>
            <p>Regression endpoints carry a split-conformal interval (~90% nominal coverage on the test set); per-endpoint test metrics are shown on each row and come from the TDC scaffold-split benchmark.</p>
            <p>ECFP + small-MLP baselines — deliberately not state-of-the-art. Hard/small endpoints (e.g. hepatocyte clearance, HIA) score weakly and are shown honestly, not hidden. A Chemprop D-MPNN would do better on those.</p>
            <p>Open data only (TDC ADMET Benchmark Group). Not a production ADMET model; no chirality/tautomer/formulation effects; the applicability-domain flag is similarity-based, not a guarantee.</p>
          </div>
        </>
      )}
    </div>
  );
}
