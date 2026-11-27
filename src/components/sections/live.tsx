"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Reveal } from "../Reveal";

// Shared parts of the 0.11.0 slides (Autopilot, Rocket, API keys), in the style of VoiceCall.tsx: a slide that knows
// whether it is on screen, a scripted demo that steps only while it is, the heading, the feature cards, the colour
// fields behind it and the providers' marks.

/** Whether the slide is on screen, the tab is visible and motion is allowed. Attach `ref` to the slide's content. */
export function useLive() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const onMq = () => setReduced(mq.matches);
    const onVis = () => setHidden(document.hidden);
    onMq();
    onVis();
    mq.addEventListener("change", onMq);
    document.addEventListener("visibilitychange", onVis);
    const el = ref.current;
    // On screen when a quarter of the viewport (or of the slide, on phones where it is taller) shows it.
    const io = el
      ? new IntersectionObserver(
          ([e]) => setVisible(!!e && e.intersectionRect.height > Math.min(e.boundingClientRect.height, innerHeight) * 0.25),
          { threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
        )
      : null;
    if (el && io) io.observe(el);
    return () => {
      mq.removeEventListener("change", onMq);
      document.removeEventListener("visibilitychange", onVis);
      io?.disconnect();
    };
  }, []);
  return { ref, reduced, running: visible && !hidden && !reduced };
}

/**
 * A scripted demo's step: moves to the next step after `durations[step]` ms, looping, only while `running`.
 * Under reduced motion it rests on `still`.
 */
export function useSteps(durations: readonly number[], running: boolean, reduced: boolean, still: number) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => setStep((s) => (s + 1) % durations.length), durations[step]);
    return () => clearTimeout(t);
  }, [step, running, durations]);
  return reduced ? still : step;
}

/** The slide's heading: the kicker with its dot, the claim, and the colourful continuation on its own line. */
export function Head({ kicker, dot, title, rest, gradient }: { kicker: string; dot: string; title: string; rest: string; gradient: string }) {
  return (
    <Reveal className="mx-auto max-w-4xl text-center">
      <p className="label">
        <span className="mr-1.5 inline-block size-1.5 -translate-y-px rounded-full align-middle" style={{ background: dot }} />
        {kicker}
      </p>
      <h2 className="mt-3 text-[30px] leading-[1.12] font-semibold tracking-[-0.03em] text-balance sm:text-[40px] deck:mt-[clamp(4px,1vh,10px)] deck:text-[clamp(22px,3.9vh,38px)]">
        {title}{" "}
        <span className="bg-clip-text text-transparent sm:block" style={{ backgroundImage: gradient }}>
          {rest}
        </span>
      </h2>
    </Reveal>
  );
}

export type Feature = { icon: LucideIcon; hue: string; title: string; body: string };

/** Feature cards, two to a row: a coloured icon beside the title, a short body under it. */
// `fill`: the cards share the column's height, so the column ends level with the slide's window (as on Autopilot).
export function Features({ items, compact = false, fill = false }: { items: Feature[]; compact?: boolean; fill?: boolean }) {
  return (
    <div className={`grid gap-3 sm:grid-cols-2 deck:gap-[clamp(8px,1.3vh,12px)] ${fill ? "flex-1 auto-rows-fr" : ""}`}>
      {items.map(({ icon: Icon, hue, title, body }) => (
        <div key={title} className={`glass-panel relative overflow-hidden rounded-[16px] p-4 ${compact ? "deck:p-[clamp(9px,1.5vh,14px)]" : "deck:p-[clamp(10px,1.8vh,16px)]"}`}>
          <span aria-hidden="true" className="pointer-events-none absolute -top-10 -right-10 size-28 rounded-full opacity-40 blur-2xl" style={{ background: hue }} />
          <h3 className="relative flex items-center gap-2.5 text-[15px] leading-snug font-semibold tracking-[-0.01em]">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] text-white" style={{ background: hue, boxShadow: `0 6px 18px -6px ${hue}` }}>
              <Icon size={17} />
            </span>
            {title}
          </h3>
          <p className={`relative mt-2 text-[13px] leading-relaxed text-muted ${compact ? "deck:mt-[clamp(3px,0.8vh,8px)] deck:text-[12.5px] deck:leading-[1.45]" : "deck:mt-[clamp(4px,1vh,8px)] deck:leading-[1.5]"}`}>
            {body}
          </p>
        </div>
      ))}
    </div>
  );
}

