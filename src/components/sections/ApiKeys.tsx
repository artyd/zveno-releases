"use client";

import { AlertTriangle, GripVertical, KeyRound, ListOrdered, LockKeyhole, Pencil, Plus, Receipt, Rows3 } from "lucide-react";
import { Reveal } from "../Reveal";
import { Slide } from "../Slide";
import { Features, Glow, Head, Mark, Status, Window, useLive, useSteps, type Feature } from "./live";

// API keys (Zveno repo: .scratch/rocket-and-keys/decisions.md A, research.md A, mockups K1–K8): the Claude Code card
// in Settings → Connections with its keys in order. The plan is used first; at its limit the keys take over in turn;
// when the last is out, work stops and the card names every key and why. Keys belong to one company's teams.

type KeyState = "ready" | "use" | "credit" | "limit" | "cool";
const STATE: Record<KeyState, { text: string; color: string }> = {
  ready: { text: "Ready", color: "var(--faint)" },
  use: { text: "In use", color: "var(--ok)" },
  credit: { text: "Out of credit", color: "var(--err)" },
  limit: { text: "At its limit", color: "var(--warn)" },
  cool: { text: "Cooling down until 15:40", color: "var(--warn)" },
};

const KEYS = [
  { name: "Sales", tail: "sk-ant-…4f2a", of: 100, start: 38 },
  { name: "Purchasing", tail: "sk-ant-…9c1e", of: 100, start: 12 },
  { name: "Logistics", tail: "sk-ant-…77ab", of: 50, start: 9 },
  { name: "Marketing", tail: "sk-ant-…0d3f", of: 50, start: 4 },
];

// Each step: the plan line, every key's state and spend, and the Feed's line for what just happened.
type Step = { plan: string; planWarn: boolean; keys: [KeyState, number][]; line: string | null; stopped?: boolean };
const STEPS: Step[] = [
  { plan: "Subscription · Max · on the plan now", planWarn: false, keys: KEYS.map((k) => ["ready", k.start]), line: null },
  {
    plan: "Subscription · Max · at its limit until 15:45",
    planWarn: true,
    keys: [["use", 72], ["ready", 12], ["ready", 9], ["ready", 4]],
    line: "14:58 · Claude Max at its limit · Tasks moved to the API keys · key Sales",
  },
  {
    plan: "Subscription · Max · at its limit until 15:45",
    planWarn: true,
    keys: [["credit", 100], ["use", 64], ["ready", 9], ["ready", 4]],
    line: "15:02 · Sales out of credit · moved to Purchasing",
  },
  {
    plan: "Subscription · Max · at its limit until 15:45",
    planWarn: true,
    keys: [["credit", 100], ["limit", 100], ["use", 31], ["ready", 4]],
    line: "15:20 · Purchasing at its limit · moved to Logistics",
  },
  {
    plan: "Subscription · Max · at its limit until 15:45",
    planWarn: true,
    keys: [["credit", 100], ["limit", 100], ["cool", 38], ["use", 33]],
    line: "15:24 · Logistics at its rate limit · moved to Marketing",
  },
  {
    plan: "Subscription · Max · at its limit until 15:45",
    planWarn: true,
    keys: [["credit", 100], ["limit", 100], ["cool", 38], ["credit", 50]],
    line: "15:31 · Marketing out of credit · no key left",
    stopped: true,
  },
];
const DURATIONS = [2600, 3000, 3000, 2800, 2800, 6000] as const;

const FEATURES: Feature[] = [
  { icon: Receipt, hue: "#30d158", title: "Your plan first", body: "Your Claude or ChatGPT plan is used first. The keys take over only at its limit, by themselves." },
  { icon: ListOrdered, hue: "#0a84ff", title: "In your order", body: "One key at a time, top to bottom. When a key runs out, the next one takes over." },
  { icon: Pencil, hue: "#ff9f0a", title: "Spend you can correct", body: "Zveno counts the spend on each key from every reply. Set a number by hand when you know better." },
  { icon: AlertTriangle, hue: "#ff375f", title: "Never silent", body: "When every key is out, work stops and Zveno says which keys ran out and why." },
];

