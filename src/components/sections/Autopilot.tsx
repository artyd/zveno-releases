"use client";

import { BatteryCharging, Inbox, Moon, Server, Sun } from "lucide-react";
import { Bug, ORCH_LOOK, type Look } from "../Bug";
import { Reveal } from "../Reveal";
import { Slide } from "../Slide";
import { Features, Glow, Head, Status, Window, useLive, useSteps, type Feature } from "./live";

// Autopilot (Zveno repo: ADR 0033, ADR 0037, packages/ui/src/autopilot/, strings.ts `autopilot`, `remote`, `brief`).
// A scripted night: the toolbar switch is on, the clock runs to the morning while the Tasks get done, then the
// morning shows what happened. The run alternates between this PC and a server, as Run on does.

const TASKS = [
  { title: "Checkout page", branch: "zv/remote/checkout-page", look: { hue: 20, pat: "dots" } as Look },
  { title: "Order emails", branch: "zv/remote/order-emails", look: { hue: 200, pat: "stripes" } as Look },
  { title: "Refund rules", branch: "zv/remote/refund-rules", look: { hue: 150, pat: "chevron" } as Look },
  { title: "Payments provider", branch: "zv/remote/payments", look: { hue: 330, pat: "spots" } as Look },
];

// The night's steps: the clock, how many Tasks are done, whether the last one waits on a question.
const NIGHT = [
  { time: "23:10", done: 0, sky: 0 },
  { time: "01:40", done: 1, sky: 0.2 },
  { time: "03:55", done: 2, sky: 0.45 },
  { time: "05:20", done: 3, sky: 0.7 },
  { time: "07:00", done: 3, sky: 1 },
] as const;
// The sky per step, from deep night to dawn; each layer fades into the next.
const SKIES = [
  "linear-gradient(180deg, #0a0f2e, #1a1a4c 60%, #28215f)",
  "linear-gradient(180deg, #0d1236, #221d58 60%, #352874)",
  "linear-gradient(180deg, #161847, #352a74 58%, #5d3786)",
  "linear-gradient(180deg, #23285e, #5f3a8a 55%, #c95e7c)",
  "linear-gradient(180deg, #6fa8f0, #f5b9a0 62%, #ffb067)",
];
// Stars at fixed, scattered places in the upper sky.
const STARS = [
  [6, 8], [14, 26], [22, 12], [31, 33], [38, 6], [46, 20], [53, 36], [61, 10], [68, 27], [75, 5], [82, 18], [90, 31], [95, 9], [27, 4], [57, 24], [86, 38],
] as const;
const working = (n: number) => (n === 1 ? "1 Agent working" : `${n} Agents working`);
const DURATIONS = [2200, 2200, 2200, 2400, 6200, 2200, 2200, 2200, 2400, 6200] as const;
const SERVER = "build-server";

const FEATURES: Feature[] = [
  {
    icon: Moon,
    hue: "#7d6cf0",
    title: "Works while you sleep",
    body: "Give the Orchestrator a whole Task and go to sleep. The Agents keep running with the screen off and the lid closed.",
  },
  {
    icon: Server,
    hue: "#0a84ff",
    title: "Your server or this PC",
    body: "Run on a server you own, over SSH and git: this PC may sleep. Nothing of Zveno runs there, and no key is copied.",
  },
  {
    icon: Sun,
    hue: "#ff9f0a",
    title: "A morning brief",
    body: "What got done while you were away, what it cost, and what needs you today. Update local project brings the server's work in.",
  },
  {
    icon: Inbox,
    hue: "#30d158",
    title: "Decisions wait for you",
    body: "Questions and approvals wait in the Decision inbox. Nothing is decided or approved for you overnight.",
  },
];

const SAFE = ["Needs the charger", "The lid setting is always put back", "Turns off below 20% battery", "Your .env stays on this PC"];

/** The toolbar's Autopilot switch, on (the app's night gradient, the moon thumb, a few faint stars). */
function NightSwitch({ sub }: { sub: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="ap-breath relative h-6 w-[46px] shrink-0 overflow-hidden rounded-full" style={{ background: "var(--night)" }}>
        <span className="ap-star size-[2px]" style={{ left: 8, top: 6 }} />
        <span className="ap-star size-[2px]" style={{ left: 14, top: 15, animationDelay: "1.1s" }} />
        <span className="ap-star size-[1.5px]" style={{ left: 5, top: 12, animationDelay: "2s" }} />
        <span className="absolute top-[2px] left-6 size-5 rounded-full" style={{ background: "var(--moon)", boxShadow: "inset -3px -2px 0 rgba(0,0,0,.08)" }} />
      </span>
      <span className="flex flex-col leading-[1.15]">
        <span className="text-[12px] font-semibold">Autopilot</span>
        <span className="font-mono text-[10px] text-faint">{sub}</span>
      </span>
    </span>
  );
}

