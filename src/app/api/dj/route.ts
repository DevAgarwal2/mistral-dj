import { NextResponse } from "next/server";
import { generateChatCompletion, generateSpeech, VOICES } from "@/lib/mistral";
import { getCurrentBlock, getState, saveState } from "@/lib/playlist";
import { join } from "path";
import { mkdirSync, existsSync } from "fs";

const VOICE_LIST = [VOICES.female, VOICES.male];
const HOST_NAMES = ["Camille", "Hugo"];

// Use /tmp for writable storage on Vercel serverless
const TMP_DIR = "/tmp/mistral-fm";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const isIntro = body.type === "intro";
    const block = getCurrentBlock();
    const state = getState();

    const voiceId = VOICE_LIST[state.voiceIndex % VOICE_LIST.length];
    const hostName = HOST_NAMES[state.voiceIndex % HOST_NAMES.length];
    state.voiceIndex++;
    saveState(state);

    const prompt = isIntro
      ? `You are ${hostName}, a charismatic radio host launching MISTRAL-FM. Generate a punchy, exciting 40-45 word station intro (~20 seconds). Welcome listeners with energy, mention Mistral-powered radio. Use exclamation marks and natural enthusiasm. Never say "artificial intelligence" or "AI".`
      : `You are ${hostName}, a charismatic radio host on MISTRAL-FM. Generate a quick, punchy 40-45 word transition (~20 seconds). The vibe is "${block.mood}". Tease what's next and hand off to the music. Use enthusiasm. Never say "artificial intelligence" or "AI".`;

    const script = await generateChatCompletion([
      { role: "system", content: `You are ${hostName}, a high-energy radio host. Write spoken scripts that feel live and spontaneous. Target 40-45 words for ~20 seconds. Never use the phrase "artificial intelligence" or "AI".` },
      { role: "user", content: prompt },
    ]);

    const cleanScript = script.replace(/^["']|["']$/g, "").trim();
    const segmentId = isIntro ? `dj-intro-${Date.now()}` : `dj-${Date.now()}`;
    
    // Ensure tmp directory exists
    if (!existsSync(TMP_DIR)) {
      mkdirSync(TMP_DIR, { recursive: true });
    }
    
    const outputPath = join(TMP_DIR, `${segmentId}.mp3`);

    await generateSpeech(cleanScript, voiceId, outputPath);

    return NextResponse.json({
      segmentId,
      script: cleanScript,
      audioSrc: `/api/audio?file=${segmentId}.mp3`,
      isIntro,
      voice: hostName,
    });
  } catch (err: any) {
    console.error("DJ generation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
