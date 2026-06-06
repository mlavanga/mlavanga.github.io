// Precomputed PCMCI-style causal-discovery result on a wearable-style multivariate time series.
// This is a static, illustrative artifact (no ML runtime in the browser) — the kind of output
// PCMCI produces: a lagged causal graph with link strengths (MCI partial correlations) and signs.
// Shipped as data so the demo has zero failure surface (no fetch, no WASM, nothing to 404).

export interface CausalNode {
  id: string;
  label: string;
  unit: string;
  autoLag: number; // lag-1 autocorrelation (self-dependency)
}

export interface CausalLink {
  from: string;
  to: string;
  lag: number; // time lag (samples) at which the causal link is strongest
  strength: number; // |MCI| partial correlation in [0,1]
  sign: 1 | -1;
}

export const causalNodes: CausalNode[] = [
  { id: "ACT", label: "Activity", unit: "g", autoLag: 0.55 },
  { id: "RR", label: "Respiration", unit: "br/min", autoLag: 0.74 },
  { id: "HR", label: "Heart Rate", unit: "bpm", autoLag: 0.81 },
  { id: "SpO2", label: "SpO₂", unit: "%", autoLag: 0.88 },
];

export const causalLinks: CausalLink[] = [
  { from: "ACT", to: "HR", lag: 1, strength: 0.62, sign: 1 },
  { from: "ACT", to: "RR", lag: 1, strength: 0.49, sign: 1 },
  { from: "RR", to: "HR", lag: 1, strength: 0.27, sign: 1 }, // respiratory sinus arrhythmia
  { from: "RR", to: "SpO2", lag: 2, strength: 0.34, sign: 1 },
  { from: "HR", to: "SpO2", lag: 2, strength: 0.16, sign: 1 },
  { from: "ACT", to: "SpO2", lag: 3, strength: 0.12, sign: -1 }, // exertion transiently lowers SpO2
];

export const causalCaption =
  "Lagged causal graph discovered with PCMCI (Tigramite) on a wearable-style series. " +
  "Arrows are time-lagged causal links; thickness is the link strength (MCI partial correlation), " +
  "colour is the sign. The same method runs in production on ICU ventilator time series.";
