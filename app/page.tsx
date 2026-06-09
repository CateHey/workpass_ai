import Link from "next/link";
import { Nav } from "@/components/Nav";

const STATS = [
  { value: "8,000+", label: "extra mining workers needed by 2026" },
  { value: "300,000", label: "projected construction shortfall by 2027" },
  { value: "100,000+", label: "FIFO workers in constant, high-churn onboarding" },
];

const STEPS = [
  {
    title: "Forward the morning batch",
    body: "It's 7am. 40 new workers must be site-ready for the Monday roster. Forward their uploads into WorkPass AI in one action.",
  },
  {
    title: "AI verifies in minutes",
    body: "Each profile is checked for authenticity, fraud, and validity against the issuing body — White Card, HRWL, EWP, forklift.",
  },
  {
    title: "Clear the queue over one coffee",
    body: "Approved, flagged with the exact fix, or fraud-suspected. A full day of manual review compressed into minutes.",
  },
  {
    title: "Stay compliant automatically",
    body: "Every approved worker gets automatic expiry tracking — turning a one-off tool into daily compliance infrastructure.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Nav />

      {/* Hero */}
      <section className="bg-dotted border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="pill border border-brand-200 bg-brand-50 text-brand-700">
              AI-native worker verification · Australia
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-ink-900 sm:text-6xl">
              Upload to approved in <span className="text-brand-600">minutes</span>, not days.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-500">
              WorkPass AI verifies and onboards high-volume blue-collar workers for Australia&apos;s
              mining and construction sites — checking tickets, catching fraud, and keeping employers
              WHS-compliant. Built for the labour-hire coordinator clearing the morning queue.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/app" className="btn-primary text-base">
                Try the live demo
                <span aria-hidden>→</span>
              </Link>
              <Link href="/metrics" className="btn-ghost text-base">
                See the time saved
              </Link>
            </div>
            <p className="mt-4 text-xs text-ink-500">
              Prototype with mock data · deployed on Vercel · optional live AI verification
            </p>
          </div>
        </div>
      </section>

      {/* Problem stats */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <p className="text-center text-sm font-semibold uppercase tracking-wider text-brand-600">
            Why now
          </p>
          <h2 className="mx-auto mt-2 max-w-2xl text-center text-2xl font-bold text-ink-900">
            A structural labour shortage is forcing a wave of new starters onto high-risk sites —
            every one needs verification before they can legally step on.
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {STATS.map((s) => (
              <div key={s.label} className="card p-6 text-center">
                <div className="text-3xl font-extrabold text-brand-600">{s.value}</div>
                <div className="mt-2 text-sm text-ink-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <p className="text-center text-sm font-semibold uppercase tracking-wider text-brand-600">
            The Day-1 journey
          </p>
          <h2 className="mt-2 text-center text-3xl font-bold text-ink-900">
            The labour-hire coordinator clears the morning queue
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {STEPS.map((step, i) => (
              <div key={step.title} className="card relative p-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="mt-4 font-semibold text-ink-900">{step.title}</h3>
                <p className="mt-2 text-sm text-ink-500">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wedge / differentiation */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
                The wedge
              </p>
              <h2 className="mt-2 text-3xl font-bold text-ink-900">
                Own the approval moment, not the whole compliance suite.
              </h2>
              <p className="mt-4 text-ink-500">
                Incumbents are heavy, configuration-led platforms built for corporate risk officers.
                WorkPass AI owns the single painful, repeated micro-moment — a worker&apos;s profile
                sitting in a queue waiting for a human to eyeball a licence — and makes it instant.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Deep Australian ticket modelling — White Card by state, HRWL classes, EWP & forklift.",
                  "Fraud detection as the headline: catch fake tickets before they reach site.",
                  "Automatic expiry tracking that turns onboarding into always-on compliance.",
                ].map((t) => (
                  <li key={t} className="flex gap-3 text-sm text-ink-700">
                    <span className="mt-0.5 text-emerald-500" aria-hidden>
                      ✓
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card bg-ink-900 p-8 text-white">
              <p className="text-sm font-medium text-brand-100">One-line pitch</p>
              <p className="mt-3 text-lg leading-relaxed">
                &ldquo;I lived the bottleneck of manually approving thousands of worker profiles at
                DiDi in LatAm. Australian mining and construction now face the same problem at scale
                because of the talent shortage — I&apos;m building the AI that approves a worker in
                minutes, not days, while keeping employers WHS-compliant.&rdquo;
              </p>
              <Link href="/app" className="btn-primary mt-8 w-full">
                Open the dashboard →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center text-xs text-ink-500 sm:px-6">
          WorkPass AI · Prototype for the Latitude 37 (by Airwallex) application · Confidential draft
        </div>
      </footer>
    </div>
  );
}
