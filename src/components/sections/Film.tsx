"use client";

import { Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { FILM } from "@/lib/film";
import { useReducedMotion } from "../Autoplay";
import { Reveal } from "../Reveal";
import { Slide } from "../Slide";

type Theme = "light" | "dark";

const subscribeTheme = (cb: () => void) => {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
};
const readTheme = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

/** The page theme, which ThemeToggle and the first-paint script set on <html>. */
function useTheme(): Theme {
  return useSyncExternalStore(subscribeTheme, readTheme, () => "light");
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// The promo film near the top: muted, inline, looping. It loads only when it comes near the screen (metadata first),
// plays while on screen and the tab is visible, and stops off screen. Under reduced motion it waits on its poster
// for a press of Play. The chapter chips jump to each part; the one playing is marked.
export function Film() {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const video = useRef<HTMLVideoElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  // null: nobody chose yet (autoplay decides); true / false: the visitor pressed Play or Pause.
  const [wants, setWants] = useState<boolean | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const close = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "800px 0px" });
    const seen = new IntersectionObserver(([e]) => setInView(e.intersectionRatio >= 0.35), { threshold: [0, 0.35, 1] });
    close.observe(el);
    seen.observe(el);
    const vis = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", vis);
    return () => {
      close.disconnect();
      seen.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  // The file for this theme, WebM where the browser plays VP9; a theme switch keeps the place in the film.
  useEffect(() => {
    if (!near) return;
    const v = video.current;
    const files = FILM.files(theme);
    const next = v?.canPlayType('video/webm; codecs="vp9"') ? files.webm : files.mp4;
    setSrc((was) => {
      if (was && was !== next && v) {
        const at = v.currentTime;
        v.addEventListener("loadedmetadata", () => (v.currentTime = at), { once: true });
      }
      return next;
    });
  }, [near, theme]);

  const shouldPlay = !!src && inView && pageVisible && (wants ?? !reduced);
  useEffect(() => {
    const v = video.current;
    if (!v || !src) return;
    // A browser that refuses autoplay gets the Play button; an aborted play (a pause, a new file) is not a refusal.
    if (shouldPlay) v.play().catch((e: Error) => e.name === "NotAllowedError" && setWants((w) => (w === null ? false : w)));
    else v.pause();
  }, [shouldPlay, src]);

  const jump = useCallback((start: number) => {
    const v = video.current;
    setWants(true);
    if (!v) return;
    v.currentTime = start + 0.05;
    setTime(start);
  }, []);

  const toggle = () => setWants(!playing);
  const active = FILM.chapters.reduce((a, c, i) => (time + 0.25 >= c.start ? i : a), 0);
  const files = FILM.files(theme);

  return (
    <Slide id="film" bodyClassName="max-w-[1700px]">
      <Reveal className="mx-auto max-w-5xl text-center">
        <p className="label">See it work · one minute</p>
        <h2 className="mt-3 text-[30px] leading-[1.12] font-semibold tracking-[-0.03em] text-balance sm:text-[40px] deck:mt-[clamp(4px,1vh,10px)] deck:text-[clamp(22px,3.7vh,36px)]">
          From an idea to a shipped app. <span className="text-faint">Jump to any part below.</span>
        </h2>
      </Reveal>

      <Reveal delay={120} className="mt-6 deck:mt-[clamp(12px,2.4vh,26px)]">
        <div
          className="fit-w"
          style={{ "--ar": "1.7778", "--fit-h-deck": "calc(100svh - var(--slide-pt) - var(--slide-pb) - 190px)" } as CSSProperties}
        >
          <div ref={box} className="shot-frame relative aspect-video w-full">
            <video
              ref={video}
              className="absolute inset-0 h-full w-full object-cover"
              src={src ?? undefined}
              poster={near ? files.poster : undefined}
              muted
              playsInline
              loop
              preload="metadata"
              aria-label="Zveno in one minute: an idea goes to the Orchestrator, agents build in parallel, you watch in the Feed and on the Board, preview the app and ship; then what is new in 0.10.1."
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
            />
            {!playing && (wants === false || reduced || !src) && (
              <button
                type="button"
                onClick={() => setWants(true)}
                aria-label="Play the film"
                className="absolute inset-0 flex cursor-pointer items-center justify-center bg-transparent"
              >
                <span className="glass-window flex size-[72px] items-center justify-center rounded-full text-text shadow-lg transition-transform hover:scale-105 sm:size-[84px]">
                  <Play size={30} className="translate-x-[2px]" fill="currentColor" />
                </span>
              </button>
            )}
            {(playing || wants === true) && (
              <button
                type="button"
                onClick={toggle}
                aria-label={playing ? "Pause the film" : "Play the film"}
                className="glass-window absolute right-3 bottom-3 flex size-10 cursor-pointer items-center justify-center rounded-full text-text opacity-80 transition-opacity hover:opacity-100 focus-visible:opacity-100"
              >
                {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="translate-x-[1px]" />}
              </button>
            )}
          </div>

          <div role="group" aria-label="Film chapters" className="mt-3 flex flex-wrap justify-center gap-1.5 deck:mt-[clamp(8px,1.6vh,16px)]">
            {FILM.chapters.map((c, i) => {
              const on = i === active && (playing || time > 0);
              return (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => jump(c.start)}
                  aria-current={on ? "step" : undefined}
                  aria-label={`${c.label}, from ${clock(c.start)}`}
                  className={`flex min-h-9 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium transition-colors ${
                    on ? "border-transparent bg-strong text-strong-text" : "glass-surface text-muted hover:text-text"
                  }`}
                >
                  {c.label === "New in 0.10.1" && <span className={`size-1.5 rounded-full ${on ? "bg-strong-text" : "bg-accent"}`} />}
                  {c.label}
                  <span className={`font-mono text-[10.5px] ${on ? "opacity-70" : "text-faint"}`}>{clock(c.start)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Reveal>
    </Slide>
  );
}
