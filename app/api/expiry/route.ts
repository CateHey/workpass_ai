import { NextResponse } from "next/server";
import { getContainer } from "@/lib/config/container";

export const dynamic = "force-dynamic";

/**
 * GET /api/expiry — upcoming credential expiries (the retention "reason to
 * return"). Also schedules a reminder per alert through the notification seam.
 */
export async function GET() {
  const { workers, analytics, notifications } = getContainer();
  const all = await workers.listWorkers();
  const alerts = analytics.expiryAlerts(all);

  // Fire reminders through the seam (mock no-op today, email/SMS in production).
  await Promise.all(alerts.map((a) => notifications.scheduleExpiryReminder(a)));

  return NextResponse.json({ alerts });
}
