// The promo film: made with Remotion over captures of the real app (Zveno repo, .scratch/fixes-0-10-1/promo).
// The chapters come from its timeline (video/out/chapters-<theme>.json); both themes share them.
export const FILM = {
  version: "0.10.1",
  files: (theme: "light" | "dark") => ({
    mp4: `/video/zveno-promo-${theme}.mp4`,
    webm: `/video/zveno-promo-${theme}.webm`,
    poster: `/video/zveno-promo-${theme}-poster.jpg`,
  }),
  duration: 68.2,
  chapters: [
    { label: "Intro", start: 0 },
    { label: "Idea", start: 3.6 },
    { label: "Plan", start: 9.8 },
    { label: "Build", start: 16 },
    { label: "Decide", start: 26 },
    { label: "Preview", start: 29.4 },
    { label: "Ship", start: 34.6 },
    { label: "New in 0.10.1", start: 40.6 },
  ],
};
