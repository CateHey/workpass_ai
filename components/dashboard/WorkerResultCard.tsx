import type { VerifiedWorker } from "@/lib/domain/types";
import { Avatar } from "@/components/Avatar";
import { StatusBadge } from "@/components/StatusBadge";

export function WorkerResultCard({
  vw,
  onClick,
}: {
  vw: VerifiedWorker;
  onClick: () => void;
}) {
  const { worker, status, reasons, processingSeconds, source } = vw;
  return (
    <button
      onClick={onClick}
      className="card animate-fade-up p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500"
    >
      <div className="flex items-start gap-3">
        <Avatar name={worker.fullName} color={worker.avatarColor} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-semibold text-ink-900">{worker.fullName}</p>
            <StatusBadge status={status} />
          </div>
          <p className="truncate text-xs text-ink-500">
            {worker.role} · {worker.destinationSite}
          </p>
          <p className="truncate text-[11px] text-ink-500">
            {worker.operations.employer} · {worker.operations.rosterPattern}
          </p>
        </div>
      </div>

      {reasons.length > 0 ? (
        <div className="mt-3 space-y-1.5">
          {reasons.slice(0, 2).map((r, i) => (
            <p key={i} className="line-clamp-1 text-xs text-ink-700">
              <span className="font-semibold">→</span> {r.message}
            </p>
          ))}
          {reasons.length > 2 ? (
            <p className="text-xs text-ink-500">+{reasons.length - 2} more</p>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-xs text-emerald-700">
          All credentials valid · ready for site
        </p>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-ink-500">
        <span>Verified in {processingSeconds}s</span>
        <span className="uppercase tracking-wide">{source === "ai" ? "Live AI" : "Mock"}</span>
      </div>
    </button>
  );
}
