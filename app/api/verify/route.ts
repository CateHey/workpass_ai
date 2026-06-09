import { NextResponse } from "next/server";
import { getContainer } from "@/lib/config/container";
import { verifyDocumentSchema } from "@/lib/api/schemas";

/**
 * POST /api/verify — single-document verification (the "Live AI" path).
 * With ANTHROPIC_API_KEY set, an uploaded image is analysed by Claude; otherwise
 * this falls back to the deterministic mock engine.
 */
export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = verifyDocumentSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { verification, storage } = getContainer();

  // Persist the document through the storage seam (mock echoes the URL today).
  if (parsed.data.documentDataUrl) {
    await storage.upload({ name: "upload", dataUrl: parsed.data.documentDataUrl });
  }

  try {
    const result = await verification.verify({
      workerId: parsed.data.workerId ?? "live-upload",
      documentDataUrl: parsed.data.documentDataUrl,
    });
    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Verification failed" },
      { status: 500 },
    );
  }
}
