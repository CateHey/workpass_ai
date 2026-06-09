import Anthropic from "@anthropic-ai/sdk";
import type {
  Credential,
  FlagReason,
  VerificationStatus,
  VerifiedWorker,
  Worker,
} from "@/lib/domain/types";
import type {
  VerificationEngine,
  VerificationRequest,
  WorkerRepository,
} from "@/lib/services/interfaces";
import { MockVerificationEngine } from "@/lib/services/mock/verification";

const DEFAULT_MODEL = "claude-sonnet-4-6";

/**
 * Real verification engine backed by Claude vision.
 *
 * This is the proof that the "seam" works: it implements the SAME
 * VerificationEngine interface as the mock, so the API route and UI consume it
 * with zero changes. It is only constructed when ANTHROPIC_API_KEY is present
 * (see lib/config/container.ts); otherwise the app stays on mock.
 *
 * - verify(): analyses a single uploaded document image with Claude and returns
 *   a real, model-derived VerifiedWorker.
 * - verifyBatch(): delegates to the mock engine — the demo batch has no real
 *   document images to analyse, so batch stays deterministic. In production this
 *   would fan out real images through a queue.
 */
export class ClaudeVerificationEngine implements VerificationEngine {
  readonly supportsLiveAi = true;
  private client: Anthropic;
  private model: string;
  private mockFallback = new MockVerificationEngine();

  constructor(
    apiKey: string,
    private repo: WorkerRepository,
    model = process.env.WORKPASS_AI_MODEL || DEFAULT_MODEL,
  ) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async verifyBatch(workerIds: string[]): Promise<VerifiedWorker[]> {
    return this.mockFallback.verifyBatch(workerIds);
  }

  async verify(request: VerificationRequest): Promise<VerifiedWorker> {
    // No image → nothing for the vision model to do; fall back to deterministic.
    if (!request.documentDataUrl) {
      return this.mockFallback.verify(request);
    }

    const started = Date.now();
    const { mediaType, base64 } = parseDataUrl(request.documentDataUrl);

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType as any, data: base64 },
            },
            { type: "text", text: USER_PROMPT },
          ],
        },
      ],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    const parsed = safeParse(text);
    const processingSeconds = Math.round(((Date.now() - started) / 1000) * 10) / 10;

    const baseWorker = await this.resolveWorker(request.workerId, parsed);

    return {
      worker: baseWorker,
      status: parsed.status,
      confidence: parsed.confidence,
      reasons: parsed.reasons,
      processingSeconds,
      source: "ai",
    };
  }

  private async resolveWorker(
    workerId: string | undefined,
    parsed: ParsedResult,
  ): Promise<Worker> {
    if (workerId) {
      const existing = await this.repo.getWorker(workerId);
      if (existing) return existing;
    }
    // Ad-hoc worker synthesised from what Claude read off the document.
    const credentials: Credential[] = parsed.extracted
      ? [
          {
            id: "live-cred",
            type: "white_card",
            label: parsed.extracted.documentType || "Uploaded document",
            number: parsed.extracted.number || "—",
            issuingState: (parsed.extracted.state as Worker["credentials"][number]["issuingState"]) || "NSW",
            issuingBody: parsed.extracted.issuingBody || "Unknown",
            issuedDate: parsed.extracted.issuedDate || "—",
            expiryDate: parsed.extracted.expiryDate || null,
            validation: { status: "valid" },
          },
        ]
      : [];
    return {
      id: workerId || "live-upload",
      fullName: parsed.extracted?.name || "Live upload",
      avatarColor: "#4f46e5",
      role: "Live AI verification",
      destinationSite: "—",
      submittedAt: new Date().toISOString(),
      credentials,
    };
  }
}

interface ParsedResult {
  status: VerificationStatus;
  confidence: number;
  reasons: FlagReason[];
  extracted?: {
    name?: string;
    documentType?: string;
    number?: string;
    state?: string;
    issuingBody?: string;
    issuedDate?: string;
    expiryDate?: string;
  };
}

const SYSTEM_PROMPT = `You are WorkPass AI's verification engine for Australian high-risk-industry worker credentials (White Card, High Risk Work Licence, EWP, forklift). You assess an uploaded document image for authenticity, legibility, and validity. You are rigorous and conservative: when something looks off, you flag it rather than approve. You never invent registry confirmations you cannot see.`;

const USER_PROMPT = `Analyse this worker credential document and respond with ONLY a JSON object (no markdown fences) of the form:
{
  "status": "approved" | "flagged" | "fraud_suspected",
  "confidence": <integer 0-100>,
  "reasons": [
    { "code": "blurry_photo" | "expired_ticket" | "name_mismatch" | "missing_document" | "credential_not_found" | "tampered_document", "message": "<one line>", "suggestedFix": "<one actionable line>" }
  ],
  "extracted": { "name": "", "documentType": "", "number": "", "state": "", "issuingBody": "", "issuedDate": "", "expiryDate": "" }
}
Rules: "approved" must have an empty reasons array. If the image is not a credential document, use status "flagged" with a "missing_document" reason. Keep messages short.`;

function parseDataUrl(dataUrl: string): { mediaType: string; base64: string } {
  const match = /^data:(.+?);base64,(.*)$/s.exec(dataUrl);
  if (!match) throw new Error("Invalid document data URL");
  return { mediaType: match[1], base64: match[2] };
}

function safeParse(text: string): ParsedResult {
  try {
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const obj = JSON.parse(cleaned);
    const status: VerificationStatus = ["approved", "flagged", "fraud_suspected"].includes(obj.status)
      ? obj.status
      : "flagged";
    const reasons: FlagReason[] = Array.isArray(obj.reasons)
      ? obj.reasons.map((r: any) => ({
          code: r.code ?? "missing_document",
          message: String(r.message ?? "Needs review."),
          suggestedFix: String(r.suggestedFix ?? "Review manually."),
        }))
      : [];
    return {
      status,
      confidence: clampInt(obj.confidence, 0, 100, status === "approved" ? 95 : 80),
      reasons: status === "approved" ? [] : reasons,
      extracted: obj.extracted ?? undefined,
    };
  } catch {
    // Model returned something unparseable — fail safe to a manual-review flag.
    return {
      status: "flagged",
      confidence: 50,
      reasons: [
        {
          code: "missing_document",
          message: "Could not automatically read this document.",
          suggestedFix: "Review the document manually and re-upload a clearer image.",
        },
      ],
    };
  }
}

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}
