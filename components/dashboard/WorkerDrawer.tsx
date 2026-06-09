"use client";

import type {
  Credential,
  FitForWorkCheck,
  VerificationStep,
  VerifiedWorker,
} from "@/lib/domain/types";
import { Avatar } from "@/components/Avatar";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/ui/format";

export function WorkerDrawer({
  vw,
  onClose,
}: {
  vw: VerifiedWorker | null;
  onClose: () => void;
}) {
  if (!vw) return null;
  const { worker, status, confidence, reasons } = vw;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl animate-fade-up">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h2 className="font-semibold text-ink-900">Worker detail</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="flex items-center gap-3">
            <Avatar name={worker.fullName} color={worker.avatarColor} size={52} />
            <div>
              <p className="text-lg font-bold text-ink-900">{worker.fullName}</p>
              <p className="text-sm text-ink-500">{worker.role}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <StatusBadge status={status} />
            <span className="pill border border-slate-200 bg-slate-50 text-ink-700">
              {confidence}% confidence
            </span>
          </div>

          {/* Deployment & operations */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-ink-900">Deployment &amp; operations</h3>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Field label="Employer (labour-hire)" value={worker.operations.employer} />
              <Field label="Destination site" value={worker.destinationSite} />
              <Field label="Roster pattern" value={worker.operations.rosterPattern} />
              <Field label="Shift" value={worker.operations.shift} />
              <Field label="Start date" value={formatDate(worker.operations.startDate)} />
              <Field label="Muster point" value={worker.operations.muster} />
              <Field label="Supervisor" value={worker.operations.supervisor} />
              <Field label="Contact" value={worker.operations.phone} />
            </dl>
          </div>

          {/* Authorised to operate */}
          {worker.operations.competencies.length > 0 ? (
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-ink-900">Authorised to operate</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {worker.operations.competencies.map((c) => (
                  <span key={c} className="pill border border-brand-200 bg-brand-50 text-brand-700">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Fit for work */}
          {worker.operations.fitForWork.length > 0 ? (
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-ink-900">Fit for work</h3>
              <ul className="mt-2 space-y-1.5">
                {worker.operations.fitForWork.map((f) => (
                  <FitForWorkRow key={f.label} check={f} />
                ))}
              </ul>
            </div>
          ) : null}

          {/* Reasons / fixes */}
          {reasons.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-ink-900">
                {status === "fraud_suspected" ? "Why this is fraud-suspected" : "What needs fixing"}
              </h3>
              <ul className="mt-3 space-y-3">
                {reasons.map((r, i) => (
                  <li key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-medium text-ink-900">{r.message}</p>
                    <p className="mt-1 text-xs text-ink-700">
                      <span className="font-semibold text-brand-600">Fix:</span> {r.suggestedFix}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              All credentials authenticated and valid. This worker is ready for site.
            </div>
          )}

          {/* Verification timeline */}
          {vw.steps.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-ink-900">Verification timeline</h3>
              <ol className="mt-3 space-y-0">
                {vw.steps.map((s, i) => (
                  <TimelineRow key={i} step={s} last={i === vw.steps.length - 1} />
                ))}
              </ol>
            </div>
          ) : null}

          {/* Credentials */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-ink-900">Credentials</h3>
            <div className="mt-3 space-y-3">
              {worker.credentials.map((c) => (
                <CredentialRow key={c.id} c={c} />
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd className="font-medium text-ink-800">{value}</dd>
    </div>
  );
}

const FIT_META: Record<FitForWorkCheck["status"], { label: string; bg: string; text: string }> = {
  complete: { label: "Complete", bg: "bg-emerald-50", text: "text-emerald-700" },
  pending: { label: "Pending", bg: "bg-amber-50", text: "text-amber-700" },
  expired: { label: "Expired", bg: "bg-red-50", text: "text-red-700" },
  not_required: { label: "N/A", bg: "bg-slate-100", text: "text-ink-500" },
};

function FitForWorkRow({ check }: { check: FitForWorkCheck }) {
  const m = FIT_META[check.status];
  return (
    <li className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
      <span className="text-ink-700">{check.label}</span>
      <span className="flex items-center gap-2">
        {check.date ? <span className="text-xs text-ink-500">{formatDate(check.date)}</span> : null}
        <span className={`pill ${m.bg} ${m.text}`}>{m.label}</span>
      </span>
    </li>
  );
}

const STEP_META: Record<VerificationStep["status"], { dot: string; ring: string }> = {
  pass: { dot: "bg-emerald-500", ring: "ring-emerald-100" },
  warn: { dot: "bg-amber-500", ring: "ring-amber-100" },
  fail: { dot: "bg-red-500", ring: "ring-red-100" },
  info: { dot: "bg-slate-400", ring: "ring-slate-100" },
};

function TimelineRow({ step, last }: { step: VerificationStep; last: boolean }) {
  const m = STEP_META[step.status];
  return (
    <li className="relative flex gap-3 pb-4">
      {!last ? <span className="absolute left-[7px] top-4 h-full w-px bg-slate-200" /> : null}
      <span className={`relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full ${m.dot} ring-4 ${m.ring}`} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-900">{step.label}</p>
        <p className="text-xs text-ink-500">{step.detail}</p>
      </div>
    </li>
  );
}

function CredentialRow({ c }: { c: Credential }) {
  const v = c.validation;
  const ok = v.status === "valid";
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-ink-900">{c.label}</p>
          <p className="text-xs text-ink-500">
            {c.number} · {c.issuingState} · {c.issuingBody}
          </p>
        </div>
        <span
          className={`pill border ${
            ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {ok ? "Validated" : "Issue"}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3 text-xs text-ink-500">
        <span>Expiry: {formatDate(c.expiryDate)}</span>
      </div>
      {!ok && "detail" in v ? (
        <p className="mt-2 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700">{v.detail}</p>
      ) : null}
      {!ok && v.status === "expired" ? (
        <p className="mt-2 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700">
          Expired on {formatDate(v.expiredOn)}.
        </p>
      ) : null}
    </div>
  );
}
