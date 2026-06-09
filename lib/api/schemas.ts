// Zod schemas — the validated contract at the API boundary.
//
// These double as the seed of a public "verification as an API" SDK (the brief's
// Workflow 2 idea): the same schemas that validate internal requests today can be
// published as the external contract tomorrow.

import { z } from "zod";

export const verifyBatchSchema = z.object({
  batchId: z.string().min(1).optional(),
  workerIds: z.array(z.string().min(1)).optional(),
}).refine((v) => v.batchId || (v.workerIds && v.workerIds.length > 0), {
  message: "Provide either batchId or a non-empty workerIds array.",
});

export type VerifyBatchInput = z.infer<typeof verifyBatchSchema>;

export const verifyDocumentSchema = z.object({
  workerId: z.string().min(1).optional(),
  // base64 data URL of the uploaded document image (Live AI mode).
  documentDataUrl: z
    .string()
    .regex(/^data:.+;base64,/, "documentDataUrl must be a base64 data URL")
    .optional(),
});

export type VerifyDocumentInput = z.infer<typeof verifyDocumentSchema>;
