import type { Metadata } from 'next';
import Link from 'next/link';
import HealthLab from '../components/HealthLab';
import Footer from '../components/Footer';
import { personalInfo } from '../data/content';

export const metadata: Metadata = {
  title: 'Health-AI Lab — self-supervised ECG model (in-browser) | Mario Lavanga',
  description:
    'A small self-supervised transformer encoder trained on open PTB-XL ECG, adapted with LoRA, evaluated for calibration and subgroup robustness, and run live in your browser via ONNX.',
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
          A self-supervised ECG encoder, running in your browser
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mt-4 max-w-3xl leading-relaxed">
          A small transformer encoder, pretrained with masked-autoencoding on open{' '}
          <a href="https://physionet.org/content/ptb-xl/" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline">PTB-XL</a>{' '}
          ECG (CC-BY), adapted with <strong>LoRA</strong>, and evaluated for{' '}
          <strong>calibration and subgroup robustness</strong>. Click a sample below and it is
          encoded <strong>live in your browser</strong> (ONNX Runtime Web) — nothing is sent to a server.
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 max-w-3xl">
          This is a deliberately small, reproducible artifact trained on a 800-record subset on CPU —
          <strong> not a foundation model</strong>. Code:{' '}
          <span className="font-mono">github.com/mlavanga/biosignal-ssl</span>. A full-scale run
          (more data, GPU) is the next step; the pipeline is one command (<span className="font-mono">modal run</span>).
        </p>

        <div className="mt-10">
          <HealthLab />
        </div>
      </section>

      <Footer info={personalInfo} />
    </main>
  );
}