export function Autopilot() {
  const { ref, reduced, running } = useLive();
  const step = useSteps(DURATIONS, running, reduced, 4);
  const remote = step >= 5;
  const night = NIGHT[step % 5]!;
  const morning = step % 5 === 4;
  const sky = night.sky;
  const where = remote ? SERVER : "This PC";


  return (
    <Slide id="autopilot" backdrop={<Glow colors={["rgba(98,84,230,.42)", "rgba(10,132,255,.36)", "rgba(255,159,10,.32)", "rgba(175,82,222,.34)"]} />}>
      <div ref={ref}>
        <Head
          kicker="Autopilot · this PC or your own server"
          dot="#7d6cf0"
          title="Hand over the Task and go to sleep."
          rest="Wake up to finished work and a brief."
          gradient="linear-gradient(90deg, #7d6cf0, #af52de 40%, #ff6f61 70%, #ff9f0a)"
        />

        <div className="mt-6 grid items-start gap-4 lg:grid-cols-[1.08fr_1fr] lg:items-stretch deck:mt-[clamp(12px,2.6vh,28px)] deck:gap-[clamp(10px,1.8vh,18px)]">
          <Reveal className="flex min-w-0">
            <Window label={`Autopilot running on ${where} through the night, ${night.time}`} className="flex w-full min-w-0 flex-col">
              {/* The toolbar with the switch and Run on. */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3.5 py-2.5">
                <NightSwitch sub={morning ? (remote ? `ended on ${SERVER}` : "ended · Tasks done") : remote ? `on · ${SERVER}` : "on · ends when done"} />
                <span className="flex items-center gap-2">
                  <span className="font-mono text-[10.5px] text-faint uppercase">Run on</span>
                  <span className="flex rounded-[9px] bg-chip p-[2px] text-[11.5px]">
                    {["This PC", SERVER].map((w) => (
                      <span key={w} className={`rounded-[7px] px-2 py-[3px] transition-colors duration-500 ${w === where ? "bg-sel font-medium shadow-[var(--sel-shadow)]" : "text-muted"}`}>
                        {w}
                      </span>
                    ))}
                  </span>
                </span>
              </div>

              {/* The strip under the toolbar while it runs, then when it ended. */}
              <div className="px-3.5 pt-2.5">
                <div
                  className="flex items-center gap-2 rounded-[10px] px-3 py-1.5 font-mono text-[11px] text-white transition-[background] duration-700"
                  style={{ background: morning ? "linear-gradient(90deg, oklch(0.62 0.14 60), oklch(0.6 0.16 25))" : "var(--night)" }}
                >
                  {morning ? <Sun size={13} className="shrink-0" /> : <Moon size={13} className="shrink-0" />}
                  <span className="truncate">
                    {morning
                      ? remote
                        ? `Good morning · Autopilot ended at 06:12 on ${SERVER} · 3 of 4 done`
                        : "Good morning · Autopilot ended at 06:12 · the Tasks are done"
                      : remote
                        ? `Autopilot · on ${SERVER} · 4 Tasks · ${night.done} done · this PC may sleep`
                        : `Autopilot · ${working(4 - night.done)} · closing the lid keeps it running`}
                  </span>
                </div>
              </div>

              {/* The night sky and the Tasks under it. */}
              <div className="relative m-3.5 mt-2.5 flex-1 overflow-hidden rounded-[14px]" style={{ minHeight: "clamp(250px, 40vh, 380px)" }}>
                {SKIES.map((bg, i) => (
                  <span key={i} aria-hidden="true" className="absolute inset-0 transition-opacity duration-[1800ms]" style={{ background: bg, opacity: i === step % 5 ? 1 : 0 }} />
                ))}
                {!morning && (
                  <div aria-hidden="true" className="absolute inset-0">
                    {STARS.map(([x, y], i) => (
                      <span key={i} className="ap-star" style={{ width: i % 3 ? 2 : 3, height: i % 3 ? 2 : 3, left: `${x}%`, top: `${y}%`, animationDelay: `${(i % 5) * 0.6}s`, opacity: 1 - sky * 0.8 }} />
                    ))}
                  </div>
                )}
                {/* The moon sets and the sun rises along the same arc. */}
                <span
                  aria-hidden="true"
                  className="absolute size-9 rounded-full transition-all duration-[1800ms]"
                  style={{
                    left: `${12 + sky * 70}%`,
                    top: `${5 + Math.pow(sky - 0.5, 2) * 30}%`,
                    background: morning ? "radial-gradient(circle, #fff6d6, #ffc35a 60%, rgba(255,160,60,0))" : "var(--moon)",
                    boxShadow: morning ? "0 0 40px 14px rgba(255,190,90,.55)" : "0 0 24px 6px rgba(255,255,240,.25)",
                  }}
                />
                <span className="absolute top-2.5 right-3 rounded-[8px] bg-black/35 px-2 py-0.5 font-mono text-[12px] text-white backdrop-blur-md">{night.time}</span>

                {!morning ? (
                  <div className="absolute inset-x-3 bottom-3 grid gap-1.5">
                    {TASKS.map((t, i) => {
                      const done = i < night.done;
                      const asks = !done && i === 3 && night.done >= 3;
                      return (
                        <div key={t.title} className="flex items-center gap-2.5 rounded-[11px] bg-black/40 px-2.5 py-1.5 text-white backdrop-blur-md">
                          <Bug look={t.look} mood={done ? "idle" : asks ? "waiting" : "working"} size={24} badge={done ? "done" : asks ? "q" : undefined} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12.5px] font-medium">{t.title}</span>
                            <span className="block truncate font-mono text-[10.5px] text-white/60">{remote ? t.branch : "Agent on this PC"}</span>
                          </span>
                          {done ? (
                            <Status color="#5fe08a">done</Status>
                          ) : asks ? (
                            <Status color="#ffc45a">{remote ? "the CLI there asks" : "waits in the Inbox"}</Status>
                          ) : (
                            <Status color="#9ecbff">working</Status>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : remote ? (
                  <Back />
                ) : (
                  <Brief />
                )}
              </div>
            </Window>
          </Reveal>

          <Reveal stagger={60} className="flex min-w-0 flex-col gap-3 deck:gap-[clamp(8px,1.3vh,12px)]">
            <Features items={FEATURES} />
            <div className="glass-panel rounded-[16px] p-4 deck:p-[clamp(10px,1.8vh,16px)]">
              <p className="label !text-[10.5px]">Safe to leave on</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SAFE.map((s, i) => (
                  <span key={s} className="inline-flex items-center gap-1.5 rounded-[8px] px-2 py-[3px] text-[12px]" style={{ background: `oklch(0.7 0.14 ${260 + i * 35} / 0.15)` }}>
                    {i === 0 && <BatteryCharging size={13} className="text-ok" />}
                    {s}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[12px] text-faint">Windows first. On a server, only ssh, git, tmux and your own signed-in CLI run there.</p>
            </div>
          </Reveal>
        </div>
      </div>
    </Slide>
  );
}

/** The Morning brief after a night on this PC (strings.ts `brief`). */
function Brief() {
  return (
    <div className="absolute inset-x-3 bottom-3 rounded-[14px] p-3.5 text-[var(--text)] shadow-[var(--frame-shadow)] [animation:rise_.6s_cubic-bezier(.2,.7,.2,1)_both]" style={{ background: "var(--step-bg)" }}>
      <div className="flex items-center gap-2.5">
        <Bug look={ORCH_LOOK} mood="idle" size={30} />
        <span>
          <span className="block text-[16px] leading-tight font-semibold tracking-[-0.01em]">Good morning</span>
          <span className="block text-[12px] text-muted">While you were away agents finished 3 tasks in 1 project. 2 things wait for you.</span>
        </span>
      </div>
      <p className="label mt-2.5 !text-[10px]">Needs you today</p>
      <div className="mt-1 grid gap-1">
        {[
          { kind: "Decide", text: "Payments provider: Stripe or Paddle?" },
          { kind: "Review", text: "Deploy preview of the checkout page" },
        ].map((n) => (
          <div key={n.text} className="flex items-center gap-2 rounded-[9px] bg-chip px-2.5 py-1.5 text-[12.5px]">
            <span className="min-w-0 flex-1 truncate">{n.text}</span>
            <span className="rounded-[7px] bg-strong px-2 py-[2px] text-[11px] font-semibold text-strong-text">{n.kind}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 font-mono text-[11px] text-faint">Yesterday · shop-app · 3 tasks · $3.80</p>
    </div>
  );
}

/** The welcome-back card after a night on a server (strings.ts `remote`). */
function Back() {
  return (
    <div className="absolute inset-x-3 bottom-3 rounded-[14px] p-3.5 text-[var(--text)] shadow-[var(--frame-shadow)] [animation:rise_.6s_cubic-bezier(.2,.7,.2,1)_both]" style={{ background: "var(--step-bg)" }}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[16px] font-semibold tracking-[-0.01em]">While you were away</span>
        <span className="font-mono text-[11px] text-faint">23:10 – 06:12 on {SERVER}</span>
      </div>
      <div className="mt-2 grid gap-1">
        {TASKS.map((t, i) => (
          <div key={t.title} className="flex items-center gap-2 font-mono text-[11.5px]">
            <span className="min-w-0 flex-1 truncate">{t.branch}</span>
            {i < 3 ? <Status color="var(--ok)">done · merges cleanly</Status> : <Status color="var(--warn)">not finished</Status>}
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <span className="rounded-[9px] bg-strong px-3 py-1.5 text-[12.5px] font-semibold text-strong-text">Update local project</span>
        <span className="text-[11.5px] text-muted">Nothing changes until you press Merge</span>
      </div>
    </div>
  );
}
