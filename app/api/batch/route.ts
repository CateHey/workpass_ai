import { NextResponse } from "next/server";
import { getContainer } from "@/lib/config/container";

export const dynamic = "force-dynamic";

/**
 * GET /api/batch — the default morning-queue batch, unverified.
 * Used by the dashboard to render the intake list before "Run verification".
 */
export async function GET() {
  const { workers } = getContainer();
  const batches = await workers.listBatches();
  const batch = batches[0] ?? null;
  if (!batch) return NextResponse.json({ error: "No batch found" }, { status: 404 });

  const all = await workers.listWorkers();
  const inBatch = all.filter((w) => batch.workerIds.includes(w.id));

  return NextResponse.json({ batch, workers: inBatch });
}
