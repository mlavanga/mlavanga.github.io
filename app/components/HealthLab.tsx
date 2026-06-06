'use client';

import { useEffect, useRef, useState } from 'react';
import embeddings from '../data/healthlab/embeddings.json';
import projection from '../data/healthlab/projection.json';
import samplesData from '../data/healthlab/samples.json';
import metrics from '../data/healthlab/metrics.json';

const ORT_VERSION = '1.20.1';
const CLASS_COLORS = ['#0d9488', '#e11d48', '#d97706', '#7c3aed', '#2563eb'];
const codes: string[] = embeddings.labels;                 // [NORM, MI, STTC, CD, HYP]
const names: string[] = embeddings.label_names;            // full names, same order

type Status = 'loading' | 'ready' | 'error';
const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

function project(feat: Float32Array): { x: number; y: number } {
  const { mean, components, min, range } = projection as {
    mean: number[]; components: number[][]; min: number[]; range: number[];
  };
  const out = [0, 0];
  for (let k = 0; k < 2; k++) {
    let s = 0;
    for (let j = 0; j < mean.length; j++) s += (feat[j] - mean[j]) * components[k][j];
    out[k] = (s - min[k]) / range[k];
  }
  return { x: Math.max(0, Math.min(1, out[0])), y: Math.max(0, Math.min(1, out[1])) };
}

// lead II (index 1) sparkline for display
function Sparkline({ lead }: { lead: number[] }) {
  const step = Math.max(1, Math.floor(lead.length / 120));
  const pts = lead.filter((_, i) => i % step === 0);
  const lo = Math.min(...pts), hi = Math.max(...pts);
  const d = pts.map((v, i) => `${(i / (pts.length - 1)) * 100},${24 - ((v - lo) / (hi - lo + 1e-6)) * 24}`).join(' ');
  return (
    <svg viewBox="0 0 100 24" className="w-full h-6" preserveAspectRatio="none">
      <polyline points={d} fill="none" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  );
}

