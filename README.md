# Zveno site and releases

This repository is the public home of Zveno, the desktop app that runs a team of AI coding agents: the website and the installers.

## Download

Get the latest `Zveno-Setup-<version>.exe` from [Releases](https://github.com/artyd/zveno-releases/releases/latest).

Each release also carries `latest.yml` and a `.sig` file. Zveno checks the Ed25519 signature of every update before it installs it.

## The site

Marketing site for Zveno, the desktop app that runs a team of AI coding agents.

Next.js 15 (App Router, TypeScript) and Tailwind CSS 4. One page, light and dark themes, built to look like the app itself: liquid-glass panels, Geist and Geist Mono, theme tokens from `SPEC.md` §4.3 of the Zveno repo, and the agent mascots ported from the prototype.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```

## Where things are

- `src/app/globals.css`: theme tokens (light / dark), glass utilities, mascot keyframes.
- `src/components/sections/`: one file per slide, in order: Cover, Film (the promo video with chapter chips), WhatsNew (New in 0.10.1), HowItWorks, Product (screenshot slideshow with floating popups), Bento (the "more tools" card carousel), Skills, Providers, Security, Download; Footer sits at the bottom of the last slide.
- `src/lib/film.ts` and `public/video/`: the promo film, light and dark (MP4 H.264 and WebM VP9, a poster each) and its chapters. It loads only near the screen (`preload="metadata"`), plays muted and inline while on screen, and waits on its poster with a Play button under reduced motion.
- `src/components/Deck.tsx`: the presentation controller. Each section is one 100svh slide on desktop (width >= 768 and height >= 600, no reduced motion). One wheel gesture, PageUp/PageDown, Space or arrow moves one slide with a 700ms eased scroll; anchors jump to their slide. Content that does not fit is scaled down. Phones, short windows and reduced motion scroll normally.
- `src/components/Autoplay.tsx`: autoplay for the carousels and `StoryBars`, the segmented progress under them (pauses on hover, focus, hidden tab and off-screen; off under reduced motion).
- `src/components/Bug.tsx`: the agent mascot, a port of `bugEl()` from `design/Zveno.dc.html`.
- `src/lib/site.ts`: download link, nav links, quotes. Set `DOWNLOAD.windows` to the installer URL when the first public build is out.
- `public/shots/`: screenshots of the running app with sample data, `light-*` and `dark-*` for each screen. The page shows the one that matches the theme.
- `RESEARCH.md`: what was borrowed from other product sites, and why.

## Updating screenshots

From 0.10.1 the screenshots and the film come from the built app itself, driven by a Playwright script with sample data only (a made-up `habit-garden` project, stand-in CLIs, no real accounts). In the Zveno repo, `.scratch/fixes-0-10-1/promo/`:

```bash
npm run build                                                                  # the app, in the Zveno repo
npx playwright test --config .scratch/fixes-0-10-1/promo/capture/playwright.config.ts
cd .scratch/fixes-0-10-1/promo/video && npm install && node render.mjs         # Remotion, both themes
```

Then, here: `node scripts/shots-from-captures.mjs <Zveno>/.scratch/fixes-0-10-1/promo` writes `public/shots/*.webp` (1440×900 at device scale 2, and the Bento crops) and copies the film into `public/video/`; copy the chapters from `video/out/chapters-dark.json` into `src/lib/film.ts`.
