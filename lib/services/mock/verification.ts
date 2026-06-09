import type { FlagReason, VerificationStatus, VerifiedWorker } from "@/lib/domain/types";
import type { VerificationEngine, VerificationRequest } from "@/lib/services/interfaces";
import { MOCK_WORKERS, type MockWorker } from "./data";

/** Demo reference date — keeps expiry maths deterministic across runs. */
const TODAY = new Date("2026-06-09T07:00:00+10:00");

/**
 * Deterministic verification engine.
 *
 * It reads each worker's ground-truth `sim` hints and credential validations and
 * derives the same outcome a real model would surface — approved, flagged (with
 * the exact reason + fix), or fraud_suspected. Processing time is faked in the
 * low-seconds range to dramatise "minutes, not days" without a real delay.
 *
 * Production swap: ClaudeVerificationEngine / OnfidoVerificationEngine implement
 * the SAME interface and return the same VerifiedWorker shape.
 */
export class MockVerificationEngine implements VerificationEngine {
  readonly supportsLiveAi = false;

  async verify(request: VerificationRequest): Promise<VerifiedWorker> {
    const mock = MOCK_WORKERS.find((w) => w.id === request.workerId);
    if (!mock) throw new Error(`Unknown worker: ${request.workerId}`);
    return this.evaluate(mock);
  }

  async verifyBatch(workerIds: string[]): Promise<VerifiedWorker[]> {
    const set = new Set(workerIds);
    return MOCK_WORKERS.filter((w) => set.has(w.id)).map((w) => this.evaluate(w));
  }

  private evaluate(mock: MockWorker): VerifiedWorker {
    const reasons: FlagReason[] = [];
    let status: VerificationStatus = "approved";

    // 1) Fraud takes precedence — issuing body has no record / tampered card.
    if (mock.sim.fraud) {
      status = "fraud_suspected";
      reasons.push({
        code: mock.sim.fraud.kind,
        message:
          mock.sim.fraud.kind === "credential_not_found"
            ? "Credential could not be matched against the issuing body."
            : "Document shows signs of tampering.",
        suggestedFix: "Do not grant site access. Request the original card and verify directly with the issuing body before proceeding.",
        credentialId: mock.sim.fraud.credentialId,
      });
    }

    // 2) Expired tickets (or expiring before the roster start) → flag.
    for (const c of mock.credentials) {
      if (c.expiryDate) {
        const days = daysBetween(TODAY, new Date(c.expiryDate));
        if (days <= 7) {
          status = elevate(status, "flagged");
          reasons.push({
            code: "expired_ticket",
            message:
              days < 0
                ? `${c.label} expired ${Math.abs(days)} day(s) ago.`
                : `${c.label} expires in ${days} day(s) — before the roster completes.`,
            suggestedFix: "Worker must renew this ticket and re-upload before site entry. No card, no entry.",
            credentialId: c.id,
          });
        }
      }
      if (c.validation.status === "mismatch") {
        status = elevate(status, "flagged");
        reasons.push({
          code: "name_mismatch",
          message: `Name on ${c.label} doesn't match the profile.`,
          suggestedFix: "Confirm legal name and update the profile, or request a corrected card.",
          credentialId: c.id,
        });
      }
    }

    // 3) Blurry photo → flag.
    if (mock.sim.photoQuality === "blurry") {
      status = elevate(status, "flagged");
      reasons.push({
        code: "blurry_photo",
        message: "Uploaded document photo is too blurry to read reliably.",
        suggestedFix: "Ask the worker to re-take the photo in good light, flat and in focus.",
      });
    }

    // 4) Missing required document → flag.
    if (mock.sim.missingDocument) {
      status = elevate(status, "flagged");
      reasons.push({
        code: "missing_document",
        message: `Required for this role: ${mock.sim.missingDocument.label} (not provided).`,
        suggestedFix: `Request the worker upload their ${mock.sim.missingDocument.label}.`,
      });
    }

    const { sim: _sim, ...worker } = mock;
    return {
      worker,
      status,
      confidence: confidenceFor(status, reasons.length),
      reasons,
      processingSeconds: pseudoSeconds(mock.id),
      source: "mock",
    };
  }
}

function elevate(current: VerificationStatus, next: VerificationStatus): VerificationStatus {
  // fraud_suspected > flagged > approved
  const rank: Record<VerificationStatus, number> = { approved: 0, flagged: 1, fraud_suspected: 2 };
  return rank[next] > rank[current] ? next : current;
}

function confidenceFor(status: VerificationStatus, reasonCount: number): number {
  if (status === "approved") return 99;
  if (status === "fraud_suspected") return 94;
  return Math.max(82, 96 - reasonCount * 3); // flagged
}

function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/** Stable per-worker fake processing time in the 1.4–3.2s range. */
function pseudoSeconds(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1000;
  return Math.round((1.4 + (h / 1000) * 1.8) * 10) / 10;
}
