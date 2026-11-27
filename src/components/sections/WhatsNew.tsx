import { ArrowRight, Brain, Compass, Eraser, KeyRound, MonitorSmartphone, Palette, Rocket } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Reveal } from "../Reveal";
import { Slide } from "../Slide";

// What 0.11 adds (0.11.0, and 0.11.1's key check and Rocket conflicts) (Zveno repo: .scratch/overnight-2026-11-27/PLAN.md workstreams A–E, the What's new tour's copy in
// packages/ui/src/strings.ts `whatsNew.versions['0.11.0']`), then what came in 0.10.5 – 0.10.8 in one line.
const FEATURES: { icon: LucideIcon; hue: string; title: string; body: string; href?: string }[] = [
  {
    icon: KeyRound,
    hue: "#ff9f0a",
    title: "API keys",
    body: "Add your company's API keys per provider. Each key is checked when you add it. At the plan's limit Zveno moves to them in your order and says when they are spent.",
    href: "#keys",
  },
  {
    icon: MonitorSmartphone,
    hue: "#30d158",
    title: "Ask by voice, done on screen",
    body: "In a Speak & Ship call the Orchestrator can use Computer use for you, and answers faster: it thinks at low effort while the call is on. Approvals are still pressed on screen.",
    href: "#speak",
  },
  {
    icon: Palette,
    hue: "#af52de",
    title: "Design taste Pack",
    body: "A designer Agent on Opus that draws for iOS 27 Liquid Glass and Material 3 Expressive, and checks its screens for calm and beauty.",
  },
  {
    icon: Compass,
    hue: "#0a84ff",
    title: "Tours",
    body: "The full tour of the app, a Settings tour, and What's new after each update, also from Settings. Sessions are named after their work.",
  },
];

const EARLIER = [
  "Speak & Ship voice calls",
  "Live scenes",
  "Context ring",
  "Where tokens go",
  "Video out of the box",
  "Design skills",
  "Terminal questions in the Feed",
  "MVP and Roadmap keep up",
  "Agents never commit with your email",
];

export function WhatsNew() {
  return (
    <Slide id="new">
      <Reveal className="mx-auto max-w-4xl text-center">
        <p className="label">
          <span className="mr-1.5 inline-block size-1.5 -translate-y-px rounded-full bg-accent align-middle" />
          New in 0.12
        </p>
        <h2 className="mt-3 text-[30px] leading-[1.12] font-semibold tracking-[-0.03em] text-balance sm:text-[40px] deck:mt-[clamp(4px,1vh,10px)] deck:text-[clamp(22px,3.9vh,38px)]">
          Both providers as one Team, and work past the plan&apos;s limit.{" "}
          <span className="text-faint">Ask by voice and see it done on screen.</span>
        </h2>
      </Reveal>

      <Reveal stagger={60} className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 deck:mt-[clamp(14px,3vh,32px)] deck:gap-[clamp(8px,1.4vh,14px)]">
        <a
          href="#rocket"
          className="glass-panel group relative flex flex-col gap-3 overflow-hidden rounded-[16px] p-4 transition-colors hover:bg-hover sm:col-span-2 sm:flex-row sm:items-center lg:col-span-4 deck:p-[clamp(12px,2vh,18px)]"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{ background: "linear-gradient(100deg, #ff9f0a, #ff6a3d 35%, #ff375f 65%, #7c8cff)" }}
          />
          <span className="relative flex size-9 shrink-0 items-center justify-center rounded-[10px] text-white" style={{ background: "var(--rocket)" }}>
            <Rocket size={18} />
          </span>
          <span className="relative min-w-0 flex-1">
            <span className="block text-[15.5px] leading-snug font-semibold tracking-[-0.01em]">Rocket: Claude Code and Codex as one Team</span>
            <span className="mt-0.5 block text-[13.5px] leading-relaxed text-muted">
              Opus 5.5 leads. The other provider reviews every Task, branches merge one at a time, the Orchestrator can fix a conflict, and one provider picks up when the other runs out.
            </span>
          </span>
          <span className="relative inline-flex shrink-0 items-center gap-1 text-[13.5px] font-medium">
            See it <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </a>
        <div className="glass-panel relative flex flex-col gap-3 overflow-hidden rounded-[16px] p-4 sm:col-span-2 sm:flex-row sm:items-center lg:col-span-4 deck:p-[clamp(12px,2vh,18px)]">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{ background: "linear-gradient(100deg, #30d158, #0a84ff 50%, #af52de)" }}
          />
          <span className="relative flex size-9 shrink-0 items-center justify-center rounded-[10px] text-white" style={{ background: "#0a84ff", boxShadow: "0 6px 18px -6px #0a84ff" }}>
            <Brain size={18} />
          </span>
          <span className="relative min-w-0 flex-1">
            <span className="block text-[15.5px] leading-snug font-semibold tracking-[-0.01em]">Project memory: Agents remember the Project</span>
            <span className="mt-0.5 block text-[13.5px] leading-relaxed text-muted">
              Install ai-memory from Settings in one press. What Agents learn stays between sessions and between Claude Code and Codex, and in Rocket a Take-over starts from a handoff of what was tried.
            </span>
          </span>
          <span className="relative shrink-0 rounded-[8px] bg-chip px-2 py-[3px] font-mono text-[11.5px] text-muted">New in 0.12</span>
        </div>
        {FEATURES.map(({ icon: Icon, hue, title, body, href }) => {
          const inner = (
            <>
              <span className="flex size-9 items-center justify-center rounded-[10px] text-white" style={{ background: hue, boxShadow: `0 6px 18px -6px ${hue}` }}>
                <Icon size={18} />
              </span>
              <h3 className="mt-3 text-[15.5px] leading-snug font-semibold tracking-[-0.01em] deck:mt-[clamp(8px,1.4vh,12px)]">{title}</h3>
              <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{body}</p>
            </>
          );
          return href ? (
            <a key={title} href={href} className="glass-panel rounded-[16px] p-4 transition-colors hover:bg-hover deck:p-[clamp(12px,2vh,18px)]">
              {inner}
            </a>
          ) : (
            <div key={title} className="glass-panel rounded-[16px] p-4 deck:p-[clamp(12px,2vh,18px)]">
              {inner}
            </div>
          );
        })}
        <div className="glass-panel flex gap-3 rounded-[16px] p-4 deck:p-[clamp(12px,2vh,18px)]">
          <Eraser size={18} className="mt-0.5 shrink-0 text-muted" />
          <div>
            <p className="label !text-[10.5px]">Removed</p>
            <p className="mt-1 text-[13.5px] leading-snug text-muted">Liquid glare, the highlight that followed the cursor across the glass.</p>
          </div>
        </div>
        <div className="glass-panel rounded-[16px] p-4 lg:col-span-3 deck:p-[clamp(12px,2vh,18px)]">
          <p className="label !text-[10.5px]">Earlier, in 0.10.5 – 0.10.8</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {EARLIER.map((e) => (
              <span key={e} className="rounded-[8px] bg-chip px-2 py-[3px] text-[12px] text-muted">
                {e}
              </span>
            ))}
          </div>
        </div>
      </Reveal>
    </Slide>
  );
}
