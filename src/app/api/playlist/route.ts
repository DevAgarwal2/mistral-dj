import { NextResponse } from "next/server";
import { getState, advanceToNextMusic, getCurrentBlock, markDJPlaying, getUpcoming, getSongsUntilDJ } from "@/lib/playlist";

export async function GET() {
  const state = getState();

  if (!state.hasStarted) {
    return NextResponse.json({
      current: null,
      upcoming: state.playlist.slice(0, 3),
      isDJNext: true,
      songsUntilDJ: 0,
      hasStarted: false,
    });
  }

  const current = state.playlist[state.currentIndex];
  const songsUntilDJ = getSongsUntilDJ(state);
  const isDJDue = songsUntilDJ === 0 && !state.isPlayingDJ;

  return NextResponse.json({
    current,
    upcoming: getUpcoming(state, 3),
    isDJNext: isDJDue,
    songsUntilDJ,
    hasStarted: true,
    isPlayingDJ: state.isPlayingDJ,
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const state = getState();

  if (body.action === "start" && !state.hasStarted) {
    state.hasStarted = true;
    state.songsSinceDJ = 0;
    state.isPlayingDJ = true;
    return NextResponse.json({
      isIntro: true,
      isPlayingDJ: true,
    });
  }

  if (body.action === "dj_complete") {
    const track = advanceToNextMusic(state);
    return NextResponse.json({
      track,
      isDJ: false,
      isPlayingDJ: false,
      upcoming: getUpcoming(state, 3),
      songsUntilDJ: getSongsUntilDJ(state),
    });
  }

  const songsUntilDJ = getSongsUntilDJ(state);
  const isDJDue = songsUntilDJ === 0;

  if (isDJDue) {
    markDJPlaying(state);
    return NextResponse.json({
      isDJ: true,
      isPlayingDJ: true,
    });
  }

  const track = advanceToNextMusic(state);
  return NextResponse.json({
    track,
    isDJ: false,
    isPlayingDJ: false,
    upcoming: getUpcoming(state, 3),
    songsUntilDJ: getSongsUntilDJ(state),
  });
}
