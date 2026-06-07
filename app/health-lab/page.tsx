import type { Metadata } from 'next';
import Link from 'next/link';
import HealthLab from '../components/HealthLab';
import Footer from '../components/Footer';
import { personalInfo } from '../data/content';

export const metadata: Metadata = {
  title: 'Health-AI Lab — PTB-XL ECG classifier in the browser | Mario Lavanga',
  description:
    'A 1-D CNN classifying 12-lead ECGs into the five PTB-XL diagnostic superclasses, reproducing the benchmark of Strodthoff et al. (2021) on open PhysioNet data — run live in your browser via ONNX Runtime Web.',
  alternates: { canonical: '/health-lab' },
};

export default function HealthLabPage() {
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
          Health-AI Lab
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white max-w-3xl">
          An ECG diagnostic classifier (PTB-XL), running in your browser
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mt-4 max-w-3xl leading-relaxed">
          A 1-D convolutional network that classifies 12-lead ECGs into the five{' '}
          <a href="https://physionet.org/content/ptb-xl/" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline">PTB-XL</a>{' '}
          diagnostic superclasses, reproducing the benchmark of{' '}
          <a href="https://doi.org/10.1109/JBHI.2020.3022989" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline">Strodthoff et al. (2021)</a>.
          Click a recording — it is classified <strong>live in your browser</strong> (ONNX Runtime Web).
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 max-w-3xl">
          Open PhysioNet data — PTB-XL (Wagner et al., <em>Sci. Data</em> 2020, CC-BY 4.0).
          Code:{' '}
          <a href="https://github.com/mlavanga/ecg-ptbxl" target="_blank" rel="noreferrer" className="font-mono text-blue-600 dark:text-blue-400 underline">github.com/mlavanga/ecg-ptbxl</a>.
        </p>

        <div className="mt-10">
          <HealthLab />
        </div>
      </section>

      <Footer info={personalInfo} />
    </main>
  );
}
