"use client";

import { Check, Crown, GitMerge, Rocket as RocketIcon, ShieldCheck, Shuffle, Users, Wallet } from "lucide-react";
import { Bug, ORCH_LOOK, type Look } from "../Bug";
import { Reveal } from "../Reveal";
import { Slide } from "../Slide";
import { Features, Glow, Head, Mark, Status, Window, useLive, useSteps, type Feature, type Provider } from "./live";

// Rocket (Zveno repo: ADR 0042, .scratch/rocket/spec.md, .scratch/rocket-and-keys/decisions.md B and mockups R1–R10):
// the toolbar switch and its spend per provider, the mixed Team grouped by provider, and one Task at a time going
// through build, Cross-review by the other provider, the Merge queue and the tests after the merge.

type Agent = { name: string; p: Provider; model: string; task: string; look: Look };
const AGENTS: Agent[] = [
  { name: "Ben", p: "claude", model: "sonnet", task: "checkout UI", look: { hue: 20, pat: "dots" } },
  { name: "Ivy", p: "claude", model: "sonnet", task: "cart store", look: { hue: 235, pat: "stripes" } },
  { name: "Mira", p: "codex", model: "sol", task: "payments API", look: { hue: 150, pat: "chevron" } },
  { name: "Kai", p: "codex", model: "luna", task: "email receipts", look: { hue: 195, pat: "spots" } },
];
const byName = (n: string) => AGENTS.find((a) => a.name === n)!;

// Two Tasks, one by each provider, each reviewed by the other.
const RUNS = [
  { builder: "Mira", reviewer: "Ben", title: "Payments API: charge, refund, webhooks", files: "src/api/payments/**", branch: "zv/mira/payments-api", diff: "+540 −12 · 11 files", tests: 124 },
  { builder: "Ben", reviewer: "Mira", title: "Checkout UI with card validation", files: "src/ui/checkout/**", branch: "zv/ben/checkout-ui", diff: "+386 −40 · 9 files", tests: 131 },
];
const AREAS = [
  { area: "Security", note: "No card data reaches the logs." },
  { area: "Tests", note: "Unit and e2e through the UI pass." },
  { area: "UX and design", note: "A declined card shows a message." },
  { area: "Code quality", note: "Small functions, typed errors." },
  { area: "Databases", note: "The migration is reversible." },
];
const STAGES = ["Build", "Cross-review", "Merge queue", "Merged"] as const;
// Per Task: build, review (five areas, one by one), merge check, merged.
const PER_RUN = [2400, 900, 900, 900, 900, 1600, 2600, 2400];
const DURATIONS = [...PER_RUN, ...PER_RUN];

const FEATURES: Feature[] = [
  { icon: Users, hue: "#ff6a3d", title: "One mixed Team", body: "Claude Code and Codex Agents build one Project together, grouped by provider." },
  { icon: Crown, hue: "#af52de", title: "Opus 5.5 leads", body: "The Orchestrator is always Claude Code on Opus 5.5. It starts Agents of both providers." },
  { icon: ShieldCheck, hue: "#30d158", title: "Cross-review, every Task", body: "The other provider checks security, tests with e2e through the UI, UX and design, code and databases." },
  { icon: GitMerge, hue: "#0a84ff", title: "One merge at a time", body: "Each branch merges after a conflict check, and the tests run after every merge." },
  { icon: Wallet, hue: "#ff9f0a", title: "A spend limit per provider", body: "Each Rocket run has its own limit for Claude Code and for Codex." },
  { icon: Shuffle, hue: "#ff375f", title: "When one runs out", body: "The other provider finishes its Tasks. Their reviews wait, paused, until it is back." },
];

/** The toolbar's Rocket switch, on (the app's warm gradient, the slow glow and two short trails). */
function RocketSwitch() {
  return (
    <span className="flex items-center gap-2">
      <span className="rk-breath relative h-6 w-[46px] shrink-0 overflow-hidden rounded-full" style={{ background: "var(--rocket)" }}>
        <span className="rk-trail" style={{ left: 6, top: 9, width: 9 }} />
        <span className="rk-trail" style={{ left: 9, top: 14, width: 7, animationDelay: ".7s" }} />
        <span className="absolute top-[2px] left-6 flex size-5 items-center justify-center rounded-full" style={{ background: "oklch(0.32 0.08 30 / .5)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.25)", color: "var(--flame)" }}>
          <RocketIcon size={11} />
        </span>
      </span>
      <span className="flex flex-col leading-[1.15]">
        <span className="text-[12px] font-semibold">Rocket</span>
        <span className="font-mono text-[10px] text-faint">on · Claude Code + Codex</span>
      </span>
    </span>
  );
}

