import { getContainer } from "@/lib/config/container";

/**
 * Server-side read helpers used by server components (expiry / fraud / metrics).
 * They go through the same container, so they read mock or real data identically.
 */

export async function getVerifiedBatch() {
  const { workers, verification, analytics } = getContainer();
  const batches = await workers.listBatches();
  const batch = batches[0];
  const results = await verification.verifyBatch(batch.workerIds);
  const summary = analytics.summarize(results);
  return { batch, results, summary };
}

export async function getExpiryAlerts() {
  const { workers, analytics } = getContainer();
  const all = await workers.listWorkers();
  return analytics.expiryAlerts(all);
}
