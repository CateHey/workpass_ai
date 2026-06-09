// ─────────────────────────────────────────────────────────────────────────────
// Mock dataset — the single source of demo data.
//
// All mock data lives behind MockWorkerRepository; components never import this
// file directly. Each worker also carries `sim` hints (ground truth) that the
// MockVerificationEngine reads to produce a deterministic, believable outcome —
// the same outcomes a real engine would surface (blurry photo, expired ticket,
// name mismatch, credential-not-found fraud).
//
// Reference "today" for the demo is 2026-06-09 (see TimeToActivate + expiries).
// ─────────────────────────────────────────────────────────────────────────────

import type { Batch, Credential, Worker } from "@/lib/domain/types";

/** Ground-truth simulation hints consumed only by the mock engine. */
export interface SimHints {
  photoQuality: "clear" | "blurry";
  nameMatches: boolean;
  /** A required credential the worker failed to provide. */
  missingDocument?: { label: string };
  /** Forces a fraud outcome (issuing body has no record / tampered card). */
  fraud?: { kind: "credential_not_found" | "tampered_document"; detail: string; credentialId?: string };
}

export interface MockWorker extends Worker {
  sim: SimHints;
}

const AVATAR_COLORS = [
  "#4f46e5", "#0ea5e9", "#059669", "#d97706", "#db2777",
  "#7c3aed", "#0891b2", "#ca8a04", "#dc2626", "#2563eb",
  "#16a34a", "#9333ea",
];

function cred(c: Omit<Credential, "validation"> & { validation: Credential["validation"] }): Credential {
  return c;
}

// White Card: nationally recognised, generally non-expiring → expiryDate null.
// HRWL / EWP / Forklift: 5-year cycles → real expiry dates that we track.

