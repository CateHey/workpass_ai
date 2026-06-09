import { Nav } from "@/components/Nav";
import { StatCard } from "@/components/StatCard";
import { getVerifiedBatch } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

export default async function MetricsPage() {
  const { summary } = await getVerifiedBatch();
  const t = summary.timeToActivate;
  const speedup = t.workpassTotalMinutes > 0 ? Math.round(t.manualTotalMinutes / t.workpassTotalMinutes) : 0;
  const approvalRate = summary.total > 0 ? Math.round((summary.approved / summary.total) * 100) : 0;

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            The one sharp metric
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ink-900">Time to activate a worker</h1>
          <p className="mt-2 text-sm text-ink-500">
            The single number that matters for labour-hire: how long from upload to site-ready.
            Captured per batch — the proof point for pilots and the application.
          </p>
        </div>

        {/* Before / after */}
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="card p-6">
            <p className="text-sm font-medium text-ink-500">Manual review (industry baseline)</p>
            <p className="mt-2 text-4xl font-extrabold text-ink-900">{t.manualTotalMinutes} min</p>
            <p className="mt-1 text-sm text-ink-500">
              {t.manualMinutesPerWorker} min/worker × {t.workersInBatch} workers — nearly a full
              working day.
            </p>
          </div>
          <div className="card border-brand-200 bg-brand-50/40 p-6">
            <p className="text-sm font-medium text-brand-700">With WorkPass AI</p>
            <p className="mt-2 text-4xl font-extrabold text-brand-600">{t.workpassTotalMinutes} min</p>
            <p className="mt-1 text-sm text-ink-500">
              {t.workpassSecondsPerWorker}s/worker × {t.workersInBatch} workers — cleared over a
              coffee.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <StatCard label="Faster" value={`${speedup}×`} accent="text-brand-600" sub="speed-up vs manual" />
          <StatCard label="Hours saved" value={`${t.hoursSaved}h`} accent="text-emerald-600" sub="per batch, every batch" />
          <StatCard label="Auto-approval rate" value={`${approvalRate}%`} accent="text-ink-900" sub="no human touch required" />
        </div>

        {/* Visual bar */}
        <div className="card mt-8 p-6">
          <h2 className="text-sm font-semibold text-ink-900">Relative time per batch</h2>
          <div className="mt-5 space-y-4">
            <Bar label="Manual" minutes={t.manualTotalMinutes} max={t.manualTotalMinutes} color="bg-ink-300" />
            <Bar label="WorkPass AI" minutes={t.workpassTotalMinutes} max={t.manualTotalMinutes} color="bg-brand-600" />
          </div>
          <p className="mt-4 text-xs text-ink-500">
            Each new starter is a billable verification event — at 100,000+ FIFO workers and a
            300k construction shortfall, this compounds into millions of events per year.
          </p>
        </div>
      </main>
    </div>
  );
}

function Bar({
  label,
  minutes,
  max,
  color,
}: {
  label: string;
  minutes: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.max(2, (minutes / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-ink-500">
        <span>{label}</span>
        <span>{minutes} min</span>
      </div>
      <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
