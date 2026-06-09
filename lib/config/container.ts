// ─────────────────────────────────────────────────────────────────────────────
// Composition root — the ONE place that decides mock vs real implementations.
//
// API routes call getContainer() and receive a bundle of services typed only by
// their interfaces. To move a capability to production you change exactly one
// branch here (and set the matching env var) — no route or component changes.
//
//   ANTHROPIC_API_KEY present → ClaudeVerificationEngine, else MockVerificationEngine
//   DATABASE_URL present       → (future) DrizzleWorkerRepository, else Mock
//   BLOB_READ_WRITE_TOKEN      → (future) BlobStorage, else MockStorage
//   ...
//
// See ARCHITECTURE.md → "Migration path".
// ─────────────────────────────────────────────────────────────────────────────

import { DefaultAnalyticsService } from "@/lib/services/analytics";
import type {
  AnalyticsService,
  DocumentStorage,
  NotificationService,
  VerificationEngine,
  WorkerRepository,
} from "@/lib/services/interfaces";
import { MockWorkerRepository } from "@/lib/services/mock/repository";
import { MockNotifications, MockStorage } from "@/lib/services/mock/support";
import { MockVerificationEngine } from "@/lib/services/mock/verification";

export interface Container {
  workers: WorkerRepository;
  verification: VerificationEngine;
  storage: DocumentStorage;
  notifications: NotificationService;
  analytics: AnalyticsService;
  /** Capability flags surfaced to the UI (e.g. whether the Live AI toggle works). */
  capabilities: {
    liveAi: boolean;
  };
}

let cached: Container | null = null;

export function getContainer(): Container {
  if (cached) return cached;

  // --- Repository seam -------------------------------------------------------
  // if (process.env.DATABASE_URL) workers = new DrizzleWorkerRepository(...)
  const workers: WorkerRepository = new MockWorkerRepository();

  // --- Storage seam ----------------------------------------------------------
  // if (process.env.BLOB_READ_WRITE_TOKEN) storage = new BlobStorage(...)
  const storage: DocumentStorage = new MockStorage();

  // --- Notifications seam ----------------------------------------------------
  // if (process.env.RESEND_API_KEY) notifications = new ResendNotifications(...)
  const notifications: NotificationService = new MockNotifications();

  // --- Verification seam (the hybrid toggle) ---------------------------------
  let verification: VerificationEngine = new MockVerificationEngine();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    // Lazy-require keeps the AI SDK out of the mock-only code path / cold start.
    const { ClaudeVerificationEngine } = require("@/lib/services/ai/claude") as typeof import("@/lib/services/ai/claude");
    verification = new ClaudeVerificationEngine(apiKey, workers);
  }

  const analytics: AnalyticsService = new DefaultAnalyticsService();

  cached = {
    workers,
    verification,
    storage,
    notifications,
    analytics,
    capabilities: { liveAi: verification.supportsLiveAi },
  };
  return cached;
}
