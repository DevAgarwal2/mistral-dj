"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, SkipForward, Volume2, Radio, Music, Headphones, Mic } from "lucide-react";

interface Track {
  id: number;
  title: string;
  src: string;
  duration: number;
  isDJ?: boolean;
}

interface Block {
  id: string;
  name: string;
  startHour: number;
  endHour: number;
  mood: string;
  host: string;
}

function MistralLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 191 135" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M54.3219 0H27.1528V27.0892H54.3219V0Z" fill="#FFD800"/>
      <path d="M162.984 0H135.815V27.0892H162.984V0Z" fill="#FFD800"/>
      <path d="M81.482 27.0913H27.1528V54.1805H81.482V27.0913Z" fill="#FFAF00"/>
      <path d="M162.99 27.0913H108.661V54.1805H162.99V27.0913Z" fill="#FFAF00"/>
      <path d="M162.971 54.168H27.1528V81.2572H162.971V54.168Z" fill="#FF8205"/>
      <path d="M54.3219 81.2593H27.1528V108.349H54.3219V81.2593Z" fill="#FA500F"/>
      <path d="M108.661 81.2593H81.4917V108.349H108.661V81.2593Z" fill="#FA500F"/>
      <path d="M162.984 81.2593H135.815V108.349H162.984V81.2593Z" fill="#FA500F"/>
      <path d="M81.4879 108.339H-0.00146484V135.429H81.4879V108.339Z" fill="#E10500"/>
      <path d="M190.159 108.339H108.661V135.429H190.159V108.339Z" fill="#E10500"/>
    </svg>
  );
}

