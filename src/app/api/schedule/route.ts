import { NextResponse } from "next/server";
import { getCurrentBlock, getSchedule } from "@/lib/playlist";

export async function GET() {
  const now = new Date();
  const current = getCurrentBlock(now);
  const schedule = getSchedule();

  return NextResponse.json({
    now: current,
    schedule,
    currentTime: now.toISOString(),
  });
}
