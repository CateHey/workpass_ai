import type {
  FlagReason,
  VerificationStatus,
  VerificationStep,
  VerifiedWorker,
} from "@/lib/domain/types";
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
    const processingSeconds = pseudoSeconds(mock.id);
    return {
      worker,
      status,
      confidence: confidenceFor(status, reasons.length),
      reasons,
      processingSeconds,
      source: "mock",
      steps: buildSteps(mock, status),
    };
  }
}

/** Builds a believable audit trail of what the engine checked, in order. */
function buildSteps(mock: MockWorker, status: VerificationStatus): VerificationStep[] {
  const base = new Date(mock.submittedAt).getTime();
  let offset = 0;
  const at = (sec: number) => {
    offset += sec;
    return new Date(base + offset * 1000).toISOString();
  };

  const hasFraud = Boolean(mock.sim.fraud);
  const expiredCred = mock.credentials.find(
    (c) => c.validation.status === "expired" || isNearExpiry(c.expiryDate),
  );
  const mismatchCred = mock.credentials.find((c) => c.validation.status === "mismatch");

  const steps: VerificationStep[] = [
    {
      label: "Documents received",
      detail: `${mock.credentials.length} document${mock.credentials.length === 1 ? "" : "s"} ingested from the batch upload.`,
      status: "info",
      at: at(1),
    },
    {
      label: "Image quality & OCR",
      detail:
        mock.sim.photoQuality === "blurry"
          ? "Photo too blurry to read reliably — extraction confidence below threshold."
          : "Fields extracted cleanly (name, number, class, expiry).",
      status: mock.sim.photoQuality === "blurry" ? "warn" : "pass",
      at: at(1),
    },
    {
      label: "Authenticity & tamper check",
      detail:
        hasFraud && mock.sim.fraud?.kind === "tampered_document"
          ? "Tampering signals detected in the document layout."
          : hasFraud
            ? "Layout inconsistencies detected — flagged for manual review."
            : "No tampering signals; security features consistent.",
      status: hasFraud ? "fail" : "pass",
      at: at(1),
    },
    {
      label: "Issuing-body validation",
      detail:
        hasFraud && mock.sim.fraud?.kind === "credential_not_found"
          ? "No matching record found at the issuing body."
          : mismatchCred
            ? "Record found, but registered name differs from the profile."
            : "Validated against the issuing body — record matches.",
      status: hasFraud ? "fail" : mismatchCred ? "warn" : "pass",
      at: at(1),
    },
    {
      label: "Expiry & WHS compliance",
      detail: expiredCred
        ? `${expiredCred.label} is expired or expires before the roster completes.`
        : "All tickets valid for the full roster period.",
      status: expiredCred ? "warn" : "pass",
      at: at(1),
    },
    {
      label: "Identity match",
      detail: mock.sim.nameMatches
        ? "Name on documents matches the worker profile."
        : "Name on a credential does not match the profile.",
      status: mock.sim.nameMatches ? "pass" : "warn",
      at: at(1),
    },
    {
      label: "Decision",
      detail:
        status === "approved"
          ? "Auto-approved — cleared for site."
          : status === "fraud_suspected"
            ? "Fraud suspected — blocked, escalated for manual review."
            : "Flagged — actionable fixes returned to the coordinator.",
      status: status === "approved" ? "pass" : status === "fraud_suspected" ? "fail" : "warn",
      at: at(1),
    },
  ];
  return steps;
}

function isNearExpiry(expiryDate: string | null): boolean {
  if (!expiryDate) return false;
  const days = daysBetween(TODAY, new Date(expiryDate));
  return days <= 7;
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
