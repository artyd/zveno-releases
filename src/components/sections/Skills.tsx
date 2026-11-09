import { Box, Clapperboard, Database, Download as DownloadIcon, KeyRound, LayoutDashboard, Server, type LucideIcon } from "lucide-react";
import { Reveal } from "../Reveal";
import { SectionHead } from "../SectionHead";
import { CORE_COUNT, PACK_COUNTS, ROW_A, ROW_B, SKILL_COUNT, type SkillItem } from "@/lib/skills-data";
import { Slide } from "../Slide";

// Every skill Zveno ships, in two rows (generated from the Zveno repo by `npm run skills`).
const PACKS: { name: string; note: string; count: number; icon: LucideIcon }[] = [
  { name: "Engineering", note: "APIs, jobs, git", count: PACK_COUNTS["Engineering"], icon: Server },
  { name: "Frontend", note: "UI, Next.js", count: PACK_COUNTS["Frontend"], icon: LayoutDashboard },
  { name: "Databases", note: "SQL, ORMs", count: PACK_COUNTS["Databases"], icon: Database },
  { name: "Auth", note: "Sign-up, 2FA", count: PACK_COUNTS["Auth"], icon: KeyRound },
  { name: "Video", note: "Remotion", count: PACK_COUNTS["Motion video"], icon: Clapperboard },
  { name: "3D", note: "three.js, R3F", count: PACK_COUNTS["3D"], icon: Box },
];

type Skill = SkillItem;

function SkillCard({ s }: { s: Skill }) {
  return (
    <article className="glass-panel mr-4 flex h-[clamp(128px,20vh,172px)] w-[280px] shrink-0 flex-col rounded-[16px] p-4 sm:w-[300px]">
      <div className="flex items-center justify-between">
        <span className="label">{s.pack}</span>
        {s.core ? <span className="rounded-[6px] bg-ok-bg px-2 py-0.5 font-mono text-[10.5px] text-ok">Core</span> : null}
      </div>
      <h3 className="mt-[clamp(6px,1.4vh,14px)] text-[15px] font-semibold tracking-[-0.01em]">{s.title}</h3>
      <p className="font-mono text-[11px] text-faint">{s.id} · zveno</p>
      <p className="mt-[clamp(4px,1vh,10px)] line-clamp-3 text-[12.5px] leading-snug text-muted">{s.desc}</p>
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
          <span className="rounded-[6px] bg-ok-bg px-2 py-0.5 font-mono text-[10.5px] text-ok">{SKILL_COUNT} skills</span>
          <p className="mt-2 text-[17px] leading-tight font-semibold tracking-[-0.02em]">{CORE_COUNT} Core skills, always on.</p>
          <p className="mt-1 text-[13.5px] text-muted">The Orchestrator adds the rest from the Catalog, per task.</p>
        </Reveal>
      </div>

      <Reveal delay={120} className="-mx-4 mt-6 sm:-mx-6 deck:mt-[clamp(10px,2.4vh,28px)]">
        <div className="space-y-3 deck:space-y-[clamp(6px,1.4vh,14px)]">
          <MarqueeRow items={ROW_A} seconds={ROW_A.length * 10} label="Skills, moving left" />
          <MarqueeRow items={ROW_B} seconds={ROW_B.length * 11} reverse label="Skills, moving right" />
        </div>
      </Reveal>

      <div className="mx-auto mt-6 max-w-6xl deck:mt-[clamp(10px,2.4vh,28px)]">
        <Reveal delay={180} className="flex items-center gap-3">
          <p className="label shrink-0">Packs</p>
          <span aria-hidden="true" className="h-px flex-1 bg-line" />
        </Reveal>
        <Reveal stagger={60} className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6 deck:mt-[clamp(6px,1.4vh,12px)]">
          {PACKS.map(({ icon: Icon, ...s }) => (
            <div key={s.name} className="glass-panel flex items-center gap-3 rounded-[14px] p-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-ok-bg text-ok">
                <Icon size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] leading-tight font-semibold">{s.name}</span>
                <span className="block truncate text-[11.5px] leading-snug text-faint">{s.note}</span>
              </span>
              <span className="shrink-0 rounded-[6px] bg-ok-bg px-1.5 py-0.5 font-mono text-[10.5px] text-ok">{s.count}</span>
            </div>
          ))}
        </Reveal>
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
