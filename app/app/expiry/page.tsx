import { getExpiryAlerts } from "@/lib/server/queries";
import { SEVERITY_META, daysLabel, formatDate } from "@/lib/ui/format";
import { StatCard } from "@/components/StatCard";

export const dynamic = "force-dynamic";

export default async function ExpiryPage() {
  const alerts = await getExpiryAlerts();
  const expired = alerts.filter((a) => a.severity === "expired").length;
  const critical = alerts.filter((a) => a.severity === "critical").length;
  const soon = alerts.filter((a) => a.severity === "soon").length;

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Expiry tracking</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-500">
          The reason coordinators come back. Every approved worker is monitored automatically — when
          a ticket nears expiry, WorkPass AI flags it before the worker becomes non-compliant on
          site. This is what turns a one-off tool into daily infrastructure.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Already expired" value={expired} accent="text-red-600" sub="block from site now" />
        <StatCard label="Critical (≤14 days)" value={critical} accent="text-orange-600" sub="renew immediately" />
        <StatCard label="Due soon (≤45 days)" value={soon} accent="text-amber-600" sub="schedule renewal" />
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-ink-700">
          Upcoming credential expiries · next 90 days
        </div>
        {alerts.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-500">No upcoming expiries. 🎉</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {alerts.map((a) => {
              const m = SEVERITY_META[a.severity];
              return (
                <li key={`${a.workerId}-${a.credentialId}`} className="flex items-center gap-4 px-5 py-3">
                  <span className={`pill border ${m.bg} ${m.text} ${m.border} w-24 justify-center`}>
                    {m.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">{a.workerName}</p>
                    <p className="truncate text-xs text-ink-500">{a.credentialLabel}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-ink-800">{formatDate(a.expiryDate)}</p>
                    <p className={`text-xs font-semibold ${m.text}`}>{daysLabel(a.daysUntilExpiry)}</p>
                  </div>
                  <button className="btn-ghost !px-3 !py-1.5 text-xs">Send reminder</button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
