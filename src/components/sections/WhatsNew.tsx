import { Check, Copy, Gauge, MousePointerClick, Rocket, Server, SlidersHorizontal, SquareTerminal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Reveal } from "../Reveal";
import { Slide } from "../Slide";

// What 0.10.3 and 0.10.4 add, from the release notes (Zveno repo, apps/desktop/release-notes/0.10.3.md, 0.10.4.md).
const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Server,
    title: "Autopilot on your server",
    body: "Add your server over SSH in Connections. Your tasks keep running there while your PC sleeps; Update local project brings the work back.",
  },
  {
    icon: SlidersHorizontal,
    title: "Model and effort under the composer",
    body: "Model tabs and an effort slider you drag, for every agent. The colour warms as the effort rises.",
  },
  {
    icon: SquareTerminal,
    title: "A tab for every session",
    body: "The Orchestrator and each agent it starts get their own Terminal tab, grouped under the project.",
  },
  {
    icon: Copy,
    title: "Copy and Run in Terminal",
    body: "Every code block in a reply has Copy and Run in Terminal. Ctrl+C and Ctrl+V work in the Terminal.",
  },
  {
    icon: MousePointerClick,
    title: "Mascots open the chat",
    body: "Click an agent's mascot anywhere in the app to open its chat. Each agent's feed opens with its card.",
  },
  {
    icon: Rocket,
    title: "Updates on the launch screen",
    body: "A new version shows as soon as Zveno starts, with what is new and an Update button.",
  },
  {
    icon: Gauge,
    title: "Fast on slow PCs",
    body: "Far less work per frame, and a Reduce effects setting that turns itself on for slower computers.",
  },
];

const FIXES = [
  "Autopilot no longer locks a desktop PC",
  "The Terminal keeps its text intact",
  "Token counts leave out cached reads",
  "The context bar starts at the left",
  "Interview answers no longer jump to the top",
  "Explain works without an API key",
  "Projects with .env.example run on your server",
  "Board tasks stay within three lines",
];

export function WhatsNew() {
  return (
    <Slide id="new">
      <Reveal className="mx-auto max-w-4xl text-center">
        <p className="label">
          <span className="mr-1.5 inline-block size-1.5 -translate-y-px rounded-full bg-accent align-middle" />
          New in 0.10.4
        </p>
        <h2 className="mt-3 text-[30px] leading-[1.12] font-semibold tracking-[-0.03em] text-balance sm:text-[40px] deck:mt-[clamp(4px,1vh,10px)] deck:text-[clamp(22px,3.9vh,38px)]">
          Let your server do the night shift. <span className="text-faint">And keep every agent one click away.</span>
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
