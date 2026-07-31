import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '../components/Footer';
import { personalInfo } from '../data/content';

/* TODO: set repo URL before sharing — the demo repo has no git remote yet. */
const REPO_URL = 'https://github.com/mlavanga/REPLACE_ME';
const ACTIONS_URL = `${REPO_URL}/actions`;
const BADGE_URL = `${REPO_URL}/actions/workflows/ci.yml/badge.svg`;
/* TODO: set live deployment URL (Hugging Face Space / Render) once deployed. */
const LIVE_URL = 'https://REPLACE_ME.hf.space';

const repoReady = !REPO_URL.includes('REPLACE_ME');
const liveReady = !LIVE_URL.includes('REPLACE_ME');

export const metadata: Metadata = {
  title: 'V&V Traceability Cockpit — verification-engineering demo | Mario Lavanga',
  description:
    'A self-contained end-to-end verification system for a fictional connected sanitary device: simulated DUT, HiL procedures with an independent rig reference, fault injection, guard-banded acceptance, requirement-to-evidence traceability, change-impact analysis and a gated release recommendation.',
  alternates: { canonical: '/vnv/' },
  robots: { index: false, follow: false },
};

const architectureDiagram = `
 [ Device tier — DUT ]                    [ System-controller tier ]
   sensor-operated sanitary fitting        building-level controller
   mixing valve, temp/flow sensors         Ethernet/IP interface
   firmware, BLE + app interface           tamper-proof event logging
              |                                        |
              +-------------------+--------------------+
                                  v
 [ HiL rig (simulated) ]
   stimulates the DUT, samples signal traces
   judges against an INDEPENDENT reference measurement
   (the rig never trusts the device's own sensors)
   fault injection: the fault->outcome map is itself under test
   guard-banded acceptance: measured +/- U against the limit
   unmet preconditions -> verdict "invalid", never "passed"
                                  |
                                  v
 [ Evidence store ]
   requirement -> test case -> run -> evidence
   component / product / system level, norm per requirement
   change-impact graph: what must be re-verified after a change
                                  |
                                  v
 [ Verification report ]
   per-check measured values with declared uncertainty
   release recommendation gated on full, valid, passing coverage
`;

export default function VnvPage() {
  return (
    <main className="bg-slate-50 dark:bg-slate-900 min-h-screen">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
            ← Mario Lavanga
          </Link>
          <a
            href={personalInfo.cv}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600"
          >
            Download CV
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 py-12">
        <span className="inline-block px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-4">
          V&amp;V Traceability Cockpit
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white max-w-3xl">
          An end-to-end verification system, built as a working demo
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mt-4 max-w-3xl leading-relaxed">
          A self-contained verification stack for a fictional connected sanitary/water device. It
          simulates a two-tier device under test — a sensor-operated fitting with{' '}
          <strong>BLE and an app interface</strong>, plus a{' '}
          <strong>system controller with Ethernet/IP and tamper-proof logging</strong> — and runs{' '}
          <strong>HiL test procedures</strong> that judge acceptance against an{' '}
          <strong>independent rig reference measurement</strong>, not the device&apos;s own
          sensors. It covers <strong>fault injection</strong>, guard-banded acceptance with{' '}
          <strong>declared measurement uncertainty</strong>, an invalid-verdict discipline (a test
          that could not exercise the DUT returns <em>invalid</em>, never <em>passed</em>),
          requirement → test → evidence <strong>traceability</strong>,{' '}
          <strong>change-impact analysis</strong>, and a <strong>release recommendation</strong>{' '}
          that stays blocked while anything fails, is invalid or is not covered.
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 max-w-3xl">
          Fictional data, simulated device; norm assignments are illustrative.
        </p>
      </section>

      {/* Why it exists */}
      <section className="container mx-auto px-6 pb-12">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Why it exists</h2>
        <p className="text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
          This is a portfolio artefact for verification-engineering leadership: the craft of
          designing a <strong>test strategy at component, product and system level</strong> and
          making it auditable. Rather than describing that on a slide, the demo implements it —
          the requirement-to-procedure model <em>is</em> the verification plan, the test system
          itself is qualified through fault injection and an independent reference, and the
          release decision is derived from evidence instead of asserted. The deliberate gaps are
          part of the story: a blocked requirement and manual-only lab tests surface in the
          dashboard, and the report refuses release because of them.
        </p>
      </section>

      {/* Architecture */}
      <section className="container mx-auto px-6 pb-12">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Architecture</h2>
        <pre className="overflow-x-auto rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-5 text-xs md:text-sm leading-relaxed font-mono text-slate-700 dark:text-slate-300">
          {architectureDiagram.trim()}
        </pre>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 max-w-3xl">
          The V&amp;V core (device model, HiL procedures, verification engine) is separated from
          the HTTP transport, so it is unit-testable without a server. The store reseeds on boot:
          every start is a known baseline, and re-running the suite converges to the same verdicts
          for the same fault state.
        </p>
      </section>

      {/* CI/CD */}
      <section className="container mx-auto px-6 pb-12">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          CI/CD: verified test evidence on every push
        </h2>
        <p className="text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
          A GitHub Actions pipeline runs on every push and pull request: a{' '}
          <strong>compile check</strong> of all sources, the <strong>full automated test suite</strong>{' '}
          (standard library only — no dependency installs, so the run is reproducible like a clean
          bench), a <strong>boot-and-smoke check</strong> that the server starts, executes the
          suite and produces a verification report, and finally a <strong>Docker image build</strong>{' '}
          so the branch stays deployable.
        </p>
        <p className="text-slate-600 dark:text-slate-300 mt-4 max-w-3xl leading-relaxed">
          In V&amp;V this matters beyond software hygiene: test evidence is only worth what its
          generation process is. A green pipeline means every change re-ran the entire verification
          suite in a clean, reproducible environment — machine-generated evidence with a history,
          the same discipline as gating a release on the verification plan rather than on a claim.
        </p>
        <div className="mt-6 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-5 max-w-3xl">
          {repoReady && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={BADGE_URL} alt="CI status" className="mb-4 h-5" />
          )}
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Repository:{' '}
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="font-mono text-blue-600 dark:text-blue-400 underline break-all">
              {REPO_URL}
            </a>
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
            CI runs:{' '}
            <a href={ACTIONS_URL} target="_blank" rel="noreferrer" className="font-mono text-blue-600 dark:text-blue-400 underline break-all">
              {ACTIONS_URL}
            </a>
          </p>
        </div>
      </section>

      {/* Run it yourself */}
      <section className="container mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Run it yourself</h2>
        <p className="text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed mb-4">
          Zero dependencies — the application and its test suite use only the Python standard
          library.
        </p>
        <pre className="overflow-x-auto rounded-xl bg-slate-900 dark:bg-slate-950 border border-slate-700 p-5 text-sm leading-relaxed font-mono text-slate-100 max-w-3xl">
          {`./run.sh                    # serve on http://localhost:8000
./run.sh test               # run the full test suite (stdlib only)

# or with Docker:
docker compose up --build   # http://localhost:8000`}
        </pre>
        {liveReady && (
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-4">
            Live instance:{' '}
            <a href={LIVE_URL} target="_blank" rel="noreferrer" className="font-mono text-blue-600 dark:text-blue-400 underline break-all">
              {LIVE_URL}
            </a>
          </p>
        )}
      </section>

      <Footer info={personalInfo} />
    </main>
  );
}
