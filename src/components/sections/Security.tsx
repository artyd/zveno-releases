import { ArrowUpRight, KeyRound, Laptop, LockKeyhole, ShieldCheck, SquareTerminal, UserRound, X, type LucideIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { Bug, ORCH_LOOK } from "../Bug";
import { Reveal } from "../Reveal";
import { Slide } from "../Slide";

const POINTS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Laptop,
    title: "Agents run on your computer",
    body: "Every agent is the provider's own CLI, started on your machine in your project folder. Code goes only to the model provider you chose.",
  },
  {
    icon: KeyRound,
    title: "Keys live in the system keychain",
    body: "API keys go to Windows Credential Manager, macOS Keychain or libsecret. Never into plain files.",
  },
  {
    icon: UserRound,
    title: "Sign-in stays with the provider",
    body: "Subscriptions sign in inside the provider's own CLI. Zveno runs the CLI and never sees your password.",
  },
  {
    icon: ShieldCheck,
    title: "You decide what each connection may do",
    body: "Claude Code, Codex, GitHub, Vercel and your MCP servers each have an Access level. Releases to production and merges into main always wait for your OK.",
  },
];

function Chip({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="glass-surface flex size-9 items-center justify-center rounded-[11px] text-accent">
      <Icon size={17} />
    </span>
  );
}

// What circles the lock: agents, a key, a CLI. The ring turns; each item turns back so it stays upright.
const ORBIT: { a: number; el: ReactNode }[] = [
  { a: 0, el: <Bug look={ORCH_LOOK} mood="idle" size={32} /> },
  { a: 90, el: <Chip icon={KeyRound} /> },
  { a: 180, el: <Bug look={{ hue: 250, pat: "dots" }} mood="working" size={32} /> },
  { a: 270, el: <Chip icon={SquareTerminal} /> },
];

function Machine() {
  return (
    <div>
      <div className="glass-window relative rounded-[26px] p-[clamp(12px,2vh,18px)]">
        <div className="flex items-center justify-between px-1">
          <span className="label flex items-center gap-1.5">
            <Laptop size={13} /> Your computer
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-ok">
            <span className="size-1.5 rounded-full bg-ok" /> local
          </span>
        </div>

        <div aria-hidden="true" className="relative mx-auto my-[clamp(8px,1.6vh,16px)] aspect-square w-[min(100%,clamp(190px,31vh,290px))]">
          <div
            className="glow-pulse absolute inset-[14%] rounded-full"
            style={{ background: "radial-gradient(closest-side, var(--glow-1), transparent)" }}
          />
          <div className="absolute inset-[9%] rounded-full border border-dashed border-line-strong" />
          <div className="absolute inset-[27%] rounded-full border border-line" />
          <div className="orbit-spin absolute inset-[9%]" style={{ "--orbit": "56s" } as CSSProperties}>
            {ORBIT.map((s) => (
              <div key={s.a} className="absolute inset-0" style={{ transform: `rotate(${s.a}deg)` }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div style={{ transform: `rotate(${-s.a}deg)` }}>
                    <div className="orbit-back" style={{ "--orbit": "56s" } as CSSProperties}>
                      {s.el}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="glass-window absolute inset-[34%] flex items-center justify-center rounded-full text-accent">
            <LockKeyhole size={34} strokeWidth={1.8} />
          </div>
        </div>

        <div className="card rounded-[12px] px-3 py-2.5 font-mono text-[11px] leading-relaxed">
          <p className="text-faint">Settings · Models & keys</p>
          <p className="mt-1 flex gap-2">
            Anthropic · Claude Code <span className="ml-auto text-ok">keychain</span>
          </p>
          <p className="text-muted">sk-ant-••••••••••••3f1a</p>
          <p className="mt-1 flex gap-2">
            OpenAI · Codex CLI <span className="ml-auto text-ok">subscription</span>
          </p>
          <p className="text-muted">signed in with codex login</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 font-mono text-[11px]">
        <span className="glass-surface inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-muted">
          <ArrowUpRight size={12} className="text-ok" /> straight to your provider
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-line-strong px-3 py-1 text-faint">
          <X size={12} /> <span className="line-through">Zveno server</span>
        </span>
      </div>
    </div>
  );
}

function Point({ p, side, i }: { p: (typeof POINTS)[number]; side: "l" | "r"; i: number }) {
  const Icon = p.icon;
  return (
    <Reveal
      as="li"
      delay={160 + i * 80}
      className={`glass-panel relative rounded-[18px] p-[clamp(14px,2.2vh,20px)] ${side === "l" ? "lg:text-right" : ""}`}
    >
      <span
        className={`flex size-10 items-center justify-center rounded-[11px] bg-accent-bg text-accent ${side === "l" ? "lg:ml-auto" : ""}`}
      >
        <Icon size={19} />
      </span>
      <h3 className="mt-[clamp(8px,1.6vh,14px)] text-[16px] font-semibold tracking-[-0.01em]">{p.title}</h3>
      <p className="mt-1.5 text-[14px] text-muted deck:text-[clamp(12.5px,1.8vh,14px)]">{p.body}</p>
      {/* a dashed lead from the card to the machine */}
      <span
        aria-hidden="true"
        className={`absolute top-1/2 hidden w-[var(--lead)] border-t border-dashed border-line-strong lg:block ${
          side === "l" ? "left-full" : "right-full"
        }`}
      />
    </Reveal>
  );
}

export function Security() {
  return (
    <Slide id="security">
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className="label">Security</p>
        <h2 className="mt-3 text-[30px] leading-[1.12] font-semibold tracking-[-0.03em] text-balance sm:text-[44px] deck:mt-[clamp(4px,1vh,12px)] deck:text-[clamp(24px,4.7vh,44px)]">
          Your keys never leave your machine.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted text-pretty deck:mt-[clamp(6px,1.6vh,16px)] deck:text-[clamp(13px,1.9vh,15.5px)]">
          Zveno is a desktop app, not a cloud IDE. The work happens where your code already is. There is no Zveno account and
          no Zveno server between you and your provider.
        </p>
      </Reveal>

      <div
        className="mt-8 grid items-center gap-4 [--lead:clamp(14px,2.4vw,36px)] lg:grid-cols-[1fr_minmax(300px,370px)_1fr] lg:gap-[var(--lead)] deck:mt-[clamp(14px,3vh,32px)]"
      >
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 deck:gap-[clamp(10px,1.8vh,16px)]">
          {POINTS.slice(0, 2).map((p, i) => (
            <Point key={p.title} p={p} side="l" i={i} />
          ))}
        </ul>
        <Reveal delay={80} className="max-lg:order-first max-lg:mx-auto max-lg:w-full max-lg:max-w-[400px]">
          <Machine />
        </Reveal>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 deck:gap-[clamp(10px,1.8vh,16px)]">
          {POINTS.slice(2).map((p, i) => (
            <Point key={p.title} p={p} side="r" i={i + 2} />
          ))}
        </ul>
      </div>
    </Slide>
  );
}
