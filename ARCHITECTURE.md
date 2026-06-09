# Architecture — built to migrate, not to throw away

The prototype runs on mock data today, but every part that will eventually be "real" is hidden
behind an **interface (a seam)**. Production swaps the implementation behind the seam; the frontend
and API routes never change.

```
React components
      │  (only ever call /api/*)
      ▼
Next.js API routes  ──►  Zod validation (lib/api/schemas.ts)  ◄── seed of a public API/SDK
      │
      ▼
Composition root (lib/config/container.ts)   ← the ONE place mock vs real is chosen
      │
      ├─ WorkerRepository      Mock(in-memory)   → DrizzleWorkerRepository (Vercel Postgres / Neon)
      ├─ VerificationEngine    Mock(deterministic)→ ClaudeVerificationEngine (already built) / Onfido
      ├─ DocumentStorage       Mock(data URL)     → BlobStorage (Vercel Blob / S3)
      ├─ NotificationService   Mock(no-op)        → Resend / Twilio (expiry reminders)
      └─ AnalyticsService      Default(pure)      → unchanged (no infra)
```

## The layers

- **`lib/domain/`** — pure types. No imports of Next.js, DB, or AI SDKs. The stable vocabulary.
- **`lib/services/interfaces.ts`** — the seams. Everything depends on these, not on concretes.
- **`lib/services/mock/`** — today's implementations + the demo dataset.
- **`lib/services/ai/claude.ts`** — the first *real* implementation, proving the seam works.
- **`lib/config/container.ts`** — the composition root; reads env flags and wires implementations.
- **`app/api/`** — thin HTTP layer: validate (Zod) → call a service → return JSON.
- **`app/`, `components/`** — UI. Talks only to `/api/*`.

## Migration path (what to change for production)

Each row is a **single implementation swap** in `container.ts` plus an env var. Nothing else moves.

| Capability | Today | Production | Trigger |
|---|---|---|---|
| Worker data | `MockWorkerRepository` | `DrizzleWorkerRepository` on Vercel Postgres / Neon | `DATABASE_URL` |
| Verification | `MockVerificationEngine` | `ClaudeVerificationEngine` (built) → Onfido/Checkr | `ANTHROPIC_API_KEY` |
| Document storage | `MockStorage` (data URL) | `BlobStorage` (Vercel Blob) | `BLOB_READ_WRITE_TOKEN` |
| Batch processing | inline in the request | queue (Inngest / Vercel Queue / QStash) | `QSTASH_TOKEN` |
| Expiry reminders | `MockNotifications` (no-op) | Resend / Twilio | `RESEND_API_KEY` |
| Auth | none (demo) | Clerk / Auth.js middleware over `/app` | — |

Why this scales on Vercel specifically: every production target is a first-party Vercel add-on or a
trivial integration, so scaling is *enabling a service*, not migrating off the platform.

## Why these seams (from the brief)

- **`VerificationEngine` is async + source-tagged** → today mock, tomorrow a model, later a queue of
  models, with zero UI change. Supports "verification as an API" (Workflow 2 idea).
- **Zod schemas are the contract** → the same schemas that validate internal calls become the
  external SDK when WorkPass AI becomes "the rails, not another login".
- **`AnalyticsService` is pure** → time-to-activate and expiry logic are identical for mock and real
  data, so the headline metric is trustworthy from day one.
