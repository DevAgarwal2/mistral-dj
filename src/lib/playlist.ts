import { readdirSync, existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const AUDIO_DIR = join(process.cwd(), "public", "audio");
const STATE_FILE = join(process.cwd(), "radio-state.json");

export const MUSIC_ORDER = [
  "Rain Taxi Window.mp3",
  "Sunrise Desk Loop2.mp3",
  "Mizuno Village Path.mp3",
  "First Light.mp3",
  "First Light2.mp3",
  "First Light Drift.mp3",
  "Morning Cup.mp3",
  "Sunrise Desk Loop.mp3",
  "Taped Afternoon.mp3",
  "Rain on Glass.mp3",
  "Paper Rain Window.mp3",
  "Rice Field Dusk.mp3",
];

// Rename display titles for tracks with "2" in filename
export const TITLE_MAP: Record<string, string> = {
  "First Light2": "First Light (Reprise)",
  "Sunrise Desk Loop2": "Sunrise Desk (Extended)",
};

export interface Track {
  id: number;
  title: string;
  src: string;
  duration: number;
}

export interface RadioState {
  playlist: Track[];
  currentIndex: number;
  songsSinceDJ: number;
  hasStarted: boolean;
  voiceIndex: number;
  isPlayingDJ: boolean;
}

function getMusicFiles(): string[] {
  if (!existsSync(AUDIO_DIR)) return [];
  return MUSIC_ORDER.filter((f) => existsSync(join(AUDIO_DIR, f)));
}

function parseTrack(filename: string, index: number): Track {
  const rawName = filename.replace(".mp3", "");
  const title = TITLE_MAP[rawName] || rawName;
  return {
    id: index,
    title,
    src: `/audio/${encodeURIComponent(filename)}`,
    duration: 180,
  };
}

export function getState(): RadioState {
  if (existsSync(STATE_FILE)) {
    try {
      return JSON.parse(readFileSync(STATE_FILE, "utf-8"));
    } catch {}
  }

  const files = getMusicFiles();
  const state: RadioState = {
    playlist: files.map((f, i) => parseTrack(f, i)),
    currentIndex: 0,
    songsSinceDJ: 0,
    hasStarted: false,
    voiceIndex: 0,
    isPlayingDJ: false,
  };
  saveState(state);
  return state;
}

export function saveState(state: RadioState) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

export function startRadio(state: RadioState) {
  state.hasStarted = true;
  state.songsSinceDJ = 0;
  state.isPlayingDJ = true;
  saveState(state);
}

export function advanceToNextMusic(state: RadioState): Track {
  state.currentIndex = (state.currentIndex + 1) % state.playlist.length;
  state.songsSinceDJ++;
  state.isPlayingDJ = false;
  saveState(state);
  return state.playlist[state.currentIndex];
}

export function markDJPlaying(state: RadioState) {
  state.songsSinceDJ = 0;
  state.isPlayingDJ = true;
  saveState(state);
}

export function getUpcoming(state: RadioState, count: number = 3): Track[] {
  const upcoming: Track[] = [];
  let idx = state.currentIndex;

  for (let i = 0; i < count; i++) {
    idx = (idx + 1) % state.playlist.length;
    upcoming.push(state.playlist[idx]);
  }

  return upcoming;
}

export function getSongsUntilDJ(state: RadioState): number {
  return Math.max(0, 3 - state.songsSinceDJ);
}

export interface TimeBlock {
  id: string;
  name: string;
  startHour: number;
  endHour: number;
  mood: string;
  host: string;
}

const BLOCKS: TimeBlock[] = [
  { id: "dawn", name: "Dawn Chorus", startHour: 5, endHour: 10, mood: "soft morning ambient", host: "The Liminal Operator" },
  { id: "day", name: "Day Signal", startHour: 10, endHour: 17, mood: "focused daytime energy", host: "Signal" },
  { id: "dusk", name: "Dusk Lounge", startHour: 17, endHour: 22, mood: "warm evening grooves", host: "Ember" },
  { id: "night", name: "Night Garden", startHour: 22, endHour: 5, mood: "deep night contemplation", host: "Nyx" },
];

export function getCurrentBlock(date: Date = new Date()): TimeBlock {
  const hour = date.getHours();
  const block = BLOCKS.find((b) => {
    if (b.startHour < b.endHour) {
      return hour >= b.startHour && hour < b.endHour;
    }
    return hour >= b.startHour || hour < b.endHour;
  });
  return block || BLOCKS[0];
}

export function getSchedule(): TimeBlock[] {
  return BLOCKS;
}
