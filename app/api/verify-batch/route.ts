import { NextResponse } from "next/server";
import { getContainer } from "@/lib/config/container";
import { verifyBatchSchema } from "@/lib/api/schemas";

/**
 * POST /api/verify-batch — runs a batch through the verification engine and
 * returns per-worker results + aggregate summary (the "32 approved / 8 flagged"
 * moment + the time-to-activate metric).
 */
export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = verifyBatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { workers, verification, analytics } = getContainer();

  let workerIds = parsed.data.workerIds ?? [];
  if (parsed.data.batchId) {
    const batch = await workers.getBatch(parsed.data.batchId);
    if (!batch) return NextResponse.json({ error: "Unknown batch" }, { status: 404 });
    workerIds = batch.workerIds;
  }

  const results = await verification.verifyBatch(workerIds);
  const summary = analytics.summarize(results);

  return NextResponse.json({ results, summary });
}
