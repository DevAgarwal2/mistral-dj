import { NextResponse } from "next/server";
import {
  createInitialState,
  getCurrentTrack,
  getUpcoming,
  isDJNext,
  startRadio,
  advanceToMusic,
  advanceToDJ,
  completeDJ,
} from "@/lib/playlist";
import type { RadioState } from "@/lib/playlist";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    let state: RadioState = body.state || createInitialState();
    const action = body.action || "advance";

    if (!state.playlist || state.playlist.length === 0) {
      state = createInitialState();
    }

    switch (action) {
      case "start": {
        if (state.hasStarted) {
          return NextResponse.json({ state, current: getCurrentTrack(state), upcoming: getUpcoming(state, 3), isDJNext: isDJNext(state) });
        }
        const newState = startRadio(state);
        return NextResponse.json({
          state: newState,
          isIntro: true,
          isDJNext: true,
        });
      }

      case "dj_complete": {
        // DJ just finished, advance to next music
        const result = completeDJ(state);
        return NextResponse.json({
          state: result.state,
          track: result.track,
          isDJ: false,
          upcoming: getUpcoming(result.state, 3),
          isDJNext: isDJNext(result.state),
        });
      }

      case "advance":
      default: {
        // Music track ended — check if DJ is due
        if (isDJNext(state)) {
          const newState = advanceToDJ(state);
          return NextResponse.json({
            state: newState,
            isDJ: true,
            upcoming: getUpcoming(newState, 3),
          });
        }

        // Next music track
        const result = advanceToMusic(state);
        return NextResponse.json({
          state: result.state,
          track: result.track,
          isDJ: false,
          upcoming: getUpcoming(result.state, 3),
          isDJNext: isDJNext(result.state),
        });
      }
    }
  } catch (err: any) {
    console.error("Playlist API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
