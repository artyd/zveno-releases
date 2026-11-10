"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { StoryBars, useAutoplay } from "../Autoplay";
import { Reveal } from "../Reveal";
import { Slide } from "../Slide";

type Card = { shot: string; w: number; h: number; title: string; body: string; alt: string };

const CARDS: Card[] = [
  {
    shot: "brief",
    w: 1880,
    h: 936,
    title: "Morning brief",
    body: "What the agents finished overnight, what waits for you, and how much of each plan is left.",
    alt: "Morning brief: yesterday's finished tasks per project, decisions for today, limits and spend.",
  },
  {
    shot: "architecture",
    w: 1704,
    h: 1068,
    title: "Architecture map",
    body: "How the parts connect, what is built, and what the agents suggest adding.",
    alt: "Architecture diagram of a project: parts grouped by layer, what is built, in progress and planned, and how they connect.",
  },
  {
    shot: "roadmap",
    w: 1704,
    h: 1118,
    title: "Roadmap to MVP",
    body: "Numbered steps with the agent on each, plus time and agent cost until MVP.",
    alt: "Roadmap: a numbered stepper with done, current and next steps and an MVP divider.",
  },
  {
    shot: "terminal",
    w: 1704,
    h: 960,
    title: "A real terminal",
    body: "PowerShell, zsh or SSH, with Claude Code and Codex in tabs beside it. Explain any error in plain words.",
    alt: "Terminal tab: the shell runs the tests, 14 passed, with Claude Code and Codex open in tabs beside it.",
  },
  {
    shot: "versions",
    w: 1704,
    h: 708,
    title: "Versions",
    body: "Agents save a version when tests pass. Bring back any version, compare it with now, or undo one agent.",
    alt: "Versions: the rule that agents save a version when tests pass, and a timeline of versions with restore actions.",
  },
];

const TITLES = CARDS.map((c) => c.title);
const INTERVAL = 4000;
const N = CARDS.length;

// Signed distance from the card in focus, wrapped so the row loops: -2 … 2 for five cards.
const offset = (i: number, active: number) => {
  let d = (i - active + N) % N;
  if (d > N / 2) d -= N;
  return d;
};

export function Bento() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { index: active, setIndex, next, prev, playing, reduced, bind } = useAutoplay(N, rootRef);
  const [drag, setDrag] = useState<number | null>(null);
  const start = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  // Drag or swipe sideways to move one card; a vertical swipe still scrolls the page.
  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY, moved: false };
    const move = (ev: PointerEvent) => {
      const s = start.current;
      if (!s) return;
      const dx = ev.clientX - s.x;
      if (!s.moved && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(ev.clientY - s.y)) s.moved = true;
      if (s.moved) setDrag(dx);
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      const s = start.current;
      setDrag(null);
      if (!s?.moved) return;
      const dx = ev.clientX - s.x;
      if (dx < -50) next();
      else if (dx > 50) prev();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  return (
    <Slide id="more" bodyClassName="max-w-none">
      <Reveal className="mx-auto max-w-6xl text-center">
        <p className="label">And the rest of the day</p>
        <h2 className="mt-3 text-[30px] leading-[1.12] font-semibold tracking-[-0.03em] text-balance sm:text-[40px] deck:mt-[clamp(4px,1vh,10px)] deck:text-[clamp(22px,3.9vh,38px)]">
          Plan, track, roll back. <span className="text-faint">Without opening five other tools.</span>
        </h2>
      </Reveal>

      <Reveal delay={120} className="mt-6 deck:mt-[clamp(12px,2.6vh,28px)]">
        <div
          ref={rootRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="More tools"
          {...bind}
          className="peek"
          style={{ "--card-h-deck": "calc(100svh - var(--slide-pt) - var(--slide-pb) - 228px)" } as CSSProperties}
        >
          <div
            id="more-cards"
            aria-live={playing ? "off" : "polite"}
            onPointerDown={onPointerDown}
            onClickCapture={(e) => {
              if (start.current?.moved) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            className="grid touch-pan-y overflow-x-clip py-3 select-none"
          >
            {CARDS.map((c, i) => {
              const d = offset(i, active);
              const on = d === 0;
              const far = Math.abs(d) > 1;
              // Percentages in translateX are of the card's own width.
              const shift = `calc(${d} * (93% + 20px) + ${drag ?? 0}px)`;
              return (
                <article
                  key={c.shot}
                  aria-hidden={!on}
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${N}: ${c.title}`}
                  onClick={on ? undefined : () => setIndex(i)}
                  style={{
                    transform: `translateX(${shift}) scale(${on ? 1 : 0.86})`,
                    opacity: on ? 1 : far ? 0 : 0.5,
                    zIndex: on ? 2 : far ? 0 : 1,
                    width: "var(--card-w)",
                  }}
                  className={`glass-panel col-start-1 row-start-1 justify-self-center rounded-[20px] p-3 ease-[cubic-bezier(0.22,0.7,0.2,1)] ${
                    drag === null ? "transition-[transform,opacity] duration-[650ms]" : ""
                  } ${on ? "" : "cursor-pointer"}`}
                >
                  <div className="relative aspect-[1.8] overflow-hidden rounded-[12px] border border-line bg-[var(--surface)]">
                    {(["light", "dark"] as const).map((t) => (
                      <Image
                        key={t}
                        src={`/shots/${t}-${c.shot}-crop.webp`}
                        alt={c.alt}
                        width={c.w}
                        height={c.h}
                        sizes="(min-width: 768px) 1240px, 100vw"
                        quality={90}
                        draggable={false}
                        className={`${t === "light" ? "only-light" : "only-dark"} absolute inset-0 size-full object-contain`}
                      />
                    ))}
                  </div>
                  <div className="flex flex-col gap-0.5 px-1.5 pt-3 pb-0.5 sm:flex-row sm:items-baseline sm:gap-3">
                    <h3 className="shrink-0 text-[16px] font-semibold tracking-[-0.01em]">{c.title}</h3>
                    <p className="min-w-0 text-[13.5px] text-muted sm:truncate">{c.body}</p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mx-auto mt-2 flex w-[min(100%-32px,460px)] items-center gap-3 deck:mt-[clamp(4px,1vh,10px)]">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous"
              className="glass-surface flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:text-text"
            >
              <ChevronLeft size={17} />
            </button>
            <StoryBars
              labels={TITLES}
              index={active}
              ms={INTERVAL}
              playing={playing}
              reduced={reduced}
              onDone={next}
              onSelect={setIndex}
              label="More tools"
              controls="more-cards"
              className="flex-1"
            />
            <button
              type="button"
              onClick={next}
              aria-label="Next"
              className="glass-surface flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:text-text"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </Reveal>
    </Slide>
  );
}
