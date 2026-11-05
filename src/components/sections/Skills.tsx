import { Download as DownloadIcon } from "lucide-react";
import { FEATURED, PACKS, SKILLS, type Skill } from "@/lib/skills.generated";
import { Reveal } from "../Reveal";
import { SectionHead } from "../SectionHead";
import { SkillBrowser } from "../SkillBrowser";
import { Slide } from "../Slide";

// Every number here comes from the Skills that ship with Zveno (scripts/gen-skills.mjs).
const TOTAL = SKILLS.length;
const CORE = SKILLS.filter((s) => s.core);
const ROUNDED = `${Math.floor(TOTAL / 10) * 10}+`;
const packLabel = new Map(PACKS.map((p) => [p.id as string, p.label]));

// The moving row: the Core skills, each followed by one skill from a Pack.
const FEATURED_SKILLS = FEATURED.map((id) => SKILLS.find((s) => s.id === id)).filter((s): s is Skill => !!s);
const ROW = Array.from({ length: Math.max(CORE.length, FEATURED_SKILLS.length) }, (_, i) => [CORE[i], FEATURED_SKILLS[i]])
  .flat()
  .filter((s): s is Skill => !!s);

function SkillCard({ s }: { s: Skill }) {
  return (
    <article className="glass-panel mr-4 flex h-[clamp(112px,15vh,140px)] w-[280px] shrink-0 flex-col rounded-[16px] p-4 sm:w-[300px]">
      <div className="flex items-center justify-between">
        <span className="label">{packLabel.get(s.pack)}</span>
        {s.core ? <span className="rounded-[6px] bg-ok-bg px-2 py-0.5 font-mono text-[10.5px] text-ok">Core</span> : null}
      </div>
      <h3 className="mt-[clamp(6px,1.2vh,12px)] text-[15px] leading-tight font-semibold tracking-[-0.01em]">{s.name}</h3>
      <p className="mt-[clamp(4px,0.8vh,8px)] line-clamp-2 text-[12.5px] leading-snug text-muted">{s.desc}</p>
    </article>
  );
}

// Two copies of the row side by side; the track slides by exactly one copy and loops without a seam.
function MarqueeRow({ items, reverse, seconds, label }: { items: Skill[]; reverse?: boolean; seconds: number; label: string }) {
  return (
    <div className="marquee py-1" role="group" aria-label={label} style={{ "--dur": `${seconds}s`, "--dir": reverse ? "reverse" : "normal" } as React.CSSProperties}>
      <div className="marquee-track">
        <div className="flex">
          {items.map((s) => (
            <SkillCard key={s.id} s={s} />
          ))}
        </div>
        <div className="flex" aria-hidden="true">
          {items.map((s) => (
            <SkillCard key={s.id} s={s} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Skills() {
  return (
    <Slide id="skills" bodyClassName="max-w-none">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <SectionHead label="Skills Library" title="Agents work better with good skills." rest="Zveno writes its own. Add more." />
        <Reveal delay={80} className="max-w-xs md:pb-1">
          <span className="rounded-[6px] bg-ok-bg px-2 py-0.5 font-mono text-[10.5px] text-ok">{ROUNDED} skills</span>
          <p className="mt-2 text-[17px] leading-tight font-semibold tracking-[-0.02em]">{CORE.length} Core skills, always on.</p>
          <p className="mt-1 text-[13.5px] text-muted">The Orchestrator adds the rest from {PACKS.length} Packs, per task.</p>
        </Reveal>
      </div>

      <Reveal delay={120} className="-mx-4 mt-6 sm:-mx-6 deck:mt-[clamp(10px,2.2vh,24px)]">
        <MarqueeRow items={ROW} seconds={140} label="Skills, moving left" />
      </Reveal>

      <div className="mx-auto mt-6 max-w-6xl deck:mt-[clamp(10px,2.2vh,24px)]">
        <Reveal delay={180} className="flex items-center gap-3">
          <p className="label shrink-0">Core and Packs</p>
          <span aria-hidden="true" className="h-px flex-1 bg-line" />
        </Reveal>
        <SkillBrowser />
        <Reveal delay={260} className="glass-surface mt-3 flex items-center gap-3 rounded-[14px] px-4 py-3 deck:mt-[clamp(6px,1.4vh,12px)]">
          <DownloadIcon size={18} className="shrink-0 text-accent" />
          <p className="min-w-0 text-[14px] text-muted">
            <span className="font-semibold text-text">Import any SKILL.md from GitHub.</span> Paste a link in the Library. Pause or remove a
            skill per project.
          </p>
        </Reveal>
      </div>
    </Slide>
  );
}
