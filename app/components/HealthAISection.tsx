import Link from 'next/link';
import { ProjectItem } from '../data/content';
import CausalGraphDemo from './CausalGraphDemo';

interface Positioning { headline: string; subline: string; }
interface TrustSignals { citations: number; hIndex: number; i10Index: number; firstAuthorPapers: number; note: string; }

export default function HealthAISection({
  positioning,
  selectedWork,
  trust,
}: {
  positioning: Positioning;
  selectedWork: ProjectItem[];
  trust: TrustSignals;
}) {
  return (
    <section id="health-ai" className="py-20 bg-slate-50 dark:bg-slate-800/30">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white relative inline-block">
          Health AI
          <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-blue-500 rounded-full"></span>
        </h2>

        <p className="text-xl md:text-2xl font-semibold text-slate-800 dark:text-slate-100 max-w-3xl mt-6 leading-snug">
          What I actually do — and the evidence behind it.
        </p>
        <p className="text-base text-slate-600 dark:text-slate-300 max-w-3xl mt-3">
          {positioning.subline}
        </p>

        {/* trust signals */}
        <dl className="flex flex-wrap gap-x-8 gap-y-2 mt-6 text-slate-700 dark:text-slate-200">
          <Stat value={trust.citations.toLocaleString()} label="citations" />
          <Stat value={`${trust.hIndex}`} label="h-index" />
          <Stat value={`${trust.i10Index}`} label="i10-index" />
          <Stat value={`${trust.firstAuthorPapers}`} label="first-author papers" />
        </dl>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{trust.note}</p>

        <div className="grid lg:grid-cols-5 gap-8 mt-12 items-start">
          {/* selected work */}
          <div className="lg:col-span-3 grid sm:grid-cols-2 gap-5">
            {selectedWork.map((item, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-blue-500/50 hover:shadow-md transition-all flex flex-col"
              >
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex-grow">{item.description}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {item.tags.map((tag, idx) => (
                    <span key={idx} className="text-xs font-medium px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* precomputed causal-graph demo */}
          <div className="lg:col-span-2">
            <CausalGraphDemo />
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/health-lab" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30">
            Try the in-browser ECG classifier
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
          <Link href="/adme-lab" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-blue-600 text-blue-700 dark:text-blue-300 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
            Try the ADMET panel demo
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dd className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{value}</dd>
      <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
    </div>
  );
}
