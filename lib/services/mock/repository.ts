import type { Batch, Worker } from "@/lib/domain/types";
import type { WorkerRepository } from "@/lib/services/interfaces";
import { MOCK_BATCHES, MOCK_WORKERS } from "./data";

/**
 * In-memory repository backed by the mock dataset.
 *
 * Production swap: DrizzleWorkerRepository implementing the SAME interface,
 * querying Vercel Postgres / Neon. No caller changes.
 */
export class MockWorkerRepository implements WorkerRepository {
  async listWorkers(): Promise<Worker[]> {
    // Strip the `sim` ground-truth hints before leaving the data layer.
    return MOCK_WORKERS.map(({ sim: _sim, ...worker }) => worker);
  }

  async getWorker(id: string): Promise<Worker | null> {
    const found = MOCK_WORKERS.find((w) => w.id === id);
    if (!found) return null;
    const { sim: _sim, ...worker } = found;
    return worker;
  }

  async listBatches(): Promise<Batch[]> {
    return MOCK_BATCHES;
  }

  async getBatch(id: string): Promise<Batch | null> {
    return MOCK_BATCHES.find((b) => b.id === id) ?? null;
  }
}