function Spend({ p, spent, of }: { p: Provider; spent: number; of: number }) {
  return (
    <span className="flex min-w-[118px] flex-col gap-1">
      <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-muted">
        <Mark p={p} size={12} />
        <span className="text-[var(--text)]">${spent.toFixed(2)}</span> of ${of}
      </span>
      <span className="h-1 overflow-hidden rounded-full bg-chip">
        <span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${(spent / of) * 100}%`, background: p === "claude" ? "rgb(215,119,87)" : "#7c8cff" }} />
      </span>
    </span>
  );
}

function Member({ a, state }: { a: Agent; state: string }) {
  const busy = state !== "";
  return (
    <div className="flex items-center gap-2 py-[3px]">
      <span className="relative shrink-0">
        <Bug look={a.look} mood={busy ? "working" : "idle"} size={26} />
        <span className="absolute -right-0.5 -bottom-0.5">
          <Mark p={a.p} size={11} />
        </span>
      </span>
      <span className="min-w-0">
        <span className="block text-[12.5px] leading-tight font-semibold">{a.name}</span>
        <span className="block truncate font-mono text-[10.5px] text-faint">
          {a.model} · {state || a.task}
        </span>
      </span>
    </div>
  );
}

export function Rocket() {
  const { ref, reduced, running } = useLive();
  const step = useSteps(DURATIONS, running, reduced, 5);
  const runIdx = step < PER_RUN.length ? 0 : 1;
  const s = step % PER_RUN.length; // 0 build, 1–5 review areas, 6 merge check, 7 merged
  const run = RUNS[runIdx]!;
  const builder = byName(run.builder);
  const reviewer = byName(run.reviewer);
  const stage = s === 0 ? 0 : s <= 5 ? 1 : s === 6 ? 2 : 3;
  const shown = s; // review rows passed so far (s = 1..5 while in review)
  const claudeSpend = 1.2 + step * 0.16;
  const codexSpend = 0.5 + step * 0.09;

  const stateOf = (a: Agent) => (a.name === builder.name && stage === 0 ? "building" : a.name === reviewer.name && stage === 1 ? "reviewing" : "");

  return (
    <Slide id="rocket" backdrop={<Glow colors={["rgba(255,106,61,.4)", "rgba(255,55,95,.36)", "rgba(124,140,255,.34)", "rgba(255,159,10,.32)"]} />}>
      <div ref={ref}>
        <Head
          kicker="New in 0.11.0 · Rocket"
          dot="#ff6a3d"
          title="Claude Code and Codex, one Team."
          rest="Each checks the other's work before it merges."
          gradient="linear-gradient(90deg, #ff9f0a, #ff6a3d 35%, #ff375f 65%, #af52de)"
        />

        <div className="mt-6 grid items-start gap-4 lg:grid-cols-[1.08fr_1fr] lg:items-stretch deck:mt-[clamp(12px,2.6vh,28px)] deck:gap-[clamp(10px,1.8vh,18px)]">
          <Reveal className="flex min-w-0">
            <Window label={`Rocket: ${builder.name} builds ${run.title}, ${reviewer.name} reviews it, then it merges`} className="flex w-full min-w-0 flex-col">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-3.5 py-2.5">
                <RocketSwitch />
                <span className="flex gap-3">
                  <Spend p="claude" spent={claudeSpend} of={15} />
                  <Spend p="codex" spent={codexSpend} of={10} />
                </span>
              </div>

              <div className="grid flex-1 grid-cols-1 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                {/* The Rocket team in the sidebar, grouped by provider (R4 A). */}
                <div className="min-w-0 border-line px-3.5 py-2.5 max-sm:border-b sm:border-r">
                  <div className="flex items-center justify-between text-[12px] font-semibold">
                    Rocket team <span className="font-mono text-[10.5px] font-normal text-faint">5</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 rounded-[10px] bg-chip px-2 py-1.5">
                    <span className="relative shrink-0">
                      <Bug look={ORCH_LOOK} mood="working" size={28} />
                      <span className="absolute -right-0.5 -bottom-0.5">
                        <Mark p="claude" size={11} />
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] leading-tight font-semibold">claude</span>
                      <span className="block truncate font-mono text-[10.5px] text-faint">Orchestrator · opus 5.5</span>
                    </span>
                    <span className="flex size-5 items-center justify-center rounded-[6px] text-white" style={{ background: "var(--rocket)" }}>
                      <RocketIcon size={11} />
                    </span>
                  </div>
                  {(["claude", "codex"] as const).map((p) => (
                    <div key={p} className="mt-2">
                      <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.06em] text-faint uppercase">
                        <Mark p={p} size={11} />
                        {p === "claude" ? "Claude Code" : "Codex"} · 2
                      </p>
                      {AGENTS.filter((a) => a.p === p).map((a) => (
                        <Member key={a.name} a={a} state={stateOf(a)} />
                      ))}
                    </div>
                  ))}
                </div>

                {/* One Task's way: build, Cross-review by the other provider, the Merge queue, merged. */}
                <div className="flex min-w-0 flex-col px-3.5 py-2.5">
                  <div className="flex gap-1">
                    {STAGES.map((name, i) => (
                      <span
                        key={name}
                        className={`min-w-0 flex-1 truncate rounded-full px-1.5 py-[3px] text-center text-[10.5px] font-medium whitespace-nowrap transition-colors duration-500 ${
                          i === stage ? "text-white" : i < stage ? "bg-ok-bg text-ok" : "bg-chip text-faint"
                        }`}
                        style={i === stage ? { background: "var(--rocket)" } : undefined}
                      >
                        {name}
                      </span>
                    ))}
                  </div>

                  <div className="mt-2.5 rounded-[12px] border border-line p-2.5" style={{ background: "var(--card-bg)" }}>
                    <div className="flex items-center gap-1.5 text-[12px] font-semibold">
                      <Bug look={builder.look} mood={stage === 0 ? "working" : "idle"} size={20} />
                      {builder.name}
                      <span className="inline-flex items-center gap-1 font-mono text-[10.5px] font-normal text-faint">
                        <Mark p={builder.p} size={11} /> {builder.model}
                      </span>
                    </div>
                    <p className="mt-1 text-[12.5px] leading-snug">{run.title}</p>
                    <p className="mt-0.5 font-mono text-[10.5px] text-faint">{run.files}</p>
                    {stage === 0 && (
                      <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-chip">
                        <span key={step} className="block h-full rounded-full bg-ok" style={{ animation: reduced ? undefined : "scene-progress 2.4s linear forwards", width: reduced ? "60%" : undefined }} />
                      </span>
                    )}
                  </div>

                  <div className="mt-2 overflow-hidden rounded-[12px] border border-line p-2.5 transition-opacity duration-500" style={{ background: "var(--card-bg)", opacity: stage >= 1 ? 1 : 0.5 }}>
                    <div className="flex items-center gap-1.5 text-[12px] font-semibold">
                      Cross-review · by {reviewer.name}
                      <span className="inline-flex items-center gap-1 font-mono text-[10.5px] font-normal text-faint">
                        <Mark p={reviewer.p} size={11} /> {reviewer.model}
                      </span>
                    </div>
                    <div className="mt-1.5 grid gap-1">
                      {AREAS.map((r, i) => (
                        <div key={r.area} className="flex min-w-0 items-center gap-2 text-[11.5px]">
                          <span className="w-[86px] shrink-0 font-medium">{r.area}</span>
                          {i < shown || stage > 1 ? (
                            <>
                              <Status color="var(--ok)">passed</Status>
                              <span className="hidden min-w-0 flex-1 truncate text-faint min-[1100px]:inline">{r.note}</span>
                            </>
                          ) : (
                            <Status color="var(--faint)">{stage === 0 ? "waits for the build" : "checking"}</Status>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2 rounded-[12px] border border-line p-2.5 transition-opacity duration-500" style={{ background: "var(--card-bg)", opacity: stage >= 2 ? 1 : 0.5 }}>
                    <div className="flex items-center justify-between text-[12px] font-semibold">
                      Merge queue
                      <span className="truncate font-mono text-[10.5px] font-normal text-faint">one at a time into main</span>
                    </div>
                    <p className="mt-1 truncate font-mono text-[11px]">
                      #1 {run.branch} <span className="text-faint">{run.diff}</span>
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5 font-mono text-[10.5px]">
                      <span className={`rounded-[6px] px-1.5 py-[2px] ${stage >= 2 ? "bg-ok-bg text-ok" : "bg-chip text-faint"}`}>{stage >= 2 ? `passed · ${reviewer.model}` : "after the review"}</span>
                      <span className={`rounded-[6px] px-1.5 py-[2px] ${stage >= 2 ? "bg-ok-bg text-ok" : "bg-chip text-faint"}`}>git merge-tree{stage >= 2 ? " · clean" : ""}</span>
                      <span className={`rounded-[6px] px-1.5 py-[2px] ${stage === 3 ? "bg-ok-bg text-ok" : "bg-chip text-faint"}`}>
                        {stage === 3 ? `${run.tests} tests passed` : "tests after the merge"}
                      </span>
                    </div>
                  </div>

                  <p className="mt-auto flex items-center gap-1.5 pt-2.5 font-mono text-[10.5px] text-faint">
                    {stage === 3 ? <Check size={12} className="text-ok" /> : <span className="size-1.5 rounded-full" style={{ background: "var(--rocket)" }} />}
                    {stage === 0
                      ? `${builder.name} builds on its own branch and owns its files`
                      : stage === 1
                        ? `${reviewer.p === "claude" ? "Claude Code checks Codex" : "Codex checks Claude Code"} · required`
                        : stage === 2
                          ? "Clean against main: merge next"
                          : `merged · reviewed by ${reviewer.model} · the tests passed on main`}
                  </p>
                </div>
              </div>
            </Window>
          </Reveal>

          <Reveal stagger={60} className="flex min-w-0 flex-col gap-3 deck:gap-[clamp(8px,1.3vh,12px)]">
            <Features items={FEATURES} compact fill />
            <div className="glass-panel rounded-[16px] p-4 deck:p-[clamp(10px,1.8vh,16px)]">
              <p className="text-[12.5px] leading-relaxed text-muted">Rocket sits next to Autopilot and needs both providers connected. Quality first: parallel work is the means, not the goal.</p>
            </div>
          </Reveal>
        </div>
      </div>
    </Slide>
  );
}
