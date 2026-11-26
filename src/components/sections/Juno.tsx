"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Cpu, Languages, Pause, PhoneCall, Play, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Bug, ORCH_LOOK } from "../Bug";
import { Reveal } from "../Reveal";
import { Slide } from "../Slide";

// Juno, the voice call with the Orchestrator (Zveno 0.10.5; Zveno repo, .scratch/voice-assistant/spec.md and
// ADR 0039). The call screen and its pill are rebuilt from packages/ui/src/call/ (CallScreen, CallParts,
// view.ts): the same chip, Bug, waveform maths, glyphs and colours. The call here is a scripted demo; the
// "Hear Juno" clips are real Qwen3-TTS output of Juno's voices, and play through the same waveform.

type CallState = "listening" | "thinking" | "speaking";

const LABEL: Record<CallState, string> = { listening: "Listening", thinking: "Thinking", speaking: "Speaking" };
const DOT: Record<CallState, string> = { listening: "var(--call-ok)", thinking: "var(--call-warn)", speaking: "var(--call-blue)" };
const WAVE: Record<CallState, string> = { listening: "var(--call-ok)", thinking: "var(--call-warn)", speaking: "var(--call-text)" };
// The light behind the Bug: the state's colour with a second hue beside it.
const AURA: Record<CallState, string> = {
  listening:
    "radial-gradient(42% 46% at 50% 44%, rgba(48,209,88,.49), transparent 70%), radial-gradient(40% 40% at 26% 78%, rgba(10,132,255,.32), transparent 70%), radial-gradient(38% 40% at 78% 22%, rgba(175,82,222,.32), transparent 70%)",
  thinking:
    "radial-gradient(42% 46% at 50% 44%, rgba(255,159,10,.46), transparent 70%), radial-gradient(40% 40% at 24% 24%, rgba(255,55,95,.29), transparent 70%), radial-gradient(38% 40% at 78% 78%, rgba(175,82,222,.35), transparent 70%)",
  speaking:
    "radial-gradient(42% 46% at 50% 44%, rgba(10,132,255,.49), transparent 70%), radial-gradient(40% 40% at 78% 76%, rgba(100,210,255,.38), transparent 70%), radial-gradient(38% 40% at 22% 24%, rgba(175,82,222,.38), transparent 70%)",
};

const BARS = 18;
const TICK = 70;

/** The app's waveHeights (packages/ui/src/call/view.ts): bar heights in px for a box `max` px high at tick `t`. */
function waveHeights(state: CallState, levels: readonly number[], t: number, max: number, muted = false): number[] {
  const bars: number[] = [];
  for (let i = 0; i < BARS; i++) {
    const level = Math.max(0, Math.min(1, levels[levels.length - BARS + i] ?? 0));
    let h: number;
    if (state === "thinking") h = 4 + 3 * (1 + Math.sin(t / 6 + i * 0.6));
    else if (muted && state === "listening") h = 4;
    else if (state === "speaking") h = 6 + (max - 8) * level * (0.55 + 0.45 * Math.abs(Math.sin(t / 3.1 + i * 0.9)));
    else h = 4 + (max - 10) * level * (0.55 + 0.45 * Math.abs(Math.sin(t / 4 + i * 1.3)));
    bars.push(Math.round(Math.max(4, Math.min(max, h)) * 10) / 10);
  }
  return bars;
}

/** "02:14" */
const callTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

// The demo's turns. The reply is what Juno says; code, paths and long lists stay in the Feed.
const TURNS = [
  { you: "Add a sign-in screen, with tests.", juno: "Got it. I'm starting two agents: one builds the sign-in screen, the other writes the tests." },
  { you: "How is it going?", juno: "The sign-in screen is done and the tests pass. Details are in the Feed." },
  { you: "Ship it.", juno: "The release is ready. It is waiting for you on screen." },
];
const PHASES: { state: CallState; ms: number }[] = [
  { state: "listening", ms: 3600 },
  { state: "thinking", ms: 1700 },
  { state: "speaking", ms: 5200 },
];