/** Colour fields behind a slide, moved by transform and paused off screen (globals.css, .cover-glow). */
export function Glow({ colors }: { colors: [string, string, string, string] }) {
  const spots: CSSProperties[] = [
    { width: "46vmax", height: "46vmax", left: "-12vmax", top: "6%", "--dur": "26s", "--dx": "6%", "--dy": "-4%" } as CSSProperties,
    { width: "50vmax", height: "50vmax", right: "-14vmax", top: "-12vmax", "--dur": "30s", "--dx": "-5%", "--dy": "5%" } as CSSProperties,
    { width: "44vmax", height: "44vmax", right: "8%", bottom: "-22vmax", "--dur": "24s", "--dx": "-6%", "--dy": "-5%" } as CSSProperties,
    { width: "30vmax", height: "30vmax", left: "26%", bottom: "-14vmax", "--dur": "28s", "--dx": "5%", "--dy": "-6%" } as CSSProperties,
  ];
  return (
    <div aria-hidden="true" className="cover-glow pointer-events-none absolute inset-0 overflow-hidden opacity-70 dark:opacity-60">
      {spots.map((s, i) => (
        <span key={i} style={{ ...s, background: `radial-gradient(closest-side, ${colors[i]}, transparent)` }} />
      ))}
    </div>
  );
}

export type Provider = "claude" | "codex";

/**
 * A provider's mark as the app draws it (Zveno repo, packages/ui/src/teams/TeamMark.tsx): a coral tile with an
 * asterisk for Claude Code, a dark tile with ">_" for Codex. Neutral placeholders, not the providers' logos.
 */
export function Mark({ p, size = 14 }: { p: Provider; size?: number }) {
  const tile: CSSProperties = { width: size, height: size, borderRadius: Math.round(size * 0.28) };
  const glyph = Math.round(size * 0.68);
  if (p === "claude")
    return (
      <span className="inline-flex shrink-0 items-center justify-center" style={{ ...tile, background: "rgb(215,119,87)" }} title="Claude Code">
        <svg width={glyph} height={glyph} viewBox="0 0 24 24" aria-hidden="true">
          <g stroke="#fff" strokeWidth="2.8" strokeLinecap="round">
            <path d="M12 3.5v17M3.5 12h17M6 6l12 12M18 6L6 18" />
          </g>
        </svg>
      </span>
    );
  return (
    <span className="inline-flex shrink-0 items-center justify-center" style={{ ...tile, background: "#16181f", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.2)" }} title="Codex">
      <svg width={glyph} height={glyph} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 7.5l4.5 4.5L6 16.5M13 16.5h5.5" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/** A status dot and its words, as the app's key and review rows show them. */
export function Status({ color, children, className = "" }: { color: string; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] whitespace-nowrap ${className}`} style={{ color }}>
      <span className="size-1.5 shrink-0 rounded-full" style={{ background: color }} />
      {children}
    </span>
  );
}

/** A demo window: the app's glass, a hairline and the frame shadow. */
export function Window({ children, className = "", label }: { children: ReactNode; className?: string; label: string }) {
  return (
    <div role="img" aria-label={label} className={`relative overflow-hidden rounded-[20px] border border-line-strong shadow-[var(--frame-shadow)] ${className}`} style={{ background: "var(--step-bg)" }}>
      {children}
    </div>
  );
}
