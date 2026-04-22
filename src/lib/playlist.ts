import { readdirSync, existsSync } from "fs";
import { join } from "path";

const AUDIO_DIR = join(process.cwd(), "public", "audio");

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
  songsPlayed: number; // songs played since last DJ
  isPlayingDJ: boolean;
  voiceIndex: number;
  hasStarted: boolean;
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

export function createInitialState(): RadioState {
  const files = getMusicFiles();
  return {
    playlist: files.map((f, i) => parseTrack(f, i)),
    currentIndex: 0,
    songsPlayed: 0,
    isPlayingDJ: false,
    voiceIndex: 0,
    hasStarted: false,
  };
}

export function getCurrentTrack(state: RadioState): Track | null {
  if (!state.hasStarted || state.playlist.length === 0) return null;
  return state.playlist[state.currentIndex % state.playlist.length];
}

export function getUpcoming(state: RadioState, count: number = 3): Track[] {
  if (state.playlist.length === 0) return [];
  const upcoming: Track[] = [];
  let idx = state.currentIndex;
  for (let i = 0; i < count; i++) {
    idx = (idx + 1) % state.playlist.length;
    upcoming.push(state.playlist[idx]);
  }
  return upcoming;
}

export function isDJNext(state: RadioState): boolean {
  return state.songsPlayed >= 3 && !state.isPlayingDJ;
}

export function startRadio(state: RadioState): RadioState {
  return { ...state, hasStarted: true, isPlayingDJ: true, songsPlayed: 0 };
}

export function advanceToMusic(state: RadioState): { state: RadioState; track: Track } {
  const nextIndex = (state.currentIndex + 1) % state.playlist.length;
  const newState: RadioState = {
    ...state,
    currentIndex: nextIndex,
    songsPlayed: state.songsPlayed + 1,
    isPlayingDJ: false,
  };
  return { state: newState, track: newState.playlist[nextIndex] };
}

export function advanceToDJ(state: RadioState): RadioState {
  return { ...state, isPlayingDJ: true, songsPlayed: 0 };
}

export function completeDJ(state: RadioState): { state: RadioState; track: Track } {
  // DJ finished, go to next music
  const nextIndex = (state.currentIndex + 1) % state.playlist.length;
  const newState: RadioState = {
    ...state,
    currentIndex: nextIndex,
    songsPlayed: 1, // we've now played 1 song after the DJ
    isPlayingDJ: false,
  };
  return { state: newState, track: newState.playlist[nextIndex] };
}

export function nextVoiceIndex(state: RadioState): number {
  return state.voiceIndex;
}

export function incrementVoiceIndex(state: RadioState): RadioState {
  return { ...state, voiceIndex: state.voiceIndex + 1 };
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
    if (b.startHour < b.endHour) return hour >= b.startHour && hour < b.endHour;
    return hour >= b.startHour || hour < b.endHour;
  });
  return block || BLOCKS[0];
}

export function getSchedule(): TimeBlock[] {
  return BLOCKS;
}
