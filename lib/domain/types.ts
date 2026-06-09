// ─────────────────────────────────────────────────────────────────────────────
// Domain layer — pure, infrastructure-agnostic types.
//
// Nothing in this file imports Next.js, a database, or an AI SDK. These types are
// the stable vocabulary of WorkPass AI; every service interface speaks in them.
// Keeping them pure is what lets us swap mock → real infra without a rewrite.
// ─────────────────────────────────────────────────────────────────────────────

/** Australian states/territories relevant to ticket validity. */
export type AuState = "NSW" | "VIC" | "QLD" | "WA" | "SA" | "TAS" | "NT" | "ACT";

/**
 * The credential types WorkPass AI models. This vertical depth in the Australian
 * ticket ecosystem is the defensibility vector from the brief (Workflow 1, Play 2).
 */
export type CredentialType =
  | "white_card" // General Construction Induction
  | "high_risk_work_licence" // HRWL (with class, e.g. CN, CV, WP)
  | "ewp" // Elevating Work Platform
  | "forklift" // Forklift / LF
  | "drivers_licence"
  | "passport";

export interface Credential {
  id: string;
  type: CredentialType;
  /** Human label, e.g. "High Risk Work Licence — Class CN (Non-slewing crane)". */
  label: string;
  /** Class code where applicable (HRWL classes), otherwise undefined. */
  classCode?: string;
  /** Card / licence number as read from the document. */
  number: string;
  issuingState: AuState;
  /** Name of the issuing/registration body checked against (RTO, SafeWork, etc.). */
  issuingBody: string;
  issuedDate: string; // ISO date
  expiryDate: string | null; // ISO date; null = non-expiring
  /** Result of validating this single credential against the issuing body. */
  validation: CredentialValidation;
}

export type CredentialValidation =
  | { status: "valid" }
  | { status: "expired"; expiredOn: string }
  | { status: "not_found"; detail: string } // issuing body has no record → possible fraud
  | { status: "mismatch"; detail: string }; // name/number doesn't match record

/** Outcome of verifying a whole worker profile. Mirrors the brief's user journey. */
export type VerificationStatus = "approved" | "flagged" | "fraud_suspected";

/** Machine-readable reason codes — the "exact reason" the coordinator sees. */
export type FlagReasonCode =
  | "blurry_photo"
  | "expired_ticket"
  | "name_mismatch"
  | "missing_document"
  | "credential_not_found"
  | "tampered_document";

export interface FlagReason {
  code: FlagReasonCode;
  /** One-line human explanation shown on the card. */
  message: string;
  /** The concrete fix the coordinator can act on. */
  suggestedFix: string;
  /** Which credential triggered it, if applicable. */
  credentialId?: string;
}

export interface Worker {
  id: string;
  fullName: string;
  /** Placeholder avatar (initials-based) — no real PII in the demo. */
  avatarColor: string;
  role: string; // e.g. "Dogman / Rigger"
  destinationSite: string; // e.g. "Pilbara Iron Ore — Roster 4/1"
  submittedAt: string; // ISO datetime
  credentials: Credential[];
}

/** A worker plus the result of running them through the verification engine. */
export interface VerifiedWorker {
  worker: Worker;
  status: VerificationStatus;
  /** 0–100 confidence the engine assigns to its decision. */
  confidence: number;
  reasons: FlagReason[];
  /** Seconds the engine took — used to dramatise "minutes, not days". */
  processingSeconds: number;
  /** "mock" or "ai" — surfaced in the UI so the demo is honest about its source. */
  source: VerificationSource;
}

export type VerificationSource = "mock" | "ai";

/** A batch the coordinator forwards in (the 7am morning-queue trigger). */
export interface Batch {
  id: string;
  label: string;
  createdAt: string;
  workerIds: string[];
}

/** Aggregate stats for the results dashboard ("32 approved / 8 flagged"). */
export interface BatchSummary {
  total: number;
  approved: number;
  flagged: number;
  fraudSuspected: number;
  /** Average per-worker processing time (seconds). */
  avgProcessingSeconds: number;
  /** The headline metric from the brief. */
  timeToActivate: TimeToActivate;
}

/** "time-to-activate a worker" — the one sharp metric from the brief. */
export interface TimeToActivate {
  manualMinutesPerWorker: number; // industry baseline
  workpassSecondsPerWorker: number; // measured here
  workersInBatch: number;
  manualTotalMinutes: number;
  workpassTotalMinutes: number;
  hoursSaved: number;
}

/** An upcoming credential expiry — the "reason to return" / retention loop. */
export interface ExpiryAlert {
  workerId: string;
  workerName: string;
  credentialId: string;
  credentialLabel: string;
  expiryDate: string;
  daysUntilExpiry: number;
  severity: "expired" | "critical" | "soon" | "upcoming";
}