export const MOCK_WORKERS: MockWorker[] = [
  {
    id: "w-001",
    fullName: "Liam O'Sullivan",
    avatarColor: AVATAR_COLORS[0],
    role: "Dogman / Rigger",
    destinationSite: "Pilbara Iron Ore — Roster 4/1",
    submittedAt: "2026-06-09T06:42:00+10:00",
    credentials: [
      cred({ id: "c-001a", type: "white_card", label: "White Card — General Construction Induction", number: "WC-NSW-882431", issuingState: "NSW", issuingBody: "SafeWork NSW", issuedDate: "2022-03-14", expiryDate: null, validation: { status: "valid" } }),
      cred({ id: "c-001b", type: "high_risk_work_licence", label: "HRWL — Class DG (Dogging)", classCode: "DG", number: "HRW-1192034", issuingState: "WA", issuingBody: "WorkSafe WA", issuedDate: "2023-01-20", expiryDate: "2028-01-20", validation: { status: "valid" } }),
    ],
    sim: { photoQuality: "clear", nameMatches: true },
  },
  {
    id: "w-002",
    fullName: "Aisha Rahman",
    avatarColor: AVATAR_COLORS[1],
    role: "Trades Assistant",
    destinationSite: "Pilbara Iron Ore — Roster 4/1",
    submittedAt: "2026-06-09T06:44:00+10:00",
    credentials: [
      cred({ id: "c-002a", type: "white_card", label: "White Card — General Construction Induction", number: "WC-QLD-553120", issuingState: "QLD", issuingBody: "WorkSafe QLD", issuedDate: "2024-08-02", expiryDate: null, validation: { status: "valid" } }),
    ],
    sim: { photoQuality: "clear", nameMatches: true },
  },
  {
    id: "w-003",
    fullName: "Daniel Mwangi",
    avatarColor: AVATAR_COLORS[2],
    role: "Forklift Operator",
    destinationSite: "Kwinana Logistics Yard",
    submittedAt: "2026-06-09T06:45:00+10:00",
    credentials: [
      cred({ id: "c-003a", type: "white_card", label: "White Card — General Construction Induction", number: "WC-WA-201884", issuingState: "WA", issuingBody: "WorkSafe WA", issuedDate: "2021-11-09", expiryDate: null, validation: { status: "valid" } }),
      cred({ id: "c-003b", type: "forklift", label: "HRWL — Class LF (Forklift)", classCode: "LF", number: "HRW-7741092", issuingState: "WA", issuingBody: "WorkSafe WA", issuedDate: "2023-06-01", expiryDate: "2028-06-01", validation: { status: "valid" } }),
    ],
    sim: { photoQuality: "clear", nameMatches: true },
  },
  {
    id: "w-004",
    fullName: "Sophie Nguyen",
    avatarColor: AVATAR_COLORS[3],
    role: "EWP Operator",
    destinationSite: "Gladstone LNG Maintenance",
    submittedAt: "2026-06-09T06:47:00+10:00",
    credentials: [
      cred({ id: "c-004a", type: "white_card", label: "White Card — General Construction Induction", number: "WC-QLD-667231", issuingState: "QLD", issuingBody: "WorkSafe QLD", issuedDate: "2020-02-18", expiryDate: null, validation: { status: "valid" } }),
      cred({ id: "c-004b", type: "ewp", label: "EWP Licence (>11m boom)", number: "EWP-330021", issuingState: "QLD", issuingBody: "WorkSafe QLD", issuedDate: "2024-04-12", expiryDate: "2029-04-12", validation: { status: "valid" } }),
    ],
    sim: { photoQuality: "clear", nameMatches: true },
  },
  {
    id: "w-005",
    fullName: "Marcus Webb",
    avatarColor: AVATAR_COLORS[4],
    role: "Crane Operator",
    destinationSite: "Pilbara Iron Ore — Roster 4/1",
    submittedAt: "2026-06-09T06:49:00+10:00",
    credentials: [
      cred({ id: "c-005a", type: "white_card", label: "White Card — General Construction Induction", number: "WC-WA-118923", issuingState: "WA", issuingBody: "WorkSafe WA", issuedDate: "2019-09-30", expiryDate: null, validation: { status: "valid" } }),
      cred({ id: "c-005b", type: "high_risk_work_licence", label: "HRWL — Class CN (Non-slewing crane)", classCode: "CN", number: "HRW-5523118", issuingState: "WA", issuingBody: "WorkSafe WA", issuedDate: "2021-05-18", expiryDate: "2026-06-15", validation: { status: "expired", expiredOn: "2026-06-15" } }),
    ],
    // Expiry is days away → engine flags as "expired_ticket" (treats <0 buffer as non-compliant for the roster start).
    sim: { photoQuality: "clear", nameMatches: true },
  },
  {
    id: "w-006",
    fullName: "Priya Sharma",
    avatarColor: AVATAR_COLORS[5],
    role: "Trades Assistant",
    destinationSite: "Kwinana Logistics Yard",
    submittedAt: "2026-06-09T06:50:00+10:00",
    credentials: [
      cred({ id: "c-006a", type: "white_card", label: "White Card — General Construction Induction", number: "WC-SA-443219", issuingState: "SA", issuingBody: "SafeWork SA", issuedDate: "2023-10-05", expiryDate: null, validation: { status: "valid" } }),
    ],
    // Photo blurry → flagged with a precise fix.
    sim: { photoQuality: "blurry", nameMatches: true },
  },
  {
    id: "w-007",
    fullName: "Connor Walsh",
    avatarColor: AVATAR_COLORS[6],
    role: "Scaffolder",
    destinationSite: "Gladstone LNG Maintenance",
    submittedAt: "2026-06-09T06:52:00+10:00",
    credentials: [
      cred({ id: "c-007a", type: "white_card", label: "White Card — General Construction Induction", number: "WC-VIC-998120", issuingState: "VIC", issuingBody: "WorkSafe VIC", issuedDate: "2022-07-22", expiryDate: null, validation: { status: "valid" } }),
      cred({ id: "c-007b", type: "high_risk_work_licence", label: "HRWL — Class SB (Basic scaffolding)", classCode: "SB", number: "HRW-6610234", issuingState: "VIC", issuingBody: "WorkSafe VIC", issuedDate: "2024-02-11", expiryDate: "2029-02-11", validation: { status: "mismatch", detail: "Licence registered to 'Connor M. Walsh'; profile name 'Connor Walsh'." } }),
    ],
    // Name mismatch → flagged.
    sim: { photoQuality: "clear", nameMatches: false },
  },
  {
    id: "w-008",
    fullName: "Grace Tupou",
    avatarColor: AVATAR_COLORS[7],
    role: "Traffic Controller",
    destinationSite: "Pilbara Iron Ore — Roster 4/1",
    submittedAt: "2026-06-09T06:53:00+10:00",
    credentials: [
      cred({ id: "c-008a", type: "white_card", label: "White Card — General Construction Induction", number: "WC-WA-771230", issuingState: "WA", issuingBody: "WorkSafe WA", issuedDate: "2025-01-14", expiryDate: null, validation: { status: "valid" } }),
    ],
    // Missing the Traffic Management ticket required for the role → flagged.
    sim: { photoQuality: "clear", nameMatches: true, missingDocument: { label: "Traffic Management Implementation (TMI) ticket" } },
  },
  {
    id: "w-009",
    fullName: "Hiroshi Tanaka",
    avatarColor: AVATAR_COLORS[8],
    role: "Rigger",
    destinationSite: "Kwinana Logistics Yard",
    submittedAt: "2026-06-09T06:55:00+10:00",
    credentials: [
      cred({ id: "c-009a", type: "white_card", label: "White Card — General Construction Induction", number: "WC-NSW-110028", issuingState: "NSW", issuingBody: "SafeWork NSW", issuedDate: "2024-11-30", expiryDate: null, validation: { status: "valid" } }),
      cred({ id: "c-009b", type: "high_risk_work_licence", label: "HRWL — Class RB (Basic rigging)", classCode: "RB", number: "HRW-0000000", issuingState: "NSW", issuingBody: "SafeWork NSW", issuedDate: "2025-03-01", expiryDate: "2030-03-01", validation: { status: "not_found", detail: "No matching record at SafeWork NSW for licence HRW-0000000." } }),
    ],
    // Issuing body has no record → fraud_suspected.
    sim: {
      photoQuality: "clear",
      nameMatches: true,
      fraud: { kind: "credential_not_found", detail: "Licence number HRW-0000000 returns no record at SafeWork NSW. Card image shows inconsistent font kerning on the licence class field.", credentialId: "c-009b" },
    },
  },
  {
    id: "w-010",
    fullName: "Emily Carter",
    avatarColor: AVATAR_COLORS[9],
    role: "Trades Assistant",
    destinationSite: "Gladstone LNG Maintenance",
    submittedAt: "2026-06-09T06:57:00+10:00",
    credentials: [
      cred({ id: "c-010a", type: "white_card", label: "White Card — General Construction Induction", number: "WC-QLD-220194", issuingState: "QLD", issuingBody: "WorkSafe QLD", issuedDate: "2023-05-19", expiryDate: null, validation: { status: "valid" } }),
    ],
    sim: { photoQuality: "clear", nameMatches: true },
  },
  {
    id: "w-011",
    fullName: "Tomas Novak",
    avatarColor: AVATAR_COLORS[10],
    role: "Forklift Operator",
    destinationSite: "Kwinana Logistics Yard",
    submittedAt: "2026-06-09T06:58:00+10:00",
    credentials: [
      cred({ id: "c-011a", type: "white_card", label: "White Card — General Construction Induction", number: "WC-WA-553982", issuingState: "WA", issuingBody: "WorkSafe WA", issuedDate: "2022-12-01", expiryDate: null, validation: { status: "valid" } }),
      cred({ id: "c-011b", type: "forklift", label: "HRWL — Class LF (Forklift)", classCode: "LF", number: "HRW-3398201", issuingState: "WA", issuingBody: "WorkSafe WA", issuedDate: "2021-07-10", expiryDate: "2026-07-10", validation: { status: "valid" } }),
    ],
    // Valid, but forklift ticket expires in ~31 days → shows in Expiry tracking.
    sim: { photoQuality: "clear", nameMatches: true },
  },
  {
    id: "w-012",
    fullName: "Olivia Brennan",
    avatarColor: AVATAR_COLORS[11],
    role: "EWP Operator",
    destinationSite: "Pilbara Iron Ore — Roster 4/1",
    submittedAt: "2026-06-09T07:00:00+10:00",
    credentials: [
      cred({ id: "c-012a", type: "white_card", label: "White Card — General Construction Induction", number: "WC-NSW-664120", issuingState: "NSW", issuingBody: "SafeWork NSW", issuedDate: "2020-06-15", expiryDate: null, validation: { status: "valid" } }),
      cred({ id: "c-012b", type: "ewp", label: "EWP Licence (>11m boom)", number: "EWP-552310", issuingState: "NSW", issuingBody: "SafeWork NSW", issuedDate: "2021-08-18", expiryDate: "2026-08-18", validation: { status: "valid" } }),
    ],
    sim: { photoQuality: "clear", nameMatches: true },
  },
];

export const MOCK_BATCHES: Batch[] = [
  {
    id: "b-monday-roster",
    label: "Monday Mining Roster — Pilbara + Gladstone + Kwinana",
    createdAt: "2026-06-09T06:40:00+10:00",
    workerIds: MOCK_WORKERS.map((w) => w.id),
  },
];
