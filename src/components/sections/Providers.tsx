import type { CSSProperties } from "react";
import { Bug, ORCH_LOOK, type Look, type Mood } from "../Bug";
import { Reveal } from "../Reveal";
import { SectionHead } from "../SectionHead";
import { Slide } from "../Slide";

const PROVIDERS = [
  { name: "Claude Code", by: "Anthropic", models: "Opus 5.5 · Fable 5.2 · Sonnet 5.5 · Haiku 5.5", plan: "Claude subscription or API key", on: true, hue: 45 },
  { name: "Codex CLI", by: "OpenAI", models: "GPT-6.1 Sol · GPT-6.1 Terra · GPT-6 Astra", plan: "ChatGPT subscription or API key", on: true, hue: 165 },
  { name: "Gemini CLI", by: "Google", models: "Gemini 4 · Gemini 3.8 Flash", plan: "Google account or API key", on: false, hue: 258 },
  { name: "Grok Build", by: "xAI", models: "Grok 4.6", plan: "X account or API key", on: false, hue: 300 },
];

const hueOf = (name: string) => PROVIDERS.find((p) => p.name === name)?.hue ?? 250;

// One mixed team: the Orchestrator hands tasks to agents that each run on their own provider and model.
const AGENTS: { name: string; provider: string; model: string; task: string; look: Look; mood: Mood }[] = [
  { name: "frontend", provider: "Claude Code", model: "Sonnet 5.5", task: "UI and routes", look: { hue: 250, pat: "dots" }, mood: "working" },
  { name: "backend-api", provider: "Codex CLI", model: "GPT-6.1 Sol", task: "API and database", look: { hue: 160, pat: "chevron" }, mood: "working" },
  { name: "tests", provider: "Claude Code", model: "Haiku 5.5", task: "Unit and e2e tests", look: { hue: 330, pat: "spots" }, mood: "queued" },
  { name: "reviewer", provider: "Codex CLI", model: "GPT-6 Astra", task: "Diff review", look: { hue: 30, pat: "stripes" }, mood: "idle" },
];

function Tag({ provider, model }: { provider: string; model: string }) {
  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 rounded-[6px] bg-chip px-1.5 py-0.5 font-mono text-[10.5px] whitespace-nowrap text-muted"
      style={{ "--p": `oklch(0.66 0.14 ${hueOf(provider)})` } as CSSProperties}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-[var(--p)]" />
      <span className="truncate">
        {provider} · {model}
      </span>
    </span>
  );
}

function Team() {
  return (
    <div className="glass-panel relative overflow-hidden rounded-[20px] p-[clamp(10px,2vh,20px)]">
      <div className="flex items-center justify-between">
        <p className="label">One team, mixed providers</p>
        <p className="font-mono text-[11px] text-faint">model and effort per agent</p>
      </div>

      <div className="mt-[clamp(6px,1.4vh,12px)] flex justify-center">
        <div className="card flex items-center gap-3 rounded-[14px] px-4 py-2.5">
          <Bug look={ORCH_LOOK} mood="idle" size={40} />
          <span className="text-left">
            <span className="block text-[14.5px] leading-tight font-semibold">Orchestrator</span>
            <span className="mt-1 block">
              <Tag provider="Claude Code" model="Opus 5.5" />
            </span>
          </span>
        </div>
      </div>

      {/* The links: each curve runs from the Orchestrator to one agent. */}
      <div className="relative h-[clamp(40px,9vh,88px)]">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
          {AGENTS.map((a, i) => {
            const x = 12.5 + i * 25;
            const d = `M50 0 C50 55, ${x} 45, ${x} 100`;
            return (
              <g key={a.name} fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke">
                <path d={d} stroke="var(--line-strong)" strokeWidth={1.5} strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                <path
                  d={d}
                  stroke={`oklch(0.66 0.14 ${hueOf(a.provider)})`}
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                  style={{ animation: `linkPulse 3.2s ease-in-out ${i * 0.55}s infinite` }}
                />
              </g>
            );
          })}
        </svg>
        <span className="glass-surface absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full px-2.5 py-0.5 font-mono text-[10.5px] text-muted">
          hands out tasks
        </span>
      </div>

      <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {AGENTS.map((a) => (
          <li key={a.name} className="card flex min-w-0 items-center gap-3 rounded-[14px] p-2.5">
            <Bug look={a.look} mood={a.mood} size={36} />
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-[13.5px] leading-tight font-semibold">{a.name}</span>
              <span className="block truncate text-[11.5px] text-faint">{a.task}</span>
              <span className="mt-1 block">
                <Tag provider={a.provider} model={a.model} />
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Providers() {
  return (
    <Slide id="providers">
      <SectionHead
        label="Providers"
        title="Works with the agents you already pay for."
        rest="Mix them in one team, per agent."
      />
      <Reveal
        stagger={80}
        className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 deck:mt-[clamp(10px,2.4vh,28px)] deck:gap-[clamp(8px,1.6vh,16px)]"
      >
        {PROVIDERS.map((p) => (
          <div key={p.name} className="glass-panel flex flex-col rounded-[16px] p-4 deck:p-[clamp(10px,1.8vh,16px)]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-faint">{p.by}</span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-[6px] px-2 py-0.5 font-mono text-[10.5px] ${
                  p.on ? "bg-ok-bg text-ok" : "bg-chip text-muted"
                }`}
              >
                <span className={`size-1.5 rounded-full ${p.on ? "bg-ok" : "bg-current opacity-60"}`} />
                {p.on ? "available" : "soon"}
              </span>
            </div>
            <h3 className="mt-3 text-[20px] font-semibold tracking-[-0.02em] deck:mt-[clamp(4px,1.2vh,12px)]">{p.name}</h3>
            <p className="mt-2 flex flex-wrap gap-1.5">
              {p.models.split(" · ").map((m) => (
                <span key={m} className="rounded-[6px] bg-chip px-2 py-0.5 font-mono text-[11.5px] text-muted">
                  {m}
                </span>
              ))}
            </p>
            <p className="mt-auto border-t border-line pt-2.5 text-[13px] text-muted deck:mt-[clamp(8px,1.6vh,16px)]">{p.plan}</p>
          </div>
        ))}
      </Reveal>

      <Reveal delay={200} className="mt-3 deck:mt-[clamp(8px,1.6vh,16px)]">
        <Team />
      </Reveal>

      <Reveal delay={280} className="glass-surface mt-3 flex flex-col gap-1 rounded-[14px] px-5 py-3 text-[13.5px] text-muted sm:flex-row sm:items-center sm:gap-6 deck:mt-[clamp(8px,1.6vh,16px)]">
        <span className="label shrink-0">Limits</span>
        <span>
          When a subscription hits its limit, Zveno can fall back to your API key. The Orchestrator always runs on the newest model of
          the provider you choose.
        </span>
      </Reveal>
    </Slide>
  );
}
