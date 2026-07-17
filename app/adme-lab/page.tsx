import type { Metadata } from 'next';
import Link from 'next/link';
import AdmeLab from '../components/AdmeLab';
import Footer from '../components/Footer';
import { personalInfo } from '../data/content';

export const metadata: Metadata = {
  title: 'ADME Lab — multi-endpoint ADMET panel in the browser | Mario Lavanga',
  description:
    'A 13-endpoint ADMET panel (absorption, distribution, metabolism, toxicity) benchmarked on the Therapeutics Data Commons ADMET group: RDKit ECFP → per-endpoint models → ONNX, with conformal uncertainty and applicability-domain flags, run live in your browser via RDKit-JS + ONNX Runtime Web.',
  alternates: { canonical: '/adme-lab' },
};

export default function AdmeLabPage() {
  return (
    <main className="bg-slate-50 dark:bg-slate-900 min-h-screen">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
            ← Mario Lavanga
          </Link>
          <a href={personalInfo.cv} target="_blank" rel="noreferrer" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600">
            Download CV
          </a>
        </div>
      </header>

      <section className="container mx-auto px-6 py-12">
        <span className="inline-block px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-4">
          ADME Lab
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white max-w-3xl">
          A multi-endpoint ADMET panel, running in your browser
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mt-4 max-w-3xl leading-relaxed">
          Type any molecule (SMILES) → 13 ADME &amp; toxicity properties, each with{' '}
          <strong>uncertainty</strong> and an <strong>applicability-domain flag</strong>. Everything runs{' '}
          <strong>live in your browser</strong> (<a href="https://www.rdkit.org/" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline">RDKit</a> + ONNX, no server),
          benchmarked on the{' '}
          <a href="https://tdcommons.ai/benchmark/admet_group/overview/" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline">TDC ADMET</a> group.
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-3xl">
          A methods demo on open data — not a production model.{' '}
          <a href="https://github.com/mlavanga/adme-lab" target="_blank" rel="noreferrer" className="font-mono text-blue-600 dark:text-blue-400 underline">github.com/mlavanga/adme-lab</a>
        </p>

        <div className="mt-10">
          <AdmeLab />
        </div>
      </section>

      <Footer info={personalInfo} />
    </main>
  );
}