function BeatRing({ isPlaying }: { isPlaying: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 220;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const bars = 48;
    const center = size / 2;
    const radius = 65;

    const animate = () => {
      timeRef.current += 0.06;
      ctx.clearRect(0, 0, size, size);

      for (let i = 0; i < bars; i++) {
        const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
        const beat = isPlaying
          ? Math.sin(timeRef.current * 2.5 + i * 0.4) * 0.5 + 0.5 +
            Math.sin(timeRef.current * 4 + i * 0.7) * 0.25 +
            Math.random() * 0.1
          : 0.05;

        const barHeight = 5 + beat * 42;
        const innerR = radius;
        const outerR = radius + barHeight;

        const x1 = center + Math.cos(angle) * innerR;
        const y1 = center + Math.sin(angle) * innerR;
        const x2 = center + Math.cos(angle) * outerR;
        const y2 = center + Math.sin(angle) * outerR;

        const hue = 26 + (i / bars) * 16;
        const lightness = 48 + beat * 32;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = 3.5;
        ctx.lineCap = "round";
        ctx.strokeStyle = `hsl(${hue}, 95%, ${lightness}%)`;
        ctx.globalAlpha = isPlaying ? 0.5 + beat * 0.5 : 0.22;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(center, center, radius - 5, 0, Math.PI * 2);
      ctx.strokeStyle = isPlaying ? "rgba(255, 175, 0, 0.2)" : "rgba(200, 195, 185, 0.15)";
      ctx.lineWidth = 1;
      ctx.globalAlpha = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(center, center, 4, 0, Math.PI * 2);
      ctx.fillStyle = isPlaying ? "#FF8205" : "#c0bab3";
      ctx.globalAlpha = 1;
      ctx.fill();

      animRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying]);

  return <canvas ref={canvasRef} style={{ width: 220, height: 220 }} className="mx-auto" />;
}

export default function HomePage() {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [upcoming, setUpcoming] = useState<Track[]>([]);
  const [isDJNext, setIsDJNext] = useState(false);
  const [songsUntilDJ, setSongsUntilDJ] = useState(3);
  const [currentBlock, setCurrentBlock] = useState<Block | null>(null);
  const [schedule, setSchedule] = useState<Block[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [progress, setProgress] = useState(0);
  const [isGeneratingDJ, setIsGeneratingDJ] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [djName, setDjName] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSchedule = useCallback(async () => {
    try {
      const res = await fetch("/api/schedule");
      const data = await res.json();
      setCurrentBlock(data.now);
      setSchedule(data.schedule);
    } catch (e) {
      console.error("Failed to fetch schedule", e);
    }
  }, []);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/playlist");
      const data = await res.json();
      setCurrentTrack(data.current ? { ...data.current, isDJ: data.isPlayingDJ || false } : null);
      setUpcoming(data.upcoming || []);
      setIsDJNext(data.isDJNext || false);
      setSongsUntilDJ(data.songsUntilDJ ?? 3);
      setHasStarted(data.hasStarted);
    } catch (e) {
      console.error("Failed to fetch queue", e);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
    fetchQueue();
    const interval = setInterval(() => {
      fetchSchedule();
      fetchQueue();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchSchedule, fetchQueue]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (isPlaying) {
      progressRef.current = setInterval(() => {
        if (audioRef.current) {
          const pct = (audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100;
          setProgress(pct || 0);
        }
      }, 500);
    } else {
      if (progressRef.current) clearInterval(progressRef.current);
    }
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [isPlaying]);

  const loadAndPlay = useCallback((src: string) => {
    if (!audioRef.current) return;
    audioRef.current.src = src;
    audioRef.current.load();
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
  }, []);

  const fetchAndPlayMusic = useCallback(async () => {
    try {
      const res = await fetch("/api/playlist");
      const data = await res.json();
      if (data.current) {
        setCurrentTrack({ ...data.current, isDJ: false });
        loadAndPlay(data.current.src);
      }
      setUpcoming(data.upcoming || []);
      setIsDJNext(data.isDJNext || false);
      setSongsUntilDJ(data.songsUntilDJ ?? 3);
    } catch (e) {
      console.error("Play music failed", e);
    }
  }, [loadAndPlay]);

  const handleTrackEnd = useCallback(async () => {
    setProgress(0);
    setIsPlaying(false);

    if (currentTrack?.isDJ) {
      try {
        await fetch("/api/playlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "dj_complete" }),
        });
        await fetchAndPlayMusic();
      } catch (e) {
        console.error("DJ complete failed", e);
      }
      return;
    }

    try {
      const res = await fetch("/api/playlist", { method: "POST" });
      const data = await res.json();

      if (data.isDJ) {
        setIsGeneratingDJ(true);
        try {
          const djRes = await fetch("/api/dj", { method: "POST" });
          const djData = await djRes.json();
          if (djData.audioSrc) {
            setDjName(djData.voice || "");
            setCurrentTrack({
              id: -1,
              title: djData.voice || "Host",
              src: djData.audioSrc,
              duration: 20,
              isDJ: true,
            });
            loadAndPlay(djData.audioSrc);
          }
        } catch (e) {
          console.error("DJ generation failed", e);
          await fetchAndPlayMusic();
        } finally {
          setIsGeneratingDJ(false);
        }
      } else if (data.track) {
        setCurrentTrack({ ...data.track, isDJ: false });
        loadAndPlay(data.track.src);
        setUpcoming(data.upcoming || []);
        setIsDJNext(data.isDJNext || false);
        setSongsUntilDJ(data.songsUntilDJ ?? 3);
      }
    } catch (e) {
      console.error("Track end handling failed", e);
    }
  }, [currentTrack, loadAndPlay, fetchAndPlayMusic]);

  const handleFirstStart = useCallback(async () => {
    setIsGeneratingDJ(true);
    try {
      await fetch("/api/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });

      const djRes = await fetch("/api/dj", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "intro" }),
      });
      const djData = await djRes.json();
      if (djData.audioSrc) {
        setDjName(djData.voice || "");
        setCurrentTrack({
          id: -2,
          title: djData.voice || "Host",
          src: djData.audioSrc,
          duration: 20,
          isDJ: true,
        });
        loadAndPlay(djData.audioSrc);
        setHasStarted(true);
      }
    } catch (e) {
      console.error("Start failed", e);
    } finally {
      setIsGeneratingDJ(false);
    }
  }, [loadAndPlay]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!hasStarted) {
        handleFirstStart();
      } else if (currentTrack?.src) {
        if (audioRef.current.src !== currentTrack.src) {
          loadAndPlay(currentTrack.src);
        } else {
          audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      }
    }
  }, [isPlaying, hasStarted, currentTrack, handleFirstStart, loadAndPlay]);

  const skipNext = useCallback(async () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
    setProgress(0);
    await handleTrackEnd();
  }, [handleTrackEnd]);

  return (
    <main className="min-h-screen bg-[#faf8f5] text-[#1a1a1a]">
      {/* Header */}
      <header className="border-b border-[#e8e4df]">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MistralLogo className="w-7 h-7" />
            <div>
              <h1 className="text-[15px] font-bold tracking-tight">MISTRAL-FM</h1>
              <p className="text-[11px] text-[#9a9590] -mt-0.5">Radio by Mistral</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-8 sm:py-10">
        {/* Player Card */}
        <div className="bg-white rounded-2xl border border-[#e8e4df] shadow-sm p-6 sm:p-8 mb-5">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            {/* Visualizer */}
            <div className="shrink-0 relative">
              <BeatRing isPlaying={isPlaying} />
              <button
                onClick={togglePlay}
                disabled={isGeneratingDJ}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-gradient-to-br from-[#FF8205] to-[#FA500F] hover:from-[#E67200] hover:to-[#E04500] disabled:opacity-50 text-white flex items-center justify-center transition-all shadow-lg active:scale-95"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left w-full">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-medium border border-amber-200 mb-3">
                <Radio className="w-3 h-3" />
                {currentBlock?.name || "On Air"}
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a] mb-1 leading-tight">
                {currentTrack?.title || "Ready to Play"}
              </h2>
              {currentTrack?.isDJ ? (
                <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                  <Mic className="w-3.5 h-3.5 text-[#FF8205]" />
                  <p className="text-sm text-[#FF8205] font-medium">
                    {djName || "Host"} on the Mic · ~20 sec
                  </p>
                </div>
              ) : currentTrack ? (
                <p className="text-sm text-[#9a9590]">Now Playing</p>
              ) : null}

              <div className="mt-5 mb-4">
                <div className="w-full bg-[#f0ece6] rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#FF8205] to-[#FFD800] transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-3">
                <button
                  onClick={skipNext}
                  disabled={isGeneratingDJ || !hasStarted}
                  className="w-10 h-10 rounded-full bg-[#f5f2ee] hover:bg-[#ebe7e1] disabled:opacity-40 text-[#6b6560] flex items-center justify-center transition-colors active:scale-95"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#b0aaa4]" />
                  <input
                    type="range" min={0} max={1} step={0.05} value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-20 accent-[#FF8205]"
                  />
                </div>
              </div>

              {isGeneratingDJ && (
                <p className="mt-3 text-sm text-[#FF8205] animate-pulse font-medium">
                  Generating voice with Mistral...
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Up Next */}
        <div className="bg-white rounded-2xl border border-[#e8e4df] shadow-sm p-5 sm:p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#9a9590] flex items-center gap-2">
              <Music className="w-3.5 h-3.5" />
              Up Next
            </h3>
            {!isDJNext && hasStarted && songsUntilDJ > 0 && (
              <span className="text-[11px] font-semibold text-[#9a9590] bg-[#f5f2ee] px-2 py-1 rounded-md">
                Break in {songsUntilDJ} song{songsUntilDJ > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Host Break Row */}
          {isDJNext && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF8205] to-[#FA500F] flex items-center justify-center shrink-0">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-[#1a1a1a]">Camille & Hugo · Host Break</div>
                <div className="text-xs text-[#9a9590]">~20 sec · Then back to music</div>
              </div>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">NEXT</span>
            </div>
          )}

          {/* Song Queue */}
          <div className="space-y-2">
            {upcoming.length > 0 ? (
              upcoming.map((track, i) => (
                <div
                  key={`${track.id}-${i}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#faf8f5] border border-[#f0ece6]"
                >
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#e8e4df] flex items-center justify-center text-xs font-bold text-[#9a9590] shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#1a1a1a] truncate">{track.title}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-[#9a9590] text-center py-6">
                {!hasStarted ? "Hit play to start the station" : "Queue loading..."}
              </div>
            )}
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-2xl border border-[#e8e4df] shadow-sm p-5 sm:p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#9a9590] mb-4">Schedule</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {schedule.map((block) => {
              const isActive = block.id === currentBlock?.id;
              return (
                <div
                  key={block.id}
                  className={`p-3 rounded-xl transition-all text-center ${
                    isActive
                      ? "bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300"
                      : "bg-[#faf8f5] border border-[#e8e4df]"
                  }`}
                >
                  <div className={`text-[11px] font-mono font-semibold ${isActive ? "text-amber-700" : "text-[#9a9590]"}`}>
                    {String(block.startHour).padStart(2, "0")}:00
                  </div>
                  <div className={`text-sm font-bold mt-1 ${isActive ? "text-[#FF8205]" : "text-[#1a1a1a]"}`}>
                    {block.name}
                  </div>
                  <div className="text-[11px] text-[#9a9590] mt-0.5 truncate">{block.host}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#e8e4df] mt-8">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between text-[11px] text-[#9a9590]">
          <div className="flex items-center gap-2">
            <MistralLogo className="w-4 h-4" />
            <span className="font-medium">MISTRAL-FM</span>
          </div>
          <span>Mistral Small · Voxtral TTS · Next.js</span>
        </div>
      </footer>

      <audio ref={audioRef} onEnded={handleTrackEnd} onError={() => setIsPlaying(false)} />
    </main>
  );
}
