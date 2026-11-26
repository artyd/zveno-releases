"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

/** How long each scene stays before the carousel moves on, and the cross-fade between two. */
const DWELL_MS = 7000;
const FADE_MS = 700;

export function LiveScenes() {
  const [index, setIndex] = useState(0);
  // The scene fading out under the new one; it unmounts once the fade is over.
  const [leaving, setLeaving] = useState<number | null>(null);
  const [hover, setHover] = useState(false);
  const [withUi, setWithUi] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [reduced, setReduced] = useState(false);
  const paused = hover || hidden || reduced;
  const scene = SCENES[index]!;

  const go = (next: number) => {
    const n = (next + SCENES.length) % SCENES.length;
    if (n === index) return;
    setLeaving(index);
    setIndex(n);
  };
  useEffect(() => {
    if (leaving === null) return;
    const t = setTimeout(() => setLeaving(null), FADE_MS);
    return () => clearTimeout(t);
  }, [leaving]);
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => {
      setLeaving(index);
      setIndex((index + 1) % SCENES.length);
    }, DWELL_MS);
    return () => clearTimeout(t);
  }, [index, paused]);
  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const onMq = () => setReduced(mq.matches);
    onMq();
    mq.addEventListener("change", onMq);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      mq.removeEventListener("change", onMq);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <Slide id="scenes">
      <Reveal className="mx-auto max-w-4xl text-center">
        <p className="label">
          <span className="mr-1.5 inline-block size-1.5 -translate-y-px rounded-full bg-accent align-middle" />
          New in 0.10.5 · Live scenes
        </p>
        <h2 className="mt-3 text-[30px] leading-[1.12] font-semibold tracking-[-0.03em] text-balance sm:text-[40px] deck:mt-[clamp(4px,1vh,10px)] deck:text-[clamp(22px,3.9vh,38px)]">
          Ten living worlds behind the glass. <span className="text-faint">Hover to stop and look around.</span>
        </h2>
      </Reveal>

      <Reveal className="mx-auto mt-6 w-full deck:mt-[clamp(12px,2.4vh,26px)]">
        <div className="mx-auto" style={{ width: "min(100%, 1120px, calc((100svh - 200px) * 1.6))", minWidth: "min(100%, 320px)" }}>
          <div
            className="group glass-panel relative overflow-hidden rounded-[18px]"
            style={{ aspectRatio: "16 / 10" }}
            onPointerEnter={() => setHover(true)}
            onPointerLeave={() => setHover(false)}
            aria-roledescription="carousel"
            aria-label="Live scenes"
          >
            {leaving !== null && (
              <div key={`out-${SCENES[leaving]!.id}`} className="absolute inset-0" style={{ animation: `scene-out ${FADE_MS}ms ease forwards` }}>
                <Stage id={SCENES[leaving]!.id} />
              </div>
            )}
            <div key={`in-${scene.id}`} className="absolute inset-0" style={{ animation: leaving !== null ? `scene-in ${FADE_MS}ms ease` : undefined }}>
              <Stage id={scene.id} />
            </div>

            {/* Zveno's own window over the scene (a capture of the real app, glass included); the cursor passes through it. */}
            <div className="pointer-events-none absolute inset-0 transition-opacity duration-500" style={{ opacity: withUi ? 1 : 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/scenes/zveno-ui-dark.png" alt="" className="only-dark absolute inset-0 size-full object-cover" draggable={false} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/scenes/zveno-ui-light.png" alt="" className="only-light absolute inset-0 size-full object-cover" draggable={false} />
            </div>

            <div className="absolute top-3 left-3 flex rounded-[11px] bg-black/45 p-[3px] text-[12px] font-medium text-white backdrop-blur-md">
              {[
                { on: true, label: "With Zveno" },
                { on: false, label: "Scene only" },
              ].map((o) => (
                <button
                  key={o.label}
                  aria-pressed={withUi === o.on}
                  onClick={() => setWithUi(o.on)}
                  className={`rounded-[8px] px-2.5 py-1 transition-colors ${withUi === o.on ? "bg-white/90 text-black" : "text-white/80 hover:text-white"}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <span
              className="pointer-events-none absolute top-3 right-3 rounded-[10px] bg-black/45 px-2.5 py-1 text-[12px] font-medium text-white backdrop-blur-md transition-opacity"
              style={{ opacity: hover ? 1 : 0 }}
            >
              Paused
            </span>

            {[
              { dir: -1, label: "Previous scene", side: "left-3", Icon: ChevronLeft },
              { dir: 1, label: "Next scene", side: "right-3", Icon: ChevronRight },
            ].map(({ dir, label, side, Icon }) => (
              <button
                key={label}
                aria-label={label}
                onClick={() => go(index + dir)}
                className={`absolute top-1/2 ${side} flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100 focus-visible:opacity-100`}
              >
                <Icon size={20} />
              </button>
            ))}

            {/* How long until the next scene: a thin bar along the bottom edge, held while paused. */}
            {!reduced && (
              <span
                key={`bar-${index}`}
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 left-0 z-10 h-[3px] bg-white/80"
                style={{ animation: `scene-progress ${DWELL_MS}ms linear forwards`, animationPlayState: paused ? "paused" : "running" }}
              />
            )}
            <div className="pointer-events-none absolute right-3 bottom-3 left-3 flex items-end justify-between gap-3">
              <span className="rounded-[10px] bg-black/45 px-3 py-1.5 text-[13px] font-medium text-white backdrop-blur-md">
                {scene.name} <span className="text-white/60">· {index + 1} / {SCENES.length}</span>
              </span>
              <span className="hidden rounded-[10px] bg-black/45 px-3 py-1.5 text-[12.5px] text-white/85 backdrop-blur-md sm:inline">{scene.hint}</span>
            </div>
          </div>

        </div>
      </Reveal>
    </Slide>
  );
}
