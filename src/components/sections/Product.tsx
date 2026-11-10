"use client";

import { Check } from "lucide-react";
import { useRef, type CSSProperties, type ReactNode } from "react";
import { StoryBars, useAutoplay } from "../Autoplay";
import { Bug, ORCH_LOOK, type Badge, type Look, type Mood } from "../Bug";
import { Reveal } from "../Reveal";
import { Shot, WindowFrame } from "../Shot";
import { Slide } from "../Slide";

const SCREENS = [
  {
    id: "feed",
    label: "Feed",
    shot: "feed-open",
    caption: "Every step, in plain sight.",
    alt: "Feed tab: an agent's messages with Read, Plan, Edit, Write and Run steps, one Edit open on its diff, and the team of agents in the sidebar.",
  },
  {
    id: "board",
    label: "Board",
    shot: "board",
    caption: "All tasks across the team.",
    alt: "Board tab: tasks in Queued, In progress, Blocked and Done, each with its agent's mascot, model, tokens and cost.",
  },
  {
    id: "inbox",
    label: "Decisions",
    shot: "inbox",
    caption: "One inbox for what needs you.",
    alt: "Decision inbox: an agent asks where reminders should run, with Send answer, Open agent and Skip.",
  },
  {
    id: "project",
    label: "Project",
    shot: "project",
    caption: "Know how close you are to MVP.",
    alt: "Project tab: readiness for MVP, time and cost to get there, and the items to reach it with the agent on each.",
  },
  {
    id: "preview",
    label: "Preview",
    shot: "preview",
    caption: "See it as it is built, on every screen size.",
    alt: "Preview tab: the app from its dev server on desktop, laptop, tablet and phone side by side; Design, iOS, Android, Video and Artifacts are the other targets.",
  },
  {
    id: "library",
    label: "Library",
    shot: "library",
    caption: "Skills your agents follow.",
    alt: "Library tab: the skills in this project, what each one does and when it runs, its use this week and a switch.",
  },
  {
    id: "connections",
    label: "Connections",
    shot: "connections",
    caption: "Decide what each connection may do.",
    alt: "Settings, Connections: cards for Claude Code, Codex, Gemini CLI, Grok CLI, GitHub and Vercel, each with its logo, sign-in, keys and an Access level.",
  },
  {
    id: "computer",
    label: "Computer use",
    shot: "computer-use",
    caption: "Agents use your apps, within your switches.",
    alt: "Settings, Computer use: switches for clicking and typing, browsers, apps and files, terminals, system settings and administrator windows.",
  },
] as const;

const LABELS = SCREENS.map((s) => s.label);
const INTERVAL = 3500;

// Every popup stays up and keeps floating around the screenshot; only the screens change.

const ROSTER: { name: string; look: Look; mood: Mood; badge?: Badge; status: string; tone: string }[] = [
  { name: "Orchestrator", look: ORCH_LOOK, mood: "idle", status: "lead", tone: "text-answer bg-answer-bg" },
  { name: "frontend", look: { hue: 250, pat: "dots" }, mood: "working", status: "working", tone: "text-ok bg-ok-bg" },
  { name: "backend", look: { hue: 160, pat: "chevron" }, mood: "waiting", badge: "q", status: "asks you", tone: "text-warn bg-warn-bg" },
  { name: "tests", look: { hue: 330, pat: "spots" }, mood: "queued", status: "queued", tone: "text-accent bg-accent-bg" },
];

