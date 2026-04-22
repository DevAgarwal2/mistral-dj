import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const TMP_DIR = "/tmp/mistral-fm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file specified" }, { status: 400 });
    }

    // Security: prevent directory traversal
    if (file.includes("..") || file.includes("/")) {
      return NextResponse.json({ error: "Invalid file" }, { status: 400 });
    }

    const filePath = join(TMP_DIR, file);

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "Audio not found" }, { status: 404 });
    }

    const audioBuffer = readFileSync(filePath);
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: any) {
    console.error("Audio serve error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
