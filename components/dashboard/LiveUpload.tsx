"use client";

import { useState } from "react";
import type { VerifiedWorker } from "@/lib/domain/types";
import { StatusBadge } from "@/components/StatusBadge";

/** Live AI single-document upload — only rendered when ANTHROPIC_API_KEY is set. */
export function LiveUpload() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<VerifiedWorker | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const dataUrl = await readAsDataUrl(file);
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentDataUrl: dataUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Verification failed");
      setResult(json.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card border-brand-200 bg-brand-50/40 p-5">
      <div className="flex items-center gap-2">
        <span className="pill border border-brand-200 bg-white text-brand-700">Live AI</span>
        <h3 className="font-semibold text-ink-900">Verify a real document with Claude</h3>
      </div>
      <p className="mt-1 text-sm text-ink-500">
        Upload a credential image — it&apos;s analysed live by the AI engine, proving the same
        interface that powers the mock batch.
      </p>

      <label className="btn-ghost mt-4 cursor-pointer">
        {busy ? "Analysing…" : "Choose document image"}
        <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={busy} />
      </label>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {result ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-ink-900">{result.worker.fullName}</p>
            <StatusBadge status={result.status} />
          </div>
          <p className="mt-1 text-xs text-ink-500">
            {result.confidence}% confidence · {result.processingSeconds}s · Live AI
          </p>
          {result.reasons.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {result.reasons.map((r, i) => (
                <li key={i} className="text-xs text-ink-700">
                  <span className="font-semibold">→</span> {r.message}{" "}
                  <span className="text-ink-500">— {r.suggestedFix}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-emerald-700">Document validated · ready for site.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
