import { Check, FolderOpen, Gauge, MessageSquareQuote, Moon, MousePointer2, SquareTerminal, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Reveal } from "../Reveal";
import { Slide } from "../Slide";

// What 0.10.1 adds, from the release's feature list (Zveno repo, .scratch/fixes-0-10-1/features.md and README.md).
const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Gauge,
    title: "Model and effort for every agent",
    body: "A pill under the composer sets the model and effort for Claude Code, Codex and Terminal agents. The chosen level is filled.",
  },
  {
    icon: Users,
    title: "Who leads, who builds",
    body: "Pick the Orchestrator's model and the models its agents build with, for each provider.",
  },
  {
    icon: MessageSquareQuote,
    title: "Copy, quote, edit",
    body: "Copy a reply or any block. Quote part of a reply to ask about it. Edit a sent prompt and send it again.",
  },
  {
    icon: FolderOpen,
    title: "Project files",
    body: "Read the project's files in Zveno: code highlighted, Markdown rendered, changed lines marked. Secret values stay masked.",
  },
  {
    icon: Moon,
    title: "Autopilot",
    body: "Keeps Windows awake with the lid closed while tasks run on the charger, then puts your power settings back.",
  },
  {
    icon: MousePointer2,
    title: "The agent's cursor",
    body: "During Computer use the agent's cursor shows on screen with its mascot and what it is doing. It never shows in its screenshots.",
  },
  {
    icon: SquareTerminal,
    title: "A clear start",
    body: "With no agent running, the Feed shows how to start one in the Terminal, in three steps.",
  },
];

const FIXES = [
  "Works with Codex CLI 0.167",
  "Opus 5.5 shows its 1M context window",
  "Codex next to Claude Code keeps both terminals intact",
  "Denser glass; the window background stays",
  "Plan MVP starts the Orchestrator on an MVP task",
  "Computer use follows its switch in Settings",
  "Preview says why a dev server did not start",
];

export function WhatsNew() {
  return (
    <Slide id="new">
      <Reveal className="mx-auto max-w-4xl text-center">
        <p className="label">
          <span className="mr-1.5 inline-block size-1.5 -translate-y-px rounded-full bg-accent align-middle" />
          New in 0.10.1
        </p>
        <h2 className="mt-3 text-[30px] leading-[1.12] font-semibold tracking-[-0.03em] text-balance sm:text-[40px] deck:mt-[clamp(4px,1vh,10px)] deck:text-[clamp(22px,3.9vh,38px)]">
          Choose how each agent works. <span className="text-faint">And see what it does on your screen.</span>
        </h2>
      </Reveal>

      <Reveal stagger={60} className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 deck:mt-[clamp(14px,3vh,32px)] deck:gap-[clamp(8px,1.4vh,14px)]">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="glass-panel rounded-[16px] p-4 deck:p-[clamp(12px,2vh,18px)]">
            <span className="flex size-9 items-center justify-center rounded-[10px] bg-accent-bg text-accent">
              <Icon size={18} />
            </span>
            <h3 className="mt-3 text-[15.5px] leading-snug font-semibold tracking-[-0.01em] deck:mt-[clamp(8px,1.4vh,12px)]">{title}</h3>
            <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{body}</p>
          </div>
        ))}
        <div className="glass-panel rounded-[16px] p-4 deck:p-[clamp(12px,2vh,18px)]">
          <p className="label !text-[10.5px]">Fixed</p>
          <ul className="mt-2 space-y-1.5">
            {FIXES.map((f) => (
              <li key={f} className="flex gap-2 text-[13px] leading-snug text-muted">
                <Check size={14} className="mt-0.5 shrink-0 text-ok" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </Slide>
  );
}
