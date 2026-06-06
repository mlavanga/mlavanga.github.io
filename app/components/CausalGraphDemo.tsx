'use client';

import { useState } from 'react';
import { causalNodes, causalLinks, causalCaption } from '../data/causalDemo';

// Fixed layout — causal flow reads left→right: Activity → (Respiration / Heart Rate) → SpO₂
const POS: Record<string, { x: number; y: number }> = {
  ACT: { x: 80, y: 180 },
  RR: { x: 230, y: 80 },
  HR: { x: 230, y: 280 },
  SpO2: { x: 400, y: 180 },
};
const R = 36; // node radius

function edgePath(from: string, to: string, curve: boolean) {
  const a = POS[from];
  const b = POS[to];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  // start/end offset to the node rims (leave room for the arrowhead)
  const sx = a.x + ux * R;
  const sy = a.y + uy * R;
  const ex = b.x - ux * (R + 6);
  const ey = b.y - uy * (R + 6);
  if (!curve) return `M ${sx} ${sy} L ${ex} ${ey}`;
  // bow the long ACT→SpO₂ link downward so it doesn't cross the hubs
  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2 + 95;
  return `M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`;
}

export default function CausalGraphDemo() {
  const [active, setActive] = useState<string | null>(null);

  const isDimmed = (l: { from: string; to: string }) =>
    active !== null && l.from !== active && l.to !== active;

  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-900 dark:text-white">Causal discovery on biosignals</h3>
        <span className="text-[11px] font-medium px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
          PCMCI · precomputed
        </span>
      </div>

      <svg
        viewBox="0 0 480 360"
        className="w-full h-auto"
        role="img"
        aria-label="Causal graph: Activity drives Heart Rate and Respiration; Respiration and Heart Rate drive SpO2."
      >
        <defs>
          <marker id="arrow-pos" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#0d9488" />
          </marker>
          <marker id="arrow-neg" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#e11d48" />
          </marker>
        </defs>

        {/* edges */}
        {causalLinks.map((l, i) => {
          const curve = l.from === 'ACT' && l.to === 'SpO2';
          const color = l.sign === 1 ? '#0d9488' : '#e11d48';
          const mid = {
            x: (POS[l.from].x + POS[l.to].x) / 2,
            y: (POS[l.from].y + POS[l.to].y) / 2 + (curve ? 60 : -6),
          };
          return (
            <g key={i} opacity={isDimmed(l) ? 0.12 : 1} className="transition-opacity">
              <path
                d={edgePath(l.from, l.to, curve)}
                fill="none"
                stroke={color}
                strokeWidth={1.5 + l.strength * 7}
                strokeLinecap="round"
                markerEnd={`url(#${l.sign === 1 ? 'arrow-pos' : 'arrow-neg'})`}
              >
                <title>
                  {`${causalNodes.find((n) => n.id === l.from)?.label} → ${causalNodes.find((n) => n.id === l.to)?.label} · lag ${l.lag} · ${l.sign === 1 ? '+' : '−'}${l.strength.toFixed(2)}`}
                </title>
              </path>
              <text x={mid.x} y={mid.y} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize="11" fontWeight="600">
                τ={l.lag}
              </text>
            </g>
          );
        })}

        {/* nodes */}
        {causalNodes.map((n) => {
          const p = POS[n.id];
          const focused = active === n.id;
          return (
            <g
              key={n.id}
              tabIndex={0}
              role="button"
              aria-label={`${n.label} (${n.unit}), self-correlation ${n.autoLag}`}
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
              <text x={p.x} y={p.y - 2} textAnchor="middle" fontSize="13" fontWeight="700" className={focused ? 'fill-white' : 'fill-slate-900 dark:fill-white'}>
                {n.label}
              </text>
              <text x={p.x} y={p.y + 14} textAnchor="middle" fontSize="10" className={focused ? 'fill-blue-100' : 'fill-slate-500 dark:fill-slate-400'}>
                {n.unit}
              </text>
            </g>
          );
        })}
      </svg>

      {/* legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2 mb-3">
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-1 rounded bg-teal-600" /> positive link</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-1 rounded bg-rose-600" /> negative link</span>
        <span>τ = time lag · thickness = strength</span>
        <span className="hidden sm:inline">hover a node to isolate its links</span>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{causalCaption}</p>
    </div>
  );
}
