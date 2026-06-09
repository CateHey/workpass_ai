import type {
  BatchSummary,
  ExpiryAlert,
  TimeToActivate,
  VerifiedWorker,
  Worker,
} from "@/lib/domain/types";
import type { AnalyticsService } from "@/lib/services/interfaces";

/** Demo reference date — keep in sync with the mock verification engine. */
const TODAY = new Date("2026-06-09T07:00:00+10:00");

/** Industry baseline: ~12 min of manual review per worker profile. */
const MANUAL_MINUTES_PER_WORKER = 12;

/**
 * Pure aggregation logic — no infra. Works on any VerifiedWorker[] / Worker[],
 * so it's identical for mock and production data.
 */
export class DefaultAnalyticsService implements AnalyticsService {
  summarize(results: VerifiedWorker[]): BatchSummary {
    const total = results.length;
    const approved = results.filter((r) => r.status === "approved").length;
    const flagged = results.filter((r) => r.status === "flagged").length;
    const fraudSuspected = results.filter((r) => r.status === "fraud_suspected").length;
    const avgProcessingSeconds =
      total === 0 ? 0 : results.reduce((s, r) => s + r.processingSeconds, 0) / total;

    return {
      total,
      approved,
      flagged,
      fraudSuspected,
      avgProcessingSeconds: round1(avgProcessingSeconds),
      timeToActivate: this.timeToActivate(results),
    };
  }

  private timeToActivate(results: VerifiedWorker[]): TimeToActivate {
    const workersInBatch = results.length;
    const workpassSecondsPerWorker =
      workersInBatch === 0
        ? 0
        : results.reduce((s, r) => s + r.processingSeconds, 0) / workersInBatch;

    const manualTotalMinutes = workersInBatch * MANUAL_MINUTES_PER_WORKER;
    const workpassTotalMinutes = (workersInBatch * workpassSecondsPerWorker) / 60;
    const hoursSaved = (manualTotalMinutes - workpassTotalMinutes) / 60;

    return {
      manualMinutesPerWorker: MANUAL_MINUTES_PER_WORKER,
      workpassSecondsPerWorker: round1(workpassSecondsPerWorker),
      workersInBatch,
      manualTotalMinutes: Math.round(manualTotalMinutes),
      workpassTotalMinutes: round1(workpassTotalMinutes),
      hoursSaved: round1(hoursSaved),
    };
  }

  expiryAlerts(workers: Worker[]): ExpiryAlert[] {
    const alerts: ExpiryAlert[] = [];
    for (const w of workers) {
      for (const c of w.credentials) {
        if (!c.expiryDate) continue;
        const days = daysBetween(TODAY, new Date(c.expiryDate));
        if (days > 90) continue; // only surface the next 90 days
        alerts.push({
          workerId: w.id,
          workerName: w.fullName,
          credentialId: c.id,
          credentialLabel: c.label,
          expiryDate: c.expiryDate,
          daysUntilExpiry: days,
          severity: severityFor(days),
        });
      }
    }
    return alerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }
}

function severityFor(days: number): ExpiryAlert["severity"] {
  if (days < 0) return "expired";
  if (days <= 14) return "critical";
  if (days <= 45) return "soon";
  return "upcoming";
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
