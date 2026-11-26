import { ArrowRight, AudioLines, Check, CircleDot, Clapperboard, MessageCircleQuestion, Palette, PieChart, RefreshCw, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Reveal } from "../Reveal";
import { Slide } from "../Slide";

// What 0.10.5 adds, from the release notes (Zveno repo, apps/desktop/release-notes/0.10.5.md).
const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Sparkles,
    title: "Live scenes",
    body: "Ten pixel-art window backgrounds that answer your cursor. Six quick picks in Settings, the rest one click away.",
  },
  {
    icon: CircleDot,
    title: "Context ring",
    body: "Each agent's header shows how full its context is, and a click shows what fills it.",
  },
  {
    icon: PieChart,
    title: "Where tokens go",
    body: "A donut in the right panel, by agent, by kind of work or by model.",
  },
  {
    icon: Clapperboard,
    title: "Video out of the box",
    body: "Remotion, HyperFrames and FFmpeg download on first launch. Agents render videos without asking you to install anything.",
  },
  {
    icon: Palette,
    title: "Design skills",
    body: "Mobile apps, web apps, design systems and graphics. Appllama's app design skills are in the Library.",
  },
  {
    icon: MessageCircleQuestion,
    title: "Terminal questions in the Feed",
    body: "When an agent in the Terminal asks something, the question shows in the Feed and the Inbox, and you answer it there.",
  },
  {
    icon: RefreshCw,
    title: "MVP and Roadmap keep up",
    body: "Re-check reads your code again and moves the MVP score and Roadmap steps as the work lands.",
  },
];

const FIXES = [
  "New task starts Claude Code as the Orchestrator whenever it can lead",
  "Agents never commit with your email: in a repo with no author they commit as Zveno Agent",
  "Agents no longer sit idle with their task in the input",
  "Autopilot accepts a local database password in .env.example",
  "Pure, clear chart colours",
];

export function WhatsNew() {
  return (
    <Slide id="new">
      <Reveal className="mx-auto max-w-4xl text-center">
        <p className="label">
          <span className="mr-1.5 inline-block size-1.5 -translate-y-px rounded-full bg-accent align-middle" />
          New in 0.10.5 – 0.10.8
        </p>
        <h2 className="mt-3 text-[30px] leading-[1.12] font-semibold tracking-[-0.03em] text-balance sm:text-[40px] deck:mt-[clamp(4px,1vh,10px)] deck:text-[clamp(22px,3.9vh,38px)]">
          Call the Orchestrator, and see what your agents spend and ask.{" "}
          <span className="text-faint">Video and design work out of the box.</span>
        </h2>
      </Reveal>

      <Reveal stagger={60} className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 deck:mt-[clamp(14px,3vh,32px)] deck:gap-[clamp(8px,1.4vh,14px)]">
        <a
          href="#speak"
          className="glass-panel group relative flex flex-col gap-3 overflow-hidden rounded-[16px] p-4 transition-colors hover:bg-hover sm:col-span-2 sm:flex-row sm:items-center lg:col-span-4 deck:p-[clamp(12px,2vh,18px)]"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{ background: "linear-gradient(100deg, #30d158, #0a84ff 40%, #af52de 70%, #ff9f0a)" }}
          />
          <span
            className="relative flex size-9 shrink-0 items-center justify-center rounded-[10px] text-white"
            style={{ background: "linear-gradient(135deg, #30d158, #0a84ff)" }}
          >
            <AudioLines size={18} />
          </span>
          <span className="relative min-w-0 flex-1">
            <span className="block text-[15.5px] leading-snug font-semibold tracking-[-0.01em]">Speak &amp; Ship: a voice call with the Orchestrator</span>
            <span className="mt-0.5 block text-[13.5px] leading-relaxed text-muted">
              Talk as on the phone, in any of 10 languages. Speech is heard and spoken on your computer, about twice as fast since 0.10.6. Windows first.
            </span>
          </span>
          <span className="relative inline-flex shrink-0 items-center gap-1 text-[13.5px] font-medium">
            See it <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </a>
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
