import { NextResponse } from "next/server";
import { getContainer } from "@/lib/config/container";

export const dynamic = "force-dynamic";

/** Tells the UI which optional capabilities are live (drives the Live AI toggle). */
export async function GET() {
  const { capabilities } = getContainer();
  return NextResponse.json(capabilities);
}
