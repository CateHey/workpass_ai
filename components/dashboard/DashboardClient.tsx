"use client";

import { useEffect, useMemo, useState } from "react";
import type { BatchSummary, VerifiedWorker, Worker } from "@/lib/domain/types";
import { Avatar } from "@/components/Avatar";
import { StatCard } from "@/components/StatCard";
import { WorkerResultCard } from "./WorkerResultCard";
import { WorkerDrawer } from "./WorkerDrawer";
import { ProcessingOverlay } from "./ProcessingOverlay";
import { LiveUpload } from "./LiveUpload";
import { formatTime } from "@/lib/ui/format";

type Phase = "intake" | "processing" | "results";
type StatusFilter = "all" | "approved" | "flagged" | "fraud_suspected";

interface BatchPayload {
  batch: { id: string; label: string; createdAt: string };
  workers: Worker[];
}

export function DashboardClient() {
  const [payload, setPayload] = useState<BatchPayload | null>(null);
  const [phase, setPhase] = useState<Phase>("intake");
  const [results, setResults] = useState<VerifiedWorker[]>([]);
  const [summary, setSummary] = useState<BatchSummary | null>(null);
  const [selected, setSelected] = useState<VerifiedWorker | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [liveAi, setLiveAi] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [b, c] = await Promise.all([
          fetch("/api/batch").then((r) => r.json()),
          fetch("/api/capabilities").then((r) => r.json()),
        ]);
        setPayload(b);
        setLiveAi(Boolean(c.liveAi));
      } catch {
        setError("Could not load the batch. Try refreshing.");
      }
    })();
  }, []);

  async function runVerification() {
    if (!payload) return;
    setPhase("processing");
    setError(null);
    try {
      // Kick off the request; the overlay animation guarantees a minimum dwell.
      const [json] = await Promise.all([
        fetch("/api/verify-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batchId: payload.batch.id }),
        }).then((r) => r.json()),
        sleep(payload.workers.length * 90 + 600),
      ]);
      setResults(json.results);
      setSummary(json.summary);
      setPhase("results");
    } catch {
      setError("Verification failed. Try again.");
      setPhase("intake");
    }
  }

  const filtered = useMemo(
    () => (filter === "all" ? results : results.filter((r) => r.status === filter)),
    [results, filter],
  );

  if (error && !payload) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Morning verification queue</h1>
          <p className="mt-1 text-sm text-ink-500">
            {payload ? (
              <>
                {payload.batch.label} · forwarded {formatTime(payload.batch.createdAt)} ·{" "}
                {payload.workers.length} workers
              </>
            ) : (
              "Loading batch…"
            )}
          </p>
        </div>
        {phase === "intake" && payload ? (
          <button onClick={runVerification} className="btn-primary text-base">
            Run verification on {payload.workers.length} workers →
          </button>
        ) : null}
        {phase === "results" ? (
          <button
            onClick={() => {
              setPhase("intake");
              setResults([]);
              setSummary(null);
              setFilter("all");
            }}
            className="btn-ghost"
          >
            Reset demo
          </button>
        ) : null}
      </div>

      {/* Summary stats */}
      {phase === "results" && summary ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Auto-approved" value={summary.approved} accent="text-emerald-600" sub={`of ${summary.total} workers`} />
          <StatCard label="Flagged with fixes" value={summary.flagged} accent="text-amber-600" sub="precise, actionable reasons" />
          <StatCard label="Fraud suspected" value={summary.fraudSuspected} accent="text-red-600" sub="blocked from site" />
          <StatCard
            label="Time to activate"
            value={`${summary.timeToActivate.hoursSaved}h`}
            accent="text-brand-600"
            sub={`saved vs ${summary.timeToActivate.manualTotalMinutes} min manual`}
          />
        </div>
      ) : null}

      {/* Intake list */}
      {phase === "intake" && payload ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="card overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-ink-700">
                Workers awaiting verification
              </div>
              <ul className="divide-y divide-slate-100">
                {payload.workers.map((w) => (
                  <li key={w.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar name={w.fullName} color={w.avatarColor} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">{w.fullName}</p>
                      <p className="truncate text-xs text-ink-500">
                        {w.role} · {w.credentials.length} document
                        {w.credentials.length === 1 ? "" : "s"} · {w.destinationSite}
                      </p>
                    </div>
                    <span className="pill border border-slate-200 bg-slate-50 text-ink-500">Pending</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="space-y-4">
            <div className="card bg-ink-900 p-5 text-white">
              <p className="text-sm text-brand-100">The manual way</p>
              <p className="mt-1 text-2xl font-bold">~{payload.workers.length * 12} min</p>
              <p className="mt-1 text-xs text-slate-300">
                opening PDFs, squinting at White Cards, chasing missing documents.
              </p>
              <p className="mt-4 text-sm text-brand-100">With WorkPass AI</p>
              <p className="mt-1 text-2xl font-bold">one coffee ☕</p>
            </div>
            {liveAi ? <LiveUpload /> : <LiveAiHint />}
          </div>
        </div>
      ) : null}

      {/* Results */}
      {phase === "results" ? (
        <div className="mt-6">
          <FilterBar filter={filter} setFilter={setFilter} summary={summary} />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((vw) => (
              <WorkerResultCard key={vw.worker.id} vw={vw} onClick={() => setSelected(vw)} />
            ))}
          </div>
          {liveAi ? (
            <div className="mt-6 max-w-md">
              <LiveUpload />
            </div>
          ) : null}
        </div>
      ) : null}

      {phase === "processing" && payload ? (
        <ProcessingOverlay total={payload.workers.length} names={payload.workers.map((w) => w.fullName)} />
      ) : null}

      <WorkerDrawer vw={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function FilterBar({
  filter,
  setFilter,
  summary,
}: {
  filter: StatusFilter;
  setFilter: (f: StatusFilter) => void;
  summary: BatchSummary | null;
}) {
  const tabs: { key: StatusFilter; label: string; count?: number }[] = [
    { key: "all", label: "All", count: summary?.total },
    { key: "approved", label: "Approved", count: summary?.approved },
    { key: "flagged", label: "Flagged", count: summary?.flagged },
    { key: "fraud_suspected", label: "Fraud", count: summary?.fraudSuspected },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => setFilter(t.key)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            filter === t.key
              ? "bg-brand-600 text-white"
              : "border border-slate-200 bg-white text-ink-700 hover:bg-slate-50"
          }`}
        >
          {t.label}
          {typeof t.count === "number" ? (
            <span className={filter === t.key ? "ml-1.5 opacity-80" : "ml-1.5 text-ink-500"}>
              {t.count}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

function LiveAiHint() {
  return (
    <div className="card border-dashed p-5">
      <div className="flex items-center gap-2">
        <span className="pill border border-slate-200 bg-slate-50 text-ink-500">Live AI · off</span>
      </div>
      <p className="mt-2 text-sm text-ink-500">
        Running on deterministic mock data. Set <code className="rounded bg-slate-100 px-1">ANTHROPIC_API_KEY</code>{" "}
        in your environment to enable live document analysis with Claude — same interface, real model.
      </p>
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
