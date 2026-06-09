// ─────────────────────────────────────────────────────────────────────────────
// Service interfaces — the "seams" of the system.
//
// The frontend and API routes depend ONLY on these interfaces, never on a
// concrete implementation. Today each is backed by a Mock* class; in production
// the same interface is backed by Postgres / Vercel Blob / Claude / a queue.
// Swapping is a one-line change in lib/config/container.ts — see ARCHITECTURE.md.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Batch,
  BatchSummary,
  ExpiryAlert,
  VerificationSource,
  VerifiedWorker,
  Worker,
} from "@/lib/domain/types";

/** Reads/writes worker profiles. Mock → DrizzleWorkerRepository (Postgres). */
export interface WorkerRepository {
  listWorkers(): Promise<Worker[]>;
  getWorker(id: string): Promise<Worker | null>;
  listBatches(): Promise<Batch[]>;
  getBatch(id: string): Promise<Batch | null>;
}

/** Input for an on-demand verification (the "Live AI" path). */
export interface VerificationRequest {
  workerId: string;
  /** Optional uploaded document as a base64 data URL (Live AI mode only). */
  documentDataUrl?: string;
  /** Force a particular source; defaults to the engine's own capability. */
  preferredSource?: VerificationSource;
}

/**
 * Runs a worker through verification. MockVerificationEngine returns
 * deterministic results; ClaudeVerificationEngine calls a real model.
 * Production could add OnfidoVerificationEngine, CheckrVerificationEngine, etc.
 */
export interface VerificationEngine {
  /** True if this engine can do real AI analysis (drives the UI toggle). */
  readonly supportsLiveAi: boolean;
  verify(request: VerificationRequest): Promise<VerifiedWorker>;
  /** Convenience: verify an entire batch (inline today, a queue tomorrow). */
  verifyBatch(workerIds: string[]): Promise<VerifiedWorker[]>;
}

/** Stores uploaded documents. Mock (data URL) → BlobStorage (Vercel Blob / S3). */
export interface DocumentStorage {
  upload(file: { name: string; dataUrl: string }): Promise<{ url: string }>;
}

/** Sends expiry reminders. Mock (logs) → email/SMS (Resend / Twilio). */
export interface NotificationService {
  scheduleExpiryReminder(alert: ExpiryAlert): Promise<void>;
}

/** Derives dashboard/metric aggregates from verified workers. */
export interface AnalyticsService {
  summarize(results: VerifiedWorker[]): BatchSummary;
  expiryAlerts(workers: Worker[]): ExpiryAlert[];
}
