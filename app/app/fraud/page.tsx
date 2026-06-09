import { getVerifiedBatch } from "@/lib/server/queries";
import { Avatar } from "@/components/Avatar";
import { formatDate } from "@/lib/ui/format";

export const dynamic = "force-dynamic";

export default async function FraudPage() {
  const { results } = await getVerifiedBatch();
  const fraud = results.filter((r) => r.status === "fraud_suspected");

  return (
    <div>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-ink-900">Fraud spotlight</h1>
        <p className="mt-1 text-sm text-ink-500">
          A fake ticket on a high-risk site is a safety and liability event. WorkPass AI leads with
          catching them: every credential is validated against the issuing body, and tampering
          signals are surfaced before the worker reaches the gate.
        </p>
      </div>

      {fraud.length === 0 ? (
        <div className="card mt-6 p-8 text-center text-sm text-ink-500">
          No fraud detected in this batch.
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {fraud.map((vw) => (
            <div key={vw.worker.id} className="card border-red-200 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar name={vw.worker.fullName} color={vw.worker.avatarColor} size={48} />
                  <div>
                    <p className="text-lg font-bold text-ink-900">{vw.worker.fullName}</p>
                    <p className="text-sm text-ink-500">
                      {vw.worker.role} · destined for {vw.worker.destinationSite}
                    </p>
                  </div>
                </div>
                <span className="pill border border-red-200 bg-red-50 text-red-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  Fraud suspected · {vw.confidence}% confidence
                </span>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-ink-900">Why it was caught</h3>
                  <ul className="mt-2 space-y-2">
                    {vw.reasons.map((r, i) => (
                      <li key={i} className="rounded-xl border border-red-200 bg-red-50 p-3">
                        <p className="text-sm font-medium text-red-800">{r.message}</p>
                        <p className="mt-1 text-xs text-red-700">{r.suggestedFix}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink-900">Credentials under review</h3>
                  <ul className="mt-2 space-y-2">
                    {vw.worker.credentials.map((c) => {
                      const flagged = c.validation.status !== "valid";
                      return (
                        <li
                          key={c.id}
                          className={`rounded-xl border p-3 ${
                            flagged ? "border-red-200 bg-red-50/60" : "border-slate-200"
                          }`}
                        >
                          <p className="text-sm font-medium text-ink-900">{c.label}</p>
                          <p className="text-xs text-ink-500">
                            {c.number} · {c.issuingBody} · expiry {formatDate(c.expiryDate)}
                          </p>
                          {flagged && "detail" in c.validation ? (
                            <p className="mt-1 text-xs text-red-700">{c.validation.detail}</p>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button className="btn-primary !bg-red-600 hover:!bg-red-700">Block from site</button>
                <button className="btn-ghost">Request original document</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
