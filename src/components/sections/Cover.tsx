import { ArrowDown, ChevronDown } from "lucide-react";
import type { CSSProperties } from "react";
import { DOWNLOAD } from "@/lib/site";
import { Bug } from "../Bug";
import { WindowsIcon } from "../Mark";
import { Slide } from "../Slide";

// Soft colour fields that drift behind the title. Radial gradients only, moved by transform.
function Glow() {
  const blob = (s: CSSProperties) => <span style={s} />;
  return (
    <div aria-hidden="true" className="cover-glow pointer-events-none absolute inset-0 overflow-hidden">
      {blob({
        width: "70vmax",
        height: "70vmax",
        left: "calc(50% - 35vmax)",
        top: "calc(46% - 35vmax)",
        background: "radial-gradient(closest-side, var(--glow-1), transparent)",
        "--dur": "24s",
        "--dx": "5%",
        "--dy": "-4%",
      } as CSSProperties)}
      {blob({
        width: "52vmax",
        height: "52vmax",
        left: "-14vmax",
        bottom: "-22vmax",
        background: "radial-gradient(closest-side, var(--glow-2), transparent)",
        "--dur": "30s",
        "--dx": "7%",
        "--dy": "-6%",
      } as CSSProperties)}
      {blob({
        width: "46vmax",
        height: "46vmax",
        right: "-12vmax",
        top: "-14vmax",
        background: "radial-gradient(closest-side, var(--glow-3), transparent)",
        "--dur": "27s",
        "--dx": "-6%",
        "--dy": "5%",
      } as CSSProperties)}
    </div>
  );
}

function ScrollHint() {
  return (
    <a
      href="#how"
      aria-label="Next: how it works"
      className="absolute bottom-[clamp(12px,3vh,32px)] left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 rounded-full px-3 py-1 font-mono text-[10.5px] tracking-[0.12em] text-faint uppercase transition-colors hover:text-text max-md:hidden"
    >
      <span className="[@media(max-height:820px)]:hidden">Scroll</span>
      <ChevronDown size={16} className="hint-bob" />
    </a>
  );
}

export function Cover() {
  return (
    <Slide
      id="top"
      bodyClassName="max-w-[1800px] text-center"
      backdrop={
        <>
          <Glow />
          <ScrollHint />
        </>
      }
    >
      <p className="rise glass-surface mx-auto inline-flex items-center gap-2 rounded-full py-1 pr-3.5 pl-1.5 font-mono text-[11.5px] text-muted deck:text-[clamp(11px,1.5vh,13px)]">
        <Bug look={{ hue: 250, pat: "dots" }} mood="working" size={20} />
        Desktop app · Windows first
      </p>

      <h1
        className="rise mx-auto mt-[clamp(14px,3vh,32px)] max-w-5xl text-[40px] leading-[1.04] font-semibold tracking-[-0.035em] text-balance sm:text-[60px] deck:max-w-[min(92vw,17.5em)] deck:text-[clamp(40px,8.4vh,96px)]"
        style={{ animationDelay: "80ms" }}
      >
        The key link between an idea and a product <span className="text-accent">is you.</span>
      </h1>

      <p
        className="rise mx-auto mt-[clamp(14px,2.8vh,30px)] max-w-3xl text-[17px] leading-relaxed text-muted text-pretty sm:text-lg deck:text-[clamp(15px,2.3vh,21px)]"
        style={{ animationDelay: "160ms" }}
      >
        Zveno runs a team of AI coding agents on your own computer. You talk to the Orchestrator. It plans the work, hands it
        to Claude Code and Codex, and brings you only the decisions.
      </p>

      <div
        className="rise mt-[clamp(22px,4.4vh,44px)] flex flex-col items-center justify-center gap-3 sm:flex-row"
        style={{ animationDelay: "240ms" }}
      >
        <a href={DOWNLOAD.windows} className="btn btn-strong w-full !min-h-[52px] !rounded-[12px] !px-7 !text-[15.5px] sm:w-auto">
          <WindowsIcon />
          Download for Windows
        </a>
        <a href="#how" className="btn btn-ghost w-full !min-h-[52px] !rounded-[12px] !px-7 !text-[15.5px] sm:w-auto">
          See how it works
          <ArrowDown size={16} />
        </a>
      </div>
      <p className="rise mt-[clamp(10px,1.8vh,18px)] font-mono text-[11.5px] text-faint" style={{ animationDelay: "300ms" }}>
        {DOWNLOAD.requirements} · macOS, Linux and phones coming
      </p>
    </Slide>
  );
}
