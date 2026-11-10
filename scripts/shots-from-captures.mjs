// Turns the promo captures of the real app into the site's screenshots and copies the film.
//
//   node scripts/shots-from-captures.mjs <promo folder>
//
// <promo folder> is .scratch/fixes-0-10-1/promo in the Zveno repo: its capture script writes
// video/public/captures/<theme>/*.png (1440x900 at device scale 2) and its render writes video/out/.
// Needs ffmpeg on PATH (or FFMPEG=<path>).
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const site = join(dirname(fileURLToPath(import.meta.url)), "..");
const promo = process.argv[2];
if (!promo) throw new Error("Usage: node scripts/shots-from-captures.mjs <promo folder>");
const ffmpeg = process.env.FFMPEG ?? "ffmpeg";
const captures = join(promo, "video", "public", "captures");
const shots = join(site, "public", "shots");
const video = join(site, "public", "video");
mkdirSync(video, { recursive: true });

// Site name <- capture name. Full window shots stay 2880x1800 (Shot.tsx).
const FULL = {
  "feed-open": "feed-diff",
  board: "board",
  inbox: "inbox",
  project: "project-overview",
  preview: "preview-all",
  library: "library",
  connections: "settings-connections",
  "computer-use": "settings-computer-use",
};
// Crops for the Bento cards, in the capture's CSS pixels [x, y, w, h] (doubled for device scale 2).
const CROP = {
  brief: ["brief", [250, 216, 940, 468]],
  architecture: ["project-architecture", [290, 186, 852, 534]],
  roadmap: ["project-roadmap", [290, 186, 852, 559]],
  terminal: ["terminal", [290, 60, 852, 480]],
  versions: ["project-versions", [290, 186, 852, 354]],
};

const webp = (input, output, filter) =>
  execFileSync(ffmpeg, ["-y", "-loglevel", "error", "-i", input, ...(filter ? ["-vf", filter] : []), "-c:v", "libwebp", "-quality", "84", "-compression_level", "6", output]);

for (const theme of ["light", "dark"]) {
  for (const [name, from] of Object.entries(FULL)) {
    const input = join(captures, theme, `${from}.png`);
    if (!existsSync(input)) {
      console.log(`missing ${theme}/${from}.png: kept ${theme}-${name}.webp`);
      continue;
    }
    webp(input, join(shots, `${theme}-${name}.webp`));
  }
  for (const [name, [from, [x, y, w, h]]] of Object.entries(CROP)) {
    const input = join(captures, theme, `${from}.png`);
    if (!existsSync(input)) {
      console.log(`missing ${theme}/${from}.png: kept ${theme}-${name}-crop.webp`);
      continue;
    }
    webp(input, join(shots, `${theme}-${name}-crop.webp`), `crop=${w * 2}:${h * 2}:${x * 2}:${y * 2}`);
  }
  for (const ext of ["mp4", "webm"]) {
    const file = join(promo, "video", "out", `zveno-promo-${theme}.${ext}`);
    if (existsSync(file)) copyFileSync(file, join(video, `zveno-promo-${theme}.${ext}`));
  }
  const poster = join(promo, "video", "out", `zveno-promo-${theme}-poster.jpg`);
  if (existsSync(poster)) copyFileSync(poster, join(video, `zveno-promo-${theme}-poster.jpg`));
}
console.log("done: public/shots and public/video updated; copy the chapters from video/out/chapters-dark.json into src/lib/film.ts");
