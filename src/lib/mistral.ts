import { Mistral } from "@mistralai/mistralai";
import { writeFileSync } from "fs";

const apiKey = process.env.MISTRAL_API_KEY || "";

export const mistral = new Mistral({ apiKey });

// Energetic voices: excited for both
export const VOICES = {
  female: "5940190b-f58a-4c3e-8264-a40d63fd6883", // Paul - Excited (energetic)
  male: "1024d823-a11e-43ee-bf3d-d440dccc0577",   // Paul - Happy (upbeat)
};

export async function generateChatCompletion(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options?: { model?: string; temperature?: number; maxTokens?: number }
) {
  const response = await mistral.chat.complete({
    model: options?.model || "mistral-small-latest",
    messages,
    temperature: options?.temperature ?? 0.9,
    maxTokens: options?.maxTokens ?? 800,
  });
  const content = response.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : "";
}

export async function generateSpeech(text: string, voiceId: string, outputPath: string): Promise<string> {
  const response = await mistral.audio.speech.complete({
    model: "voxtral-mini-tts-2603",
    input: text,
    voiceId,
    responseFormat: "mp3",
  });

  const audioBuffer = Buffer.from(response.audioData, "base64");
  writeFileSync(outputPath, audioBuffer);
  return outputPath;
}