const REASON: Partial<Record<KeyState, string>> = {
  credit: "credit balance too low",
  limit: "spend limit reached",
  cool: "rate limit · back at 15:40",
};

export function ApiKeys() {
  const { ref, reduced, running } = useLive();
  const step = useSteps(DURATIONS, running, reduced, 2);
  const now = STEPS[step]!;
  const lines = STEPS.slice(1, step + 1)
    .map((s) => s.line)
    .filter(Boolean)
    .slice(-3) as string[];

  return (
    <Slide id="keys" backdrop={<Glow colors={["rgba(255,159,10,.38)", "rgba(48,209,88,.32)", "rgba(10,132,255,.36)", "rgba(255,55,95,.28)"]} />}>
      <div ref={ref}>
        <Head
          kicker="New in 0.11.0 · API keys"
          dot="#ff9f0a"
          title="Keep working past your plan's limit."
          rest="Your company's API keys take over, in your order."
          gradient="linear-gradient(90deg, #ffb340, #ff9f0a 30%, #30d158 65%, #0a84ff)"
        />

        <div className="mt-6 grid items-start gap-4 lg:grid-cols-[1.08fr_1fr] lg:items-stretch deck:mt-[clamp(12px,2.6vh,28px)] deck:gap-[clamp(10px,1.8vh,18px)]">
          <Reveal className="flex min-w-0">
            <Window label="Settings, Connections: Claude Code's plan, then four team keys used in turn until every key is out" className="flex w-full min-w-0 flex-col p-3.5 deck:p-[clamp(10px,1.8vh,16px)]">
              <div className="flex items-center gap-2.5">
                <Mark p="claude" size={30} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] leading-tight font-semibold">Claude Code</span>
                  <span className="block font-mono text-[11px] text-faint">Orchestrator and 4 Agents</span>
                </span>
                <span className="font-mono text-[10.5px] text-faint">Settings · Connections</span>
              </div>

              <div className="mt-2.5 flex items-center gap-3 rounded-[9px] bg-chip px-2.5 py-1.5 text-[12px]">
                <span className="text-muted">Sign-in</span>
                <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] transition-colors" style={{ color: now.planWarn ? "var(--warn)" : undefined }}>
                  {now.plan}
                </span>
              </div>

              <div className="mt-2.5 flex items-center gap-2 text-[12.5px] font-semibold">
                <KeyRound size={14} className="text-muted" /> API keys
                <span className="rounded-[6px] bg-chip px-1.5 font-mono text-[10.5px] font-normal text-muted">4 keys</span>
                <span className="ml-auto font-mono text-[10.5px] font-normal text-faint">used in turn, top to bottom</span>
              </div>

              <div className="mt-1.5 overflow-hidden rounded-[11px] border border-line">
                {KEYS.map((k, i) => {
                  const [state, spent] = now.keys[i]!;
                  const st = STATE[state];
                  const pct = Math.min(100, (spent / k.of) * 100);
                  return (
                    <div key={k.name} className={`flex items-center gap-2 px-2 py-[7px] transition-colors deck:py-[clamp(5px,1vh,9px)] duration-500 ${i ? "border-t border-line" : ""} ${state === "use" ? "bg-ok-bg" : ""}`}>
                      <GripVertical size={13} className="shrink-0 text-faint" />
                      <span className="w-3 shrink-0 font-mono text-[11px] text-faint">{i + 1}</span>
                      <span className="w-[86px] shrink-0">
                        <span className="block text-[12.5px] leading-tight font-medium">{k.name}</span>
                        <span className="block font-mono text-[10px] text-faint">{k.tail}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <Status color={st.color} className="max-w-full truncate">
                          {st.text}
                        </Status>
                      </span>
                      <span className="w-[92px] shrink-0 max-[420px]:w-[70px]">
                        <span className="flex items-center gap-1 font-mono text-[10.5px]">
                          <span className="font-semibold">${Math.round(spent)}</span>
                          <span className="text-faint">of ${k.of}</span>
                          <Pencil size={10} className="ml-auto text-faint" />
                        </span>
                        <span className="mt-1 block h-[3px] overflow-hidden rounded-full bg-chip">
                          <span
                            className="block h-full rounded-full transition-[width] duration-[1200ms]"
                            style={{ width: `${pct}%`, background: state === "credit" ? "var(--err)" : state === "limit" || state === "cool" ? "var(--warn)" : "var(--accent)" }}
                          />
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 flex items-center gap-2 text-[12px]">
                <span className="inline-flex items-center gap-1 rounded-[8px] border border-line-strong px-2 py-[3px] font-medium">
                  <Plus size={12} /> Add key
                </span>
                <span className="ml-auto font-mono text-[10.5px] text-faint">When the plan runs out, use these keys</span>
                <span className="relative h-[18px] w-8 shrink-0 rounded-full bg-ok">
                  <span className="absolute top-[2px] right-[2px] size-[14px] rounded-full bg-white" />
                </span>
              </div>

              {/* What the Orchestrator's Feed says after each move, and the stop when every key is out (K5, K6). */}
              <div className="mt-2.5 flex flex-1 flex-col rounded-[11px] border border-line px-2.5 py-2" style={{ minHeight: "clamp(116px, 18vh, 168px)" }}>
                <p className="flex items-center justify-between font-mono text-[10px] tracking-[0.06em] text-faint uppercase">
                  Feed · claude <span className="normal-case">the switch happens by itself</span>
                </p>
                {now.stopped ? (
                  <div className="mt-1.5 rounded-[10px] border p-2.5 [animation:rise_.5s_cubic-bezier(.2,.7,.2,1)_both]" style={{ borderColor: "color-mix(in oklab, var(--err) 55%, transparent)", background: "var(--err-bg)" }}>
                    <p className="flex items-center gap-1.5 text-[12.5px] font-semibold">
                      <AlertTriangle size={14} className="text-err" /> All Anthropic keys are out · work stopped
                    </p>
                    <div className="mt-1.5 grid gap-[3px] font-mono text-[10.5px]">
                      {KEYS.map((k, i) => {
                        const state = now.keys[i]![0];
                        return (
                          <span key={k.name} className="flex gap-2">
                            <span className="w-[74px] shrink-0 font-sans text-[11.5px] font-medium">{k.name}</span>
                            <span className="min-w-0 flex-1 truncate text-muted">{REASON[state]}</span>
                            <span style={{ color: STATE[state].color }}>{STATE[state].text.replace(" until 15:40", "")}</span>
                          </span>
                        );
                      })}
                    </div>
                    <p className="mt-1.5 text-[11.5px] text-muted">Claude Max is back at 15:45. 3 Tasks are paused until then, or until you add a key.</p>
                  </div>
                ) : (
                  <div className="mt-1.5 grid gap-1.5">
                    {lines.length === 0 ? (
                      <p className="vcall-line flex items-center gap-1.5 font-mono text-[10.5px] text-ok">
                        <span className="size-1.5 rounded-full bg-ok" /> 14:40 · Claude Max · on the plan now · the keys wait
                      </p>
                    ) : (
                      lines.map((l, i) => (
                        <p key={l} className={`vcall-line flex items-start gap-1.5 font-mono text-[10.5px] ${i === lines.length - 1 ? "text-warn" : "text-faint"}`}>
                          <KeyRound size={11} className="mt-[2px] shrink-0" /> {l}
                        </p>
                      ))
                    )}
                  </div>
                )}
              </div>
            </Window>
          </Reveal>

          <Reveal stagger={60} className="flex min-w-0 flex-col gap-3 deck:gap-[clamp(8px,1.3vh,12px)]">
            <Features items={FEATURES} fill />
            <div className="glass-panel rounded-[16px] p-4 deck:p-[clamp(10px,1.8vh,16px)]">
              <p className="flex items-center gap-2 text-[14px] font-semibold">
                <LockKeyhole size={15} className="text-accent" /> Kept on this PC
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
                Keys stay in this PC&apos;s keychain. Key traffic goes through a gateway on this PC, at 127.0.0.1 with a token per run; your plan&apos;s sign-in never goes through it.
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-[12px] text-faint">
                <Rows3 size={13} /> For your company&apos;s own keys, one per team. Claude Code and Codex each have their list.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </Slide>
  );
}
