import { NextResponse } from "next/server";
import { getCurrentBlock, getSchedule } from "@/lib/playlist";

export async function GET() {
  return NextResponse.json({
    now: getCurrentBlock(),
    schedule: getSchedule(),
  });
}
