'use client';

import { useEffect, useRef, useState } from 'react';
import embeddings from '../data/healthlab/embeddings.json';
import projection from '../data/healthlab/projection.json';
import samplesData from '../data/healthlab/samples.json';
import metrics from '../data/healthlab/metrics.json';

const ORT_VERSION = '1.20.1';
const CLASS_COLORS = ['#0d9488', '#e11d48', '#d97706', '#7c3aed', '#2563eb'];
const labels: string[] = embeddings.labels;

type Pt = { x: number; y: number; label: number };
type Status = 'loading' | 'ready' | 'error';

// project a 128-d embedding into the precomputed 2-D space (same PCA the artifacts used)
function project(emb: Float32Array): { x: number; y: number } {
  const { mean, components, min, range } = projection as {
    mean: number[]; components: number[][]; min: number[]; range: number[];
  };
  const out = [0, 0];
  for (let k = 0; k < 2; k++) {
    let s = 0;
    for (let j = 0; j < mean.length; j++) s += (emb[j] - mean[j]) * components[k][j];
    out[k] = (s - min[k]) / range[k];
  }
  return { x: Math.max(0, Math.min(1, out[0])), y: Math.max(0, Math.min(1, out[1])) };
}

function Sparkline({ signal }: { signal: number[] }) {
  const step = Math.max(1, Math.floor(signal.length / 120));
  const pts = signal.filter((_, i) => i % step === 0);
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const d = pts
    .map((v, i) => `${(i / (pts.length - 1)) * 100},${24 - ((v - min) / (max - min + 1e-6)) * 24}`)
    .join(' ');
  return (
    <svg viewBox="0 0 100 24" className="w-full h-6" preserveAspectRatio="none">
      <polyline points={d} fill="none" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  );
}

export default function HealthLab() {
  const [status, setStatus] = useState<Status>('loading');
  const [active, setActive] = useState<number | null>(null);
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
        ort.env.wasm.numThreads = 1; // single-thread: no SharedArrayBuffer / COOP-COEP needed
        const session = await ort.InferenceSession.create('/models/encoder.onnx', {
          executionProviders: ['wasm'],
        });
        if (cancelled) return;
        ortRef.current = ort;
        sessionRef.current = session;
        setStatus('ready');
      } catch (e) {
        console.error('ORT init failed', e);
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function runSample(i: number) {
    setActive(i);
    const sample = samplesData.samples[i];
    if (status !== 'ready' || !sessionRef.current || !ortRef.current) {
      setLive(null); // fallback: scatter still shows; just no live point
      return;
    }
    const ort = ortRef.current;
    const sig = Float32Array.from(sample.signal);
    const t0 = performance.now();
    const input = new ort.Tensor('float32', sig, [1, 1, sig.length]);
    // @ts-expect-error runtime session typing
    const out = await sessionRef.current.run({ signal: input });
    const emb = out['embedding'].data as Float32Array;
    setInfMs(Math.round(performance.now() - t0));
    setLive(project(emb));
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      {/* embedding scatter */}
      <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-slate-900 dark:text-white">Learned ECG embedding space</h2>
          <span className={`text-[11px] font-medium px-2 py-1 rounded ${
            status === 'ready' ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
            : status === 'error' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
            : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'}`}>
            {status === 'ready' ? 'ONNX ready · in-browser' : status === 'error' ? 'inference offline' : 'loading model…'}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          {embeddings.points.length} open PTB-XL ECGs, encoded by the self-supervised model and
          projected to 2-D. Click a signal → it is encoded <em>live in your browser</em> and dropped in.
        </p>
        <svg viewBox="0 0 100 100" className="w-full h-auto bg-slate-50 dark:bg-slate-900/40 rounded-lg" role="img" aria-label="2-D scatter of learned ECG embeddings coloured by diagnostic superclass">
          {(embeddings.points as Pt[]).map((p, i) => (
            <circle key={i} cx={p.x * 96 + 2} cy={(1 - p.y) * 96 + 2} r="0.9"
              fill={CLASS_COLORS[p.label % CLASS_COLORS.length]} opacity={live ? 0.35 : 0.7} />
          ))}
          {live && (
            <g>
              <circle cx={live.x * 96 + 2} cy={(1 - live.y) * 96 + 2} r="3.2" fill="none" stroke="#0f172a" strokeWidth="1.2" className="dark:stroke-white" />
              <circle cx={live.x * 96 + 2} cy={(1 - live.y) * 96 + 2} r="1.8" fill="#0f172a" className="dark:fill-white" />
            </g>
          )}
        </svg>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-slate-500 dark:text-slate-400">
          {labels.map((l, i) => (
            <span key={l} className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: CLASS_COLORS[i % CLASS_COLORS.length] }} />{l}
            </span>
          ))}
        </div>
      </div>

      {/* samples + metrics */}
      <div className="space-y-5">
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h2 className="font-bold text-slate-900 dark:text-white mb-1">Sample ECGs</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Real PTB-XL recordings (one per diagnostic class). {infMs !== null && status === 'ready' && (
              <span className="text-teal-700 dark:text-teal-400">last inference {infMs} ms.</span>
            )}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {samplesData.samples.map((s, i) => (
              <button key={i} onClick={() => runSample(i)}
                className={`text-left p-3 rounded-lg border transition-all ${
                  active === i ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{s.label_name}</span>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: CLASS_COLORS[s.label % CLASS_COLORS.length] }} />
                </div>
                <div className="text-blue-500/70 dark:text-blue-300/60"><Sparkline signal={s.signal} /></div>
              </button>
            ))}
          </div>
          {status === 'error' && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
              In-browser inference is unavailable here, so the live point is hidden — the embedding map above is precomputed and still valid.
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h2 className="font-bold text-slate-900 dark:text-white mb-1">Downstream evaluation (LoRA)</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Beyond aggregate accuracy: calibration + subgroup slices — adapted with parameter-efficient LoRA.
          </p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <Metric label="accuracy" value={metrics.accuracy} />
            <Metric label="macro-AUROC" value={metrics.macro_auroc} />
            <Metric label="ECE" value={metrics.ece} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            {Object.entries(metrics.subgroups as Record<string, number>).map(([k, v]) => (
              <span key={k}>{k}: <span className="font-semibold text-slate-700 dark:text-slate-200">{v}</span></span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 dark:bg-slate-900/40 p-2 text-center">
      <div className="text-lg font-extrabold text-blue-600 dark:text-blue-400">{value}</div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}
