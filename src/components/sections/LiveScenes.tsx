"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "../Reveal";
import { Slide } from "../Slide";

// Zveno 0.10.5's live window backgrounds, running for real: the same scene files the app ships
// (public/scenes/, copied from the Zveno repo, packages/ui/src/glass/scenes/). A 2D canvas about 144 px tall,
// upscaled with pixelated rendering, 30 frames a second, drawn only while it is on screen.
const SCENES = [
  { id: "koi", name: "Koi pond", hint: "Move slowly and the koi gather. Move fast and they scatter." },
  { id: "lake", name: "Mountain lake", hint: "The cursor moves the sun." },
  { id: "fireflies", name: "Firefly forest", hint: "The fireflies gather at the cursor." },
  { id: "sunset", name: "Sea sunset", hint: "A sailboat, a lighthouse and gulls." },
  { id: "hills", name: "Golden hills", hint: "A river valley at golden hour." },
  { id: "aurora", name: "Aurora", hint: "The cursor sways the lights." },
  { id: "sakura", name: "Sakura", hint: "The cursor blows the petals like a gust." },
  { id: "reef", name: "Reef", hint: "Bubbles follow the cursor and the fish swim around it." },
  { id: "galaxy", name: "Galaxy", hint: "The cursor tilts the galaxy." },
  { id: "zen", name: "Zen garden", hint: "The cursor rakes the sand." },
] as const;

type Mount = (host: HTMLElement, create: unknown, options?: { still?: boolean }) => () => void;

async function load(id: string): Promise<{ mount: Mount; create: unknown }> {
  const [harness, scene] = await Promise.all([
    import(/* webpackIgnore: true */ /* turbopackIgnore: true */ "/scenes/common.js" as string),
    import(/* webpackIgnore: true */ /* turbopackIgnore: true */ `/scenes/${id}.js`),
  ]);
  return { mount: harness.mountPixel as Mount, create: scene.default };
}

function Stage({ id }: { id: string }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let stop: (() => void) | null = null;
    let live = true;
    void load(id).then(({ mount, create }) => {
      if (live && host.current) stop = mount(host.current, create);
    });
    return () => {
      live = false;
      stop?.();
    };
  }, [id]);
  return <div ref={host} className="absolute inset-0 cursor-crosshair" aria-hidden="true" />;
}

export function LiveScenes() {
  const [index, setIndex] = useState(0);
  const scene = SCENES[index]!;
  return (
    <Slide id="scenes">
      <Reveal className="mx-auto max-w-4xl text-center">
        <p className="label">
          <span className="mr-1.5 inline-block size-1.5 -translate-y-px rounded-full bg-accent align-middle" />
          New in 0.10.5 · Live scenes
        </p>
        <h2 className="mt-3 text-[30px] leading-[1.12] font-semibold tracking-[-0.03em] text-balance sm:text-[40px] deck:mt-[clamp(4px,1vh,10px)] deck:text-[clamp(22px,3.9vh,38px)]">
          Ten living worlds behind the glass. <span className="text-faint">Move your cursor over this one.</span>
        </h2>
      </Reveal>

      <Reveal className="mx-auto mt-6 w-full deck:mt-[clamp(12px,2.4vh,26px)]">
        <div className="mx-auto" style={{ width: "min(100%, 960px, calc((100svh - 300px) * 1.6))", minWidth: "min(100%, 320px)" }}>
        <div className="glass-panel relative overflow-hidden rounded-[18px]" style={{ aspectRatio: "16 / 10" }}>
          <Stage key={scene.id} id={scene.id} />
          <div className="pointer-events-none absolute right-3 bottom-3 left-3 flex items-end justify-between gap-3">
            <span className="rounded-[10px] bg-black/45 px-3 py-1.5 text-[13px] font-medium text-white backdrop-blur-md">{scene.name}</span>
            <span className="hidden rounded-[10px] bg-black/45 px-3 py-1.5 text-[12.5px] text-white/85 backdrop-blur-md sm:inline">{scene.hint}</span>
          </div>
        </div>
        <div role="radiogroup" aria-label="Live scenes" className="mt-3 flex flex-wrap justify-center gap-1.5">
          {SCENES.map((s, i) => (
            <button
              key={s.id}
              role="radio"
              aria-checked={i === index}
              onClick={() => setIndex(i)}
              className={`rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors ${i === index ? "bg-sel text-text ring-1 ring-line-strong" : "glass-panel text-muted hover:text-text"}`}
            >
              {s.name}
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-[13px] text-muted">
          Pixel art, drawn sharp behind Zveno&apos;s glass. Pick one in Settings › Appearance. It pauses when Zveno is out of focus.
        </p>
        </div>
      </Reveal>
    </Slide>
  );
}
