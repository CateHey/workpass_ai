import type { ExpiryAlert, VerificationStatus } from "@/lib/domain/types";

export const STATUS_META: Record<
  VerificationStatus,
  { label: string; dot: string; bg: string; text: string; border: string }
> = {
  approved: {
    label: "Approved",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  flagged: {
    label: "Flagged",
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  fraud_suspected: {
    label: "Fraud suspected",
    dot: "bg-red-500",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
};

export const SEVERITY_META: Record<
  ExpiryAlert["severity"],
  { label: string; bg: string; text: string; border: string }
> = {
  expired: { label: "Expired", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  critical: { label: "Critical", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  soon: { label: "Soon", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  upcoming: { label: "Upcoming", bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
};

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function formatDate(iso: string | null): string {
  if (!iso) return "No expiry";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
}

export function daysLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "today";
  return `in ${days}d`;
}