// Juno's Qwen3-TTS voices, as the app ships them (Zveno repo, .scratch/voice-assistant/samples/juno-native-xvec-*).
const CLIPS = [
  { id: "en-female", lang: "EN", label: "English · female", src: "/juno/juno-en-female.mp3", text: "Hi, I'm Juno. What are we building today?" },
  { id: "ru-female", lang: "RU", label: "Russian · female", src: "/juno/juno-ru-female.mp3", text: "Привет! Я Джуно, на связи. Что делаем сегодня?" },
  { id: "ru-male", lang: "RU", label: "Russian · male", src: "/juno/juno-ru-male.mp3", text: "Привет! Я Джуно, на связи. Что делаем сегодня?" },
] as const;

const LANGS = [
  ["RU", "Русский"],
  ["EN", "English"],
  ["DE", "Deutsch"],
  ["ES", "Español"],
  ["FR", "Français"],
  ["IT", "Italiano"],
  ["PT", "Português"],
  ["ZH", "中文"],
  ["JA", "日本語"],
  ["KO", "한국어"],
] as const;

const FEATURES: { icon: LucideIcon; hue: string; title: string; body: string }[] = [
  {
    icon: PhoneCall,
    hue: "#30d158",
    title: "Talk like a call",
    body: "No push-to-talk: call from the Orchestrator's row and just talk. Juno hears when you finish and stops when you cut in.",
  },
  {
    icon: Languages,
    hue: "#0a84ff",
    title: "Your language",
    body: "It answers in the language you speak, in a female or male voice. Rename it if you like.",
  },
  {
    icon: Cpu,
    hue: "#af52de",
    title: "On your computer",
    body: "whisper.cpp hears a phrase in about a second; Qwen3-TTS or Piper speaks. No audio or text leaves it.",
  },
  {
    icon: ShieldCheck,
    hue: "#ff9f0a",
    title: "Never approves by voice",
    body: "Releases, pushes, payments and deletes stay on-screen presses.",
  },
];

/** The app's call glyphs (CallParts.tsx GLYPHS). */
const GLYPH = {
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
  minimise: <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />,
  expand: <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />,
  end: <path d="M3 15.5c5-5 13-5 18 0l-2.5 2.5-3-2v-2.5a12 12 0 0 0-7 0V16l-3 2z" />,
};
function Glyph({ name }: { name: keyof typeof GLYPH }) {
  const filled = name === "end";
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke={filled ? undefined : "currentColor"} strokeWidth={filled ? undefined : 2} aria-hidden="true">
      {GLYPH[name]}
    </svg>
  );
}

function CallBug({ size }: { size: string }) {
  return (
    <div className="juno-bug" style={{ width: size, height: size }}>
      <span className="juno-ring" />
      <span className="juno-ring" />
      <span className="juno-ring" />
      <div className="juno-art">
        <Bug look={ORCH_LOOK} mood="still" size={150} />
      </div>
    </div>
  );
}

function Wave({ state, height, setRef }: { state: CallState; height: number; setRef: (el: HTMLDivElement | null) => void }) {
  return (
    <div ref={setRef} className="juno-wave" style={{ height }} aria-hidden="true">
      {Array.from({ length: BARS }, (_, i) => (
        <i key={i} style={{ background: WAVE[state] }} />
      ))}
    </div>
  );
}

// A still waveform for reduced motion: a speaking shape that does not move.
const STILL = Array.from({ length: BARS }, (_, i) => 0.35 + 0.6 * Math.abs(Math.sin(i * 0.9 + 0.4)));