// A small glass card around the screenshot. The outer layer floats; the inner one fades in and out.
function Popup({
  on,
  className,
  float,
  children,
}: {
  on: boolean;
  className: string;
  float: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div aria-hidden={!on} className={`pointer-events-none absolute z-10 ${className}`}>
      <div className="pop-float" style={float}>
        <div
          className={`glass-window rounded-[14px] transition-[opacity,transform,visibility] duration-500 ease-out ${
            on ? "visible translate-y-0 scale-100 opacity-100" : "invisible translate-y-2.5 scale-[0.96] opacity-0"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function Team() {
  return (
    <div className="w-[196px] p-2.5">
      <p className="label px-1 pb-1.5 !text-[10px]">Your team</p>
      <ul className="space-y-1">
        {ROSTER.map((a) => (
          <li key={a.name} className="flex items-center gap-2 px-1">
            <Bug look={a.look} mood={a.mood} badge={a.badge} size={22} />
            <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">{a.name}</span>
            <span className={`rounded-[5px] px-1.5 py-px font-mono text-[9.5px] ${a.tone}`}>{a.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Deploy() {
  return (
    <div className="w-[214px] p-3 max-[1179px]:w-[188px]">
      <p className="font-mono text-[10px] text-faint">
        <span className="font-semibold tracking-wider text-warn">DEPLOY</span> · deploy-bot
      </p>
      <p className="mt-1 text-[12.5px] leading-snug font-semibold">Release v0.4.0 to production?</p>
      <p className="mt-1 font-mono text-[10.5px] text-muted">
        <span className="text-ok">✓</span> CI green · 41 tests
      </p>
      <div className="mt-2 flex gap-1.5">
        <span className="rounded-[7px] bg-strong px-2.5 py-1 text-[11px] font-semibold text-strong-text">Approve</span>
        <span className="rounded-[7px] border border-line-strong px-2.5 py-1 text-[11px] font-semibold">Reject</span>
      </div>
    </div>
  );
}

function Question() {
  return (
    <div className="w-[214px] p-3">
      <div className="flex items-center gap-1.5">
        <Bug look={{ hue: 160, pat: "chevron" }} mood="waiting" size={18} />
        <span className="font-mono text-[10px] font-semibold tracking-wider text-answer">QUESTION</span>
        <span className="font-mono text-[10px] text-faint">backend</span>
      </div>
      <p className="mt-1.5 text-[12.5px] leading-snug font-medium">Where should reminders run?</p>
      <div className="mt-2 flex gap-1.5">
        <span className="rounded-[7px] bg-strong px-2.5 py-1 text-[11px] font-semibold text-strong-text">Send answer</span>
        <span className="rounded-[7px] border border-line-strong px-2.5 py-1 text-[11px] font-semibold">Skip</span>
      </div>
    </div>
  );
}

function Toast() {
  return (
    <div className="flex w-[200px] items-center gap-2.5 px-3 py-2.5 max-[1179px]:w-[184px]">
      <Bug look={{ hue: 330, pat: "spots" }} mood="still" badge="done" size={24} />
      <span className="min-w-0">
        <span className="block text-[12px] leading-tight font-semibold">tests finished</span>
        <span className="flex items-center gap-1 font-mono text-[10.5px] text-ok">
          <Check size={11} strokeWidth={2.5} /> 14 passed
        </span>
      </span>
      <span className="ml-auto self-start font-mono text-[9.5px] text-faint">now</span>
    </div>
  );
}

function PreviewThumb() {
  return (
    <div className="w-[208px] p-2">
      <div className="flex items-center gap-1.5 px-1 pb-1.5">
        <span className="size-1.5 rounded-full bg-ok" />
        <span className="text-[11.5px] font-semibold">Preview</span>
        <span className="ml-auto font-mono text-[10px] text-faint">Desktop · 1440</span>
      </div>
      <div className="overflow-hidden rounded-[8px] border border-line">
        <Shot name="preview" alt="" sizes="240px" />
      </div>
    </div>
  );
}

export function Product() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { index: active, setIndex, next, playing, reduced, bind } = useAutoplay(SCREENS.length, rootRef);
  const float = (fd: number, fdel: number, r0: number, r1: number) =>
    ({ "--fd": `${fd}s`, "--fdel": `${fdel}s`, "--r0": `${r0}deg`, "--r1": `${r1}deg` }) as CSSProperties;

  return (
    <Slide id="tour" bodyClassName="max-w-[1960px]">
      <Reveal className="mx-auto max-w-6xl text-center">
        <p className="label">Product</p>
        <h2 className="mt-3 text-[30px] leading-[1.12] font-semibold tracking-[-0.03em] text-balance sm:text-[40px] deck:mt-[clamp(4px,1vh,10px)] deck:text-[clamp(22px,3.7vh,36px)]">
          Built for watching a team work. <span className="text-faint">And stepping in only when it matters.</span>
        </h2>
      </Reveal>

      <Reveal delay={120} className="mt-6 deck:mt-[clamp(12px,2.4vh,26px)]">
        <div
          ref={rootRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="Product tour"
          {...bind}
          style={{ "--fit-h-deck": "calc(100svh - var(--slide-pt) - var(--slide-pb) - 150px)" } as CSSProperties}
        >
          <div className="tour-stage relative">
            <WindowFrame className="tour-shot">
              <div id="tour-shots" aria-live={playing ? "off" : "polite"} className="grid">
                {SCREENS.map((s, i) => (
                  <div
                    key={s.id}
                    aria-hidden={i !== active}
                    className={`col-start-1 row-start-1 transition-opacity duration-700 ease-in-out ${
                      i === active ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <Shot name={s.shot} alt={s.alt} sizes="(min-width: 1200px) 1240px, 100vw" priority={i === 0} />
                  </div>
                ))}
              </div>
            </WindowFrame>

            <Popup on className="pop-l top-[7%] max-[1179px]:hidden" float={float(7.2, 0, -0.6, 0.4)}>
              <Team />
            </Popup>
            <Popup on className="pop-l bottom-[9%] origin-bottom-left max-sm:scale-[0.78]" float={float(6.4, -2.1, 0.5, -0.4)}>
              <Toast />
            </Popup>
            <Popup on className="pop-r top-[6%] max-[1179px]:hidden" float={float(7.8, -1.2, 0.5, -0.5)}>
              <Question />
            </Popup>
            <Popup on className="pop-r top-[41%] max-[1179px]:hidden" float={float(8.2, -3.3, -0.4, 0.5)}>
              <PreviewThumb />
            </Popup>
            <Popup on className="pop-r bottom-[8%] max-md:hidden" float={float(6.9, -4.2, -0.5, 0.5)}>
              <Deploy />
            </Popup>
          </div>

          <div className="tour-stage">
            <div className="tour-shot mt-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-6 deck:mt-[clamp(8px,1.6vh,16px)]">
              <div className="grid min-w-0 flex-1">
                {SCREENS.map((s, i) => (
                  <p
                    key={s.id}
                    aria-hidden={i !== active}
                    className={`col-start-1 row-start-1 truncate text-[15px] transition-[opacity,transform] duration-500 ${
                      i === active ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
                    }`}
                  >
                    <span className="mr-2.5 font-mono text-[11px] tracking-[0.06em] text-accent uppercase">{s.label}</span>
                    <span className="font-medium">{s.caption}</span>
                  </p>
                ))}
              </div>
              <StoryBars
                labels={LABELS}
                index={active}
                ms={INTERVAL}
                playing={playing}
                reduced={reduced}
                onDone={next}
                onSelect={setIndex}
                label="Product screens"
                controls="tour-shots"
                className="w-full sm:w-[min(46%,420px)] sm:shrink-0"
              />
            </div>
          </div>
        </div>
      </Reveal>
    </Slide>
  );
}
