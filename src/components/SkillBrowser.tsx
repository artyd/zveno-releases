"use client";

import {
  BadgeCheck,
  Box,
  Clapperboard,
  CodeXml,
  Database,
  FlaskConical,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  Palette,
  PenLine,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { PACKS, SKILLS, type Skill } from "@/lib/skills.generated";
import { Reveal } from "./Reveal";

const ICONS: Record<string, LucideIcon> = {
  core: BadgeCheck,
  planning: ListChecks,
  engineering: CodeXml,
  frontend: LayoutDashboard,
  databases: Database,
  auth: KeyRound,
  design: Palette,
  testing: FlaskConical,
  video: Clapperboard,
  "3d": Box,
  writing: PenLine,
  research: Search,
};
const packLabel = new Map(PACKS.map((p) => [p.id as string, p.label]));

const GROUPS = [
  { id: "core", label: "Core", items: SKILLS.filter((s) => s.core) },
  ...PACKS.map((p) => ({ id: p.id as string, label: p.label, items: SKILLS.filter((s) => s.pack === p.id && !s.core) })),
];

function SkillRow({ s, showPack }: { s: Skill; showPack: boolean }) {
  return (
    <li className="glass-surface rounded-[12px] px-3.5 py-2.5" title={s.desc}>
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="truncate text-[13.5px] leading-tight font-semibold tracking-[-0.01em]">{s.name}</h4>
        {showPack ? <span className="label shrink-0 !text-[10px]">{packLabel.get(s.pack)}</span> : null}
      </div>
      <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-muted">{s.desc}</p>
    </li>
  );
}

// The whole Library by group: Core first, then each Pack. Every group is in the HTML; the tiles pick which one shows.
export function SkillBrowser() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const list = useRef<HTMLDivElement>(null);

  // The wheel scrolls a long list first; at its end, the page moves to the next slide as usual.
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const down = e.deltaY > 0;
      const room = down ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0;
      if (room) e.stopPropagation();
    };
    el.addEventListener("wheel", onWheel, { passive: true });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const select = (i: number) => {
    setActive(i);
    list.current?.scrollTo({ top: 0 });
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const n = GROUPS.length;
    const to = (active + (e.key === "ArrowRight" ? 1 : n - 1)) % n;
    select(to);
    tabs.current[to]?.focus();
  };

  return (
    <>
      <Reveal stagger={40} role="tablist" ariaLabel="Skill groups" className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6 deck:mt-[clamp(6px,1.4vh,12px)] deck:gap-[clamp(6px,1.1vh,12px)]">
        {GROUPS.map((g, i) => {
          const Icon = ICONS[g.id] ?? Sparkles;
          const on = i === active;
          return (
            <button
              key={g.id}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`skills-tab-${g.id}`}
              data-pack={g.id}
              aria-selected={on}
              aria-controls={`skills-panel-${g.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => select(i)}
              onKeyDown={onKey}
              className={`glass-panel flex cursor-pointer items-center gap-2.5 rounded-[14px] p-3 text-left transition-[background-color,box-shadow] deck:py-[clamp(6px,1.1vh,12px)] ${
                on ? "bg-sel shadow-[var(--sel-shadow)]" : "hover:bg-hover"
              }`}
            >
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-[10px] ${on ? "bg-ok text-[var(--desk-base)]" : "bg-ok-bg text-ok"} transition-colors`}
              >
                <Icon size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] leading-tight font-semibold">{g.label}</span>
                <span className="block truncate font-mono text-[11px] leading-snug text-faint">
                  {g.items.length} skills
                </span>
              </span>
            </button>
          );
        })}
      </Reveal>

      <Reveal delay={200} className="mt-3 deck:mt-[clamp(6px,1.4vh,12px)]">
        <div ref={list} className="skill-list deck:h-[clamp(150px,30vh,290px)] deck:overflow-y-auto deck:overscroll-contain">
          {GROUPS.map((g, i) => (
            <div key={g.id} role="tabpanel" id={`skills-panel-${g.id}`} aria-labelledby={`skills-tab-${g.id}`} hidden={i !== active}>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {g.items.map((s) => (
                  <SkillRow key={s.id} s={s} showPack={g.id === "core"} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Reveal>
    </>
  );
}