export default function HealthLab() {
  const [status, setStatus] = useState<Status>('loading');
  const [active, setActive] = useState<number | null>(null);
  const [probs, setProbs] = useState<number[] | null>(null);
  const [live, setLive] = useState<{ x: number; y: number } | null>(null);
  const [infMs, setInfMs] = useState<number | null>(null);
  const sessionRef = useRef<unknown>(null);
  const ortRef = useRef<typeof import('onnxruntime-web') | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ort = await import('onnxruntime-web');
        ort.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;
        ort.env.wasm.numThreads = 1;
        const session = await ort.InferenceSession.create('/models/model.onnx', { executionProviders: ['wasm'] });
        if (cancelled) return;
        ortRef.current = ort; sessionRef.current = session; setStatus('ready');
      } catch (e) {
        console.error('ORT init failed', e);
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function runSample(i: number) {
    setActive(i);
    if (status !== 'ready' || !sessionRef.current || !ortRef.current) { setProbs(null); setLive(null); return; }
    const ort = ortRef.current;
    const sig = samplesData.samples[i].signal as number[][];           // (12, L)
    const leads = sig.length, L = sig[0].length;
    const flat = new Float32Array(leads * L);
    for (let c = 0; c < leads; c++) for (let t = 0; t < L; t++) flat[c * L + t] = sig[c][t];
    const t0 = performance.now();
    const input = new ort.Tensor('float32', flat, [1, leads, L]);
    // @ts-expect-error runtime session typing
    const out = await sessionRef.current.run({ signal: input });
    const logits = out['logits'].data as Float32Array;
    const feats = out['features'].data as Float32Array;
    setInfMs(Math.round(performance.now() - t0));
    setProbs(Array.from(logits).map(sigmoid));
    setLive(project(feats));
  }

  const trueCode = active !== null ? samplesData.samples[active].code : null;

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      {/* embedding scatter */}
      <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-slate-900 dark:text-white">Learned ECG feature space</h2>
          <span className={`text-[11px] font-medium px-2 py-1 rounded ${
            status === 'ready' ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
            : status === 'error' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
            : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'}`}>
            {status === 'ready' ? 'ONNX ready · in-browser' : status === 'error' ? 'inference offline' : 'loading model…'}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          {embeddings.points.length} PTB-XL test ECGs in the model&apos;s penultimate feature space (2-D),
          coloured by diagnosis. Click a recording → classified <em>live in your browser</em>.
        </p>
        <svg viewBox="0 0 100 100" className="w-full h-auto bg-slate-50 dark:bg-slate-900/40 rounded-lg" role="img" aria-label="2-D feature space of PTB-XL ECGs coloured by diagnostic superclass">
          {(embeddings.points as { x: number; y: number; label: number }[]).map((p, i) => (
            <circle key={i} cx={p.x * 96 + 2} cy={(1 - p.y) * 96 + 2} r="0.9"
              fill={CLASS_COLORS[p.label % CLASS_COLORS.length]} opacity={live ? 0.3 : 0.65} />
          ))}
          {live && (
            <g>
              <circle cx={live.x * 96 + 2} cy={(1 - live.y) * 96 + 2} r="3.2" fill="none" stroke="#0f172a" strokeWidth="1.2" className="dark:stroke-white" />
              <circle cx={live.x * 96 + 2} cy={(1 - live.y) * 96 + 2} r="1.8" fill="#0f172a" className="dark:fill-white" />
            </g>
          )}
        </svg>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-slate-500 dark:text-slate-400">
          {names.map((l, i) => (
            <span key={l} className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: CLASS_COLORS[i % CLASS_COLORS.length] }} />{l}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-5">
        {/* benchmark headline */}
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h2 className="font-bold text-slate-900 dark:text-white mb-1">PTB-XL superdiagnostic benchmark</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Reproducing Strodthoff et al. (2021), official test fold.</p>
          <div className="flex items-end gap-6">
            <div><div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{metrics.macro_auroc}</div><div className="text-[11px] text-slate-500 dark:text-slate-400">this model · macro-AUROC</div></div>
            <div><div className="text-2xl font-bold text-slate-500 dark:text-slate-400">{metrics.paper_macro_auroc}</div><div className="text-[11px] text-slate-500 dark:text-slate-400">paper</div></div>
          </div>
          <div className="mt-3 space-y-1">
            {Object.entries(metrics.per_class_auroc as Record<string, number>).map(([c, v], i) => (
              <div key={c} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: CLASS_COLORS[i % CLASS_COLORS.length] }} />
                <span className="w-44 text-slate-600 dark:text-slate-300">{(metrics.class_names as Record<string, string>)[c]}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* sample ECGs + live probabilities */}
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h2 className="font-bold text-slate-900 dark:text-white mb-1">Sample ECGs</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Real PTB-XL test recordings (lead II shown). {infMs !== null && status === 'ready' && (
              <span className="text-teal-700 dark:text-teal-400">last inference {infMs} ms.</span>
            )}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {samplesData.samples.map((s, i) => (
              <button key={i} onClick={() => runSample(i)}
                className={`text-left p-3 rounded-lg border transition-all ${active === i ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{s.label_name}</span>
                </div>
                <div className="text-blue-500/70 dark:text-blue-300/60"><Sparkline lead={(s.signal as number[][])[1]} /></div>
              </button>
            ))}
          </div>
          {probs && (
            <div className="mt-4 space-y-1">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Predicted probability (multi-label):</div>
              {probs.map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className={`w-44 ${codes[i] === trueCode ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>{names[i]}</span>
                  <span className="flex-1 h-2 rounded bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <span className="block h-full rounded" style={{ width: `${(p * 100).toFixed(0)}%`, background: CLASS_COLORS[i % CLASS_COLORS.length] }} />
                  </span>
                  <span className="w-10 text-right text-slate-700 dark:text-slate-200">{p.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          {status === 'error' && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">In-browser inference is unavailable here — the feature map above is precomputed and still valid.</p>
          )}
        </div>
      </div>
    </div>
  );
}
