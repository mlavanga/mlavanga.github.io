'use client';

import { useState } from 'react';
import { causalNodes, causalLinks, causalMeta, causalCaption } from '../data/causalDemo';

// Triangle layout for the 3 signals (Respiration / PPG / ECG).
const POS: Record<string, { x: number; y: number }> = {
  RESP: { x: 240, y: 78 },
  PLETH: { x: 118, y: 288 },
  II: { x: 362, y: 288 },
};
const R = 40;
const BOW = 30; // perpendicular bow so A→B and B→A don't overlap

const fs = causalMeta.fs_hz || 10.42;
const ms = (lag: number) => Math.round((lag / fs) * 1000);

function geom(from: string, to: string) {
  const a = POS[from];
  const b = POS[to];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  // perpendicular (screen coords); flips with travel direction so opposing edges separate
  const px = -uy;
  const py = ux;
  const sx = a.x + ux * R + px * BOW * 0.25;
  const sy = a.y + uy * R + py * BOW * 0.25;
  const ex = b.x - ux * (R + 9) + px * BOW * 0.25;
  const ey = b.y - uy * (R + 9) + py * BOW * 0.25;
  const cx = (a.x + b.x) / 2 + px * BOW;
  const cy = (a.y + b.y) / 2 + py * BOW;
  // quadratic point at t=0.5 for the label
  const lx = 0.25 * sx + 0.5 * cx + 0.25 * ex;
  const ly = 0.25 * sy + 0.5 * cy + 0.25 * ey;
  return { d: `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`, lx, ly };
}

const label = (id: string) => causalNodes.find((n) => n.id === id)?.label ?? id;

export default function CausalGraphDemo() {
  const [active, setActive] = useState<string | null>(null);
  const dim = (l: { from: string; to: string }) =>
    active !== null && l.from !== active && l.to !== active;

  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-bold text-slate-900 dark:text-white">Causal discovery on biosignals</h3>
        <span className="text-[11px] font-medium px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
          PCMCI⁺ · real data
        </span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
        Discovered from {causalMeta.n_recordings} open recordings — Respiration, PPG and ECG.
      </p>

      <svg
        viewBox="0 0 480 360"
        className="w-full h-auto"
        role="img"
        aria-label="Causal graph discovered with PCMCI on respiration, PPG and ECG signals: PPG and ECG are bidirectionally coupled, respiration modulates PPG."
      >
        <defs>
          <marker id="cg-pos" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#0d9488" />
          </marker>
          <marker id="cg-neg" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#e11d48" />
          </marker>
        </defs>

        {causalLinks.map((l, i) => {
          const g = geom(l.from, l.to);
          const color = l.sign === 1 ? '#0d9488' : '#e11d48';
          return (
            <g key={i} opacity={dim(l) ? 0.12 : 1} className="transition-opacity">
              <path
                d={g.d}
                fill="none"
                stroke={color}
                strokeWidth={1.5 + l.strength * 14}
                strokeLinecap="round"
                strokeDasharray={l.directed ? undefined : '5 4'}
                markerEnd={l.directed ? `url(#${l.sign === 1 ? 'cg-pos' : 'cg-neg'})` : undefined}
              >
                <title>{`${label(l.from)} → ${label(l.to)} · lag ${ms(l.lag)} ms · ${l.sign === 1 ? '+' : '−'}${l.strength.toFixed(2)}`}</title>
              </path>
              <text x={g.lx} y={g.ly} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize="10.5" fontWeight="600">
                {ms(l.lag)}ms
              </text>
            </g>
          );
        })}

        {causalNodes.map((n) => {
          const p = POS[n.id];
          const focused = active === n.id;
          return (
            <g
              key={n.id}
              tabIndex={0}
              role="button"
              aria-label={`${n.label} (${n.unit})`}
              onMouseEnter={() => setActive(n.id)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(n.id)}
              onBlur={() => setActive(null)}
              className="cursor-pointer focus:outline-none"
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={R}
                className={`transition-colors ${focused ? 'fill-blue-600' : 'fill-slate-100 dark:fill-slate-700'}`}
                stroke={focused ? '#2563eb' : '#94a3b8'}
                strokeWidth={focused ? 3 : 1.5}
              />
              <text x={p.x} y={p.y - 1} textAnchor="middle" fontSize="14" fontWeight="700" className={focused ? 'fill-white' : 'fill-slate-900 dark:fill-white'}>
                {n.label}
              </text>
              <text x={p.x} y={p.y + 15} textAnchor="middle" fontSize="10" className={focused ? 'fill-blue-100' : 'fill-slate-500 dark:fill-slate-400'}>
                {n.unit}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2 mb-3">
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-1 rounded bg-teal-600" /> positive</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-1 rounded bg-rose-600" /> negative</span>
        <span>lag in ms · thickness = strength</span>
        <span className="hidden sm:inline">hover a node to isolate its links</span>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{causalCaption}</p>
    </div>
  );
}
