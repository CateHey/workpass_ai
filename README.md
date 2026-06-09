# WorkPass AI — Prototype

Instant, AI-native worker verification & onboarding for Australia's high-risk industries.
Upload to **approved in minutes, not days** — built for the labour-hire coordinator clearing the
Monday-morning queue.

This is the **Workflow 3 (Create)** prototype from the Latitude 37 brief: the batch-verification UI,
running on **mock data** by default, with an optional **live AI** path powered by Claude.

> Architecture note: the prototype is built on swappable "seams" so it migrates to real
> infrastructure without a rewrite. See [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Screens

| Route | What it shows |
|---|---|
| `/` | Landing / pitch — problem, the Day-1 journey, the wedge |
| `/app` | **Dashboard** — forward a batch → AI verifies → approved / flagged (with exact fix) / fraud |
| `/app/expiry` | Expiry tracking — the retention loop ("reason to return") |
| `/app/fraud` | Fraud spotlight — fake-ticket detection as the headline |
| `/metrics` | Time-to-activate — the one sharp metric (manual vs WorkPass AI) |

## Run locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

No environment variables are needed — the app runs 100% on deterministic mock data.

### Optional: enable Live AI verification

Set an Anthropic API key and the dashboard's "Live AI" uploader analyses a real document image
with Claude (same interface as the mock engine):

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel → **Add New… → Project** → import the repo. Framework is auto-detected (Next.js); no
   config needed.
3. *(Optional)* add `ANTHROPIC_API_KEY` under **Settings → Environment Variables** to enable Live AI.
4. Deploy.

Or via CLI:

```bash
npm i -g vercel
vercel        # preview
vercel --prod # production
```

## Tech

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Zod · optional `@anthropic-ai/sdk`.

## Build / verify

```bash
npm run build   # type-checks + production build
```
