# MISTRAL-FM

A 24/7 AI-powered radio station built with Next.js, Mistral AI, and Voxtral TTS.

**Live Demo:** [mistral-dj.vercel.app](https://mistral-dj.vercel.app) *(replace with your URL after deploy)*

## What It Is

MISTRAL-FM is a continuous radio station that plays your music collection with AI-generated host segments between every 3 songs. Hosts **Camille** (female) and **Hugo** (male) alternate, generating fresh ~20 second transitions using Mistral Small LLM and Voxtral TTS.

## Features

- **AI Hosts:** Camille & Hugo — French-named hosts that alternate every break
- **Mistral Stack:** Mistral Small for script generation, Voxtral for text-to-speech
- **Canvas Visualizer:** Circular beat animation that reacts to playback
- **Schedule:** 4 time blocks (Dawn, Day, Dusk, Night) with different moods
- **Queue:** Shows next 3 songs and countdown to next host break
- **Music Order:** Configurable playlist that loops after all tracks finish

## Tech Stack

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS v4
- Bun runtime
- Mistral AI API (Small + Voxtral TTS)

## Local Setup

```bash
# Clone
git clone https://github.com/DevAgarwal2/mistral-dj.git
cd mistral-dj

# Install dependencies
bun install

# Add your Mistral API key
echo "MISTRAL_API_KEY=your_key_here" > .env.local

# Add your music files to public/audio/
# Then configure the order in src/lib/playlist.ts

# Run dev server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) and hit **Play**.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MISTRAL_API_KEY` | Your Mistral API key from [console.mistral.ai](https://console.mistral.ai) |

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push this repo to GitHub
2. Import project on Vercel
3. Add `MISTRAL_API_KEY` in Environment Variables
4. Deploy

**Note:** The project uses Bun locally but works fine with npm/pnpm on Vercel. The `package.json` is standard.

## Customization

### Music Order
Edit `src/lib/playlist.ts` — change the `MUSIC_ORDER` array to your preferred sequence:

```ts
export const MUSIC_ORDER = [
  "Rain Taxi Window.mp3",
  "Sunrise Desk Loop2.mp3",
  "Mizuno Village Path.mp3",
  // ... rest
];
```

### Track Display Names
If a filename has "2" in it, map a nicer title in `TITLE_MAP`:

```ts
export const TITLE_MAP = {
  "First Light2": "First Light (Reprise)",
  "Sunrise Desk Loop2": "Sunrise Desk (Extended)",
};
```

### DJ Frequency
Default is 3 songs between breaks. Change the `3` in `getSongsUntilDJ()` and the `>= 3` check in the playlist API.

### Host Names
Edit `HOST_NAMES` in `src/app/api/dj/route.ts`:

```ts
const HOST_NAMES = ["Camille", "Hugo"];
```

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   User      │────▶│  Next.js App │────▶│ Mistral API │
│  (Browser)  │◀────│   (Pages)    │◀────│  (LLM+TTS)  │
└─────────────┘     └──────────────┘     └─────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  public/audio│
                     │  (music +    │
                     │   generated) │
                     └──────────────┘
```

## License

MIT