export function Juno() {
  const root = useRef<HTMLDivElement>(null);
  const waves = useRef<(HTMLDivElement | null)[]>([null, null]);
  const [phase, setPhase] = useState(0);
  const [turn, setTurn] = useState(0);
  const [seconds, setSeconds] = useState(128);
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [clip, setClip] = useState<string | null>(null);
  const [looped, setLooped] = useState(false);

  const sim = useRef({ t: 0, phaseMs: 0, callMs: 128000, levels: new Array<number>(BARS).fill(0) });
  const audio = useRef<{ el: HTMLAudioElement; analyser: AnalyserNode; buf: Float32Array<ArrayBuffer> } | null>(null);
  const ctx = useRef<AudioContext | null>(null);
  const phaseRef = useRef(0);

  const state: CallState = clip ? "speaking" : reduced ? "speaking" : PHASES[phase]!.state;
  const running = visible && !hidden && !reduced;

  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const onMq = () => setReduced(mq.matches);
    const onVis = () => setHidden(document.hidden);
    onMq();
    onVis();
    mq.addEventListener("change", onMq);
    document.addEventListener("visibilitychange", onVis);
    const el = root.current;
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

  const stopClip = useCallback(() => {
    const a = audio.current;
    if (a) {
      a.el.pause();
      a.el.src = "";
    }
    audio.current = null;
    setClip(null);
  }, []);

  // Leaving the slide stops a clip that is playing.
  useEffect(() => {
    if ((!visible || hidden) && audio.current) stopClip();
  }, [visible, hidden, stopClip]);
  useEffect(() => () => {
    audio.current?.el.pause();
    void ctx.current?.close();
  }, []);

  const draw = useCallback((s: CallState, levels: readonly number[], t: number) => {
    [34, 24].forEach((max, k) => {
      const el = waves.current[k];
      if (!el) return;
      const hs = waveHeights(s, levels, t, max);
      for (let i = 0; i < el.children.length; i++) (el.children[i] as HTMLElement).style.height = `${hs[i] ?? 4}px`;
    });
  }, []);

  // Reduced motion: one still frame.
  useEffect(() => {
    if (reduced && !clip) draw("speaking", STILL, 0);
  }, [reduced, clip, draw]);

  // The call's clock, its script and the waveform, ticking every 70 ms like the app, only while on screen.
  useEffect(() => {
    if (!running && !clip) return;
    const s = sim.current;
    const timer = setInterval(() => {
      s.t += 1;
      const a = audio.current;
      let st: CallState;
      let level = 0;
      if (a) {
        st = "speaking";
        a.analyser.getFloatTimeDomainData(a.buf);
        let sum = 0;
        for (let i = 0; i < a.buf.length; i++) sum += a.buf[i]! * a.buf[i]!;
        level = Math.min(1, Math.sqrt(sum / a.buf.length) * 5);
      } else if (reduced) {
        return;
      } else {
        s.phaseMs += TICK;
        let p = phaseRef.current;
        if (s.phaseMs >= PHASES[p]!.ms) {
          s.phaseMs = 0;
          p = (p + 1) % PHASES.length;
          phaseRef.current = p;
          setPhase(p);
          if (p === 0) {
            setTurn((n) => (n + 1) % TURNS.length);
            setLooped(true);
          }
        }
        st = PHASES[p]!.state;
        const left = PHASES[p]!.ms - s.phaseMs;
        if (st === "listening") {
          // You talk, then a short quiet: that quiet is how Juno knows you have finished.
          const talk = s.phaseMs > 500 && left > 900;
          level = talk ? speechLevel(s.t) : 0.03 * Math.random();
        } else if (st === "speaking") {
          level = s.phaseMs > 250 && left > 350 ? speechLevel(s.t + 17) : 0.02;
        }
      }
      s.levels.push(level);
      s.levels.shift();
      draw(st, s.levels, s.t);
      s.callMs += TICK;
      const sec = Math.floor(s.callMs / 1000);
      setSeconds((prev) => (prev === sec ? prev : sec));
    }, TICK);
    return () => clearInterval(timer);
  }, [running, clip, reduced, draw]);

  const play = async (id: string) => {
    if (clip === id) {
      stopClip();
      return;
    }
    stopClip();
    const c = CLIPS.find((x) => x.id === id)!;
    try {
      const AC = window.AudioContext;
      ctx.current ??= new AC();
      if (ctx.current.state === "suspended") await ctx.current.resume();
      const el = new Audio(c.src);
      const source = ctx.current.createMediaElementSource(el);
      const analyser = ctx.current.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      analyser.connect(ctx.current.destination);
      audio.current = { el, analyser, buf: new Float32Array(analyser.fftSize) };
      el.addEventListener("ended", () => {
        if (audio.current?.el === el) {
          audio.current = null;
          setClip(null);
          // Back to the call: Juno listens again.
          sim.current.phaseMs = 0;
          phaseRef.current = 0;
          setPhase(0);
        }
      });
      setClip(id);
      await el.play();
    } catch {
      stopClip();
    }
  };

  const t = TURNS[turn]!;
  const playing = CLIPS.find((c) => c.id === clip);
  // While Juno listens, the Feed still shows the last exchange, faded.
  const prev = turn > 0 || looped ? TURNS[(turn + TURNS.length - 1) % TURNS.length]! : null;
  const listening = !playing && state === "listening";
  const shown = listening ? prev : t;
  const youLine = playing ? null : listening ? (prev?.you ?? null) : t.you;
  const junoLine = playing ? playing.text : listening ? (prev?.juno ?? null) : state === "speaking" ? t.juno : null;
  const activeLang = playing?.lang ?? "EN";

  return (
    <Slide id="juno" backdrop={<Glow />}>
      <div ref={root}>
        <Reveal className="mx-auto max-w-4xl text-center">
          <p className="label">
            <span className="mr-1.5 inline-block size-1.5 -translate-y-px rounded-full align-middle" style={{ background: "#30d158" }} />
            New in 0.10.5 · Juno · Windows first
          </p>
          <h2 className="mt-3 text-[30px] leading-[1.12] font-semibold tracking-[-0.03em] text-balance sm:text-[40px] deck:mt-[clamp(4px,1vh,10px)] deck:text-[clamp(22px,3.9vh,38px)]">
            Call the Orchestrator and talk it through.{" "}
            <span className="bg-clip-text text-transparent sm:block" style={{ backgroundImage: "linear-gradient(90deg, #30d158, #0a84ff 45%, #af52de 75%, #ff9f0a)" }}>
              It answers in your language, on your computer.
            </span>
          </h2>
        </Reveal>

        <div className="juno mt-6 grid items-start gap-4 lg:grid-cols-[1.08fr_1fr] deck:mt-[clamp(12px,2.6vh,28px)] deck:gap-[clamp(10px,1.8vh,18px)]">
          {/* The call, as the app shows it: full screen over a blurred Zveno, then minimised to its pill. */}
          <Reveal className="flex flex-col gap-3 deck:gap-[clamp(8px,1.4vh,12px)]">
            <div
              data-call-state={state}
              className="relative overflow-hidden rounded-[22px] border border-[var(--call-line)] shadow-[var(--frame-shadow)]"
              style={{ background: "var(--call-bg)" }}
              role="img"
              aria-label={`Juno's call screen: ${LABEL[state]}, ${callTime(seconds)}`}
            >
              <div className="juno-aura pointer-events-none absolute inset-0" style={{ background: AURA[state] }} />
              <div className="relative grid justify-items-center gap-3 px-4 py-6 deck:gap-[clamp(6px,1.1vh,12px)] deck:py-[clamp(12px,2.4vh,34px)]">
                <span className="inline-flex items-center gap-[7px] rounded-[6px] bg-[var(--call-chip)] px-[9px] py-1 font-mono text-[11px] font-medium whitespace-nowrap text-[var(--call-text)]">
                  <span className="size-[7px] rounded-full transition-colors duration-300" style={{ background: DOT[state] }} />
                  {LABEL[state]} · {callTime(seconds)}
                </span>
                <div className="my-2 deck:my-[clamp(4px,1vh,12px)]">
                  <CallBug size="clamp(96px, 14vh, 150px)" />
                </div>
                <div className="text-[26px] font-[650] tracking-[-0.02em] text-[var(--call-text)]">Juno</div>
                <Wave state={state} height={34} setRef={(el) => {
                    waves.current[0] = el;
                  }} />
                <div className="mt-1 flex justify-center gap-2.5" aria-hidden="true">
                  <span className="juno-ctl">
                    <Glyph name="mic" />
                  </span>
                  <span className="juno-ctl">
                    <Glyph name="minimise" />
                  </span>
                  <span className="juno-ctl is-end">
                    <Glyph name="end" />
                  </span>
                </div>
              </div>
            </div>

            {/* Minimised: the pill above the composer. */}
            <div
              data-call-state={state}
              className="flex items-center gap-3 rounded-full border border-[var(--call-line)] py-[9px] pr-2.5 pl-[9px] text-[var(--call-text)] shadow-[0_18px_50px_rgba(0,0,0,.18)] backdrop-blur-[20px]"
              style={{ background: "var(--call-pill)" }}
              aria-hidden="true"
            >
              <CallBug size="42px" />
              <div className="grid min-w-0 flex-1 gap-px">
                <span className="truncate text-[12.5px] font-semibold">
                  Juno <span className="font-medium text-[var(--call-muted)]">· {LABEL[state]}</span>
                </span>
                <span className="font-mono text-[11.5px] font-medium text-[var(--call-muted)]">{callTime(seconds)}</span>
              </div>
              <div className="max-[420px]:hidden">
                <Wave state={state} height={24} setRef={(el) => {
                    waves.current[1] = el;
                  }} />
              </div>
              <div className="flex gap-1.5">
                <span className="juno-ctl !size-[34px]">
                  <Glyph name="mic" />
                </span>
                <span className="juno-ctl !size-[34px]">
                  <Glyph name="expand" />
                </span>
                <span className="juno-ctl is-end !h-[34px] !w-[44px]">
                  <Glyph name="end" />
                </span>
              </div>
            </div>
            {/* What the call leaves behind: the whole talk as text in the Orchestrator's Feed. */}
            <div className="glass-panel rounded-[16px] p-4 deck:p-[clamp(10px,1.8vh,16px)]">
              <div className="flex items-center justify-between gap-3">
                <p className="label !text-[10.5px]">Kept as text in the Feed</p>
                <span className="text-[11.5px] text-faint">Code and paths stay in text</span>
              </div>
              <div
                className="mt-2 grid min-h-[64px] content-start gap-1.5 text-[13.5px] leading-snug transition-opacity duration-500"
                style={{ opacity: listening ? 0.5 : 1 }}
              >
                {youLine && (
                  <p key={`y-${shown === t ? turn : "prev"}`} className="juno-line flex gap-2">
                    <span className="w-10 shrink-0 font-mono text-[11px] leading-[1.6] text-faint uppercase">You</span>
                    <span>{youLine}</span>
                  </p>
                )}
                {junoLine && (
                  <p key={`j-${clip ?? (shown === t ? turn : "prev")}`} className="juno-line flex gap-2">
                    <span className="w-10 shrink-0 font-mono text-[11px] leading-[1.6] uppercase" style={{ color: "#af52de" }}>
                      Juno
                    </span>
                    <span className="text-muted">{junoLine}</span>
                  </p>
                )}
                {!youLine && !junoLine && <p className="juno-line text-[13px] text-faint">Listening…</p>}
              </div>
            </div>
          </Reveal>

          <Reveal stagger={60} className="flex flex-col gap-3 deck:gap-[clamp(8px,1.4vh,12px)]">
            <div className="grid gap-3 sm:grid-cols-2 deck:gap-[clamp(8px,1.4vh,12px)]">
              {FEATURES.map(({ icon: Icon, hue, title, body }) => (
                <div key={title} className="glass-panel relative overflow-hidden rounded-[16px] p-4 deck:p-[clamp(10px,1.8vh,16px)]">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-10 -right-10 size-28 rounded-full opacity-40 blur-2xl"
                    style={{ background: hue }}
                  />
                  <span className="relative flex size-9 items-center justify-center rounded-[10px] text-white" style={{ background: hue, boxShadow: `0 6px 18px -6px ${hue}` }}>
                    <Icon size={18} />
                  </span>
                  <h3 className="relative mt-2.5 text-[15px] leading-snug font-semibold tracking-[-0.01em]">{title}</h3>
                  <p className="relative mt-1 text-[13px] leading-relaxed text-muted">{body}</p>
                </div>
              ))}
            </div>

            <div className="glass-panel rounded-[16px] p-4 deck:p-[clamp(10px,1.8vh,16px)]">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="label !text-[10.5px]">Hear Juno</p>
                <span className="text-[11.5px] text-faint">Juno&apos;s Qwen3-TTS voices</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {CLIPS.map((c) => {
                  const on = clip === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => void play(c.id)}
                      aria-pressed={on}
                      className={`inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-[13px] font-medium transition-colors ${
                        on ? "border-transparent text-white" : "border-line-strong bg-surface hover:bg-sel"
                      }`}
                      style={on ? { background: "linear-gradient(90deg, #0a84ff, #af52de)" } : undefined}
                    >
                      {on ? <Pause size={14} /> : <Play size={14} />}
                      {c.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[12px] text-faint">Ten languages. Juno answers in the one you speak.</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5" aria-label="Languages Juno speaks">
                {LANGS.map(([code, name], i) => {
                  const hueDeg = (150 + i * 36) % 360;
                  const on = code === activeLang;
                  return (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1.5 rounded-[8px] px-2 py-[3px] text-[12px] transition-shadow"
                      style={
                        {
                          background: `oklch(0.7 0.16 ${hueDeg} / ${on ? 0.28 : 0.13})`,
                          boxShadow: on ? `inset 0 0 0 1px oklch(0.7 0.16 ${hueDeg} / 0.7)` : undefined,
                        } as CSSProperties
                      }
                    >
                      <span className="font-mono text-[10.5px] font-semibold" style={{ color: `oklch(0.6 0.17 ${hueDeg})` }}>
                        {code}
                      </span>
                      <span lang={code.toLowerCase()}>{name}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </Slide>
  );
}

/** A loudness that rises and falls like syllables, with short gaps between words. */
function speechLevel(t: number): number {
  const syllable = Math.max(0, Math.sin(t * 0.62 + Math.sin(t * 0.17) * 2.2));
  const word = Math.sin(t * 0.09 + 1.3) < -0.8 ? 0.12 : 1;
  return Math.min(1, (0.18 + 0.82 * syllable * (0.65 + 0.35 * Math.random())) * word);
}

// Colour fields behind the slide in the call's own colours: green, blue, violet and amber. Moved by transform,
// paused while the slide is off screen (globals.css, .cover-glow).
function Glow() {
  const blob = (s: CSSProperties) => <span style={s} />;
  return (
    <div aria-hidden="true" className="cover-glow pointer-events-none absolute inset-0 overflow-hidden opacity-70 dark:opacity-60">
      {blob({ width: "46vmax", height: "46vmax", left: "-12vmax", top: "6%", background: "radial-gradient(closest-side, rgba(48,209,88,.4), transparent)", "--dur": "26s", "--dx": "6%", "--dy": "-4%" } as CSSProperties)}
      {blob({ width: "50vmax", height: "50vmax", right: "-14vmax", top: "-12vmax", background: "radial-gradient(closest-side, rgba(10,132,255,.42), transparent)", "--dur": "30s", "--dx": "-5%", "--dy": "5%" } as CSSProperties)}
      {blob({ width: "44vmax", height: "44vmax", right: "8%", bottom: "-22vmax", background: "radial-gradient(closest-side, rgba(175,82,222,.4), transparent)", "--dur": "24s", "--dx": "-6%", "--dy": "-5%" } as CSSProperties)}
      {blob({ width: "30vmax", height: "30vmax", left: "26%", bottom: "-14vmax", background: "radial-gradient(closest-side, rgba(255,159,10,.3), transparent)", "--dur": "28s", "--dx": "5%", "--dy": "-6%" } as CSSProperties)}
    </div>
  );
}
