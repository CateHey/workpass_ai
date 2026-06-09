"use client";

import { useEffect, useState } from "react";

/** Dramatises the "minutes, not days" moment while the batch is verified. */
export function ProcessingOverlay({ total, names }: { total: number; names: string[] }) {
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (done >= total) return;
    const t = setTimeout(() => setDone((d) => Math.min(total, d + 1)), 90);
    return () => clearTimeout(t);
  }, [done, total]);

  const current = names[Math.min(done, names.length - 1)] ?? "";
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm">
      <div className="card w-full max-w-sm p-8 text-center">
        <div className="relative mx-auto h-16 w-16">
          <span className="absolute inset-0 rounded-full border-4 border-brand-100" />
          <span className="absolute inset-0 animate-pulse-ring rounded-full border-4 border-brand-400" />
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-brand-600">
            {pct}%
          </span>
        </div>
        <h3 className="mt-5 font-semibold text-ink-900">Verifying worker credentials…</h3>
        <p className="mt-1 text-sm text-ink-500">
          Checking authenticity, fraud signals & issuing-body validity
        </p>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand-600 transition-all duration-100"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-3 h-4 truncate text-xs text-ink-500">{current}</p>
      </div>
    </div>
  );
}
