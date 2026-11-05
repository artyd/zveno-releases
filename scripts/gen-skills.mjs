// Writes src/lib/skills.generated.ts from the Skills that ship with Zveno.
//
//   node scripts/gen-skills.mjs [path to Zveno's apps/desktop/resources/skills]
//
// The default path is the Zveno repo next to this one (../Zveno). Every folder there with a skill.json is a
// shipped Skill; index.json fills in fields a folder leaves out. Only id, pack, core and desc reach the site:
// where a Skill came from stays in the app (Settings > About > third-party notices).
// Run it again whenever Skills are added or changed, then commit the generated file.

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const src = resolve(process.argv[2] ?? process.env.ZVENO_SKILLS ?? join(root, "..", "Zveno", "apps", "desktop", "resources", "skills"));
const out = join(root, "src", "lib", "skills.generated.ts");

// The Packs in the Library's order, with the Library's names (Zveno: packages/ui/src/strings.ts).
const PACKS = [
  ["planning", "Planning"],
  ["engineering", "Engineering"],
  ["frontend", "Frontend"],
  ["databases", "Databases"],
  ["auth", "Auth and sign-up"],
  ["design", "Design"],
  ["testing", "Testing"],
  ["video", "Motion video"],
  ["3d", "3D"],
  ["writing", "Writing"],
  ["research", "Research"],
];

// The site's name for each Skill: Title Case, 1-4 words. A Skill missing here is named from its id.
const NAMES = {
  // Planning
  "brainstorm-options": "Option Brainstorm",
  "change-proposal": "Change Proposal",
  "clarify-spec": "Spec Clarifier",
  "delegation-contract": "Agent Briefing",
  "grill-me": "Plan Interview",
  "grill-with-docs": "Deep Interview",
  handoff: "Session Handoff",
  "orchestrate-plan": "Agent Task Plan",
  "plan-check": "Parallel Plan Check",
  "plan-review": "Plan Review",
  "project-principles": "Project Principles",
  "requirements-checklist": "Requirements Checklist",
  "spec-converge": "Spec Gap Finder",
  "spec-cross-check": "Spec Cross-Check",
  "team-design": "Team Builder",
  "to-spec": "Spec Writer",
  "to-tickets": "Ticket Slicing",
  wayfinder: "Effort Mapping",
  // Engineering
  "agent-harness-design": "Agent Harness Design",
  "api-design": "API Design",
  "background-jobs": "Background Jobs",
  "codebase-map": "Codebase Map",
  "commit-history": "Git History Reader",
  "compact-context": "Context Compaction",
  "dependency-check": "Dependency Check",
  "deploy-gate": "Deploy Gate",
  "diagnosing-bugs": "Bug Diagnosis",
  "docker-basics": "Docker Basics",
  "git-workflow": "Git Workflow",
  "graphql-api": "GraphQL APIs",
  "improve-architecture": "Architecture Cleanup",
  "mcp-builder": "MCP Server Builder",
  "node-backend": "Node Backend",
  "performance-tuning": "Performance Tuning",
  "python-backend": "Python Backend",
  "security-basics": "Security Basics",
  "service-observability": "Service Observability",
  "skill-creator": "Skill Writer",
  "smallest-change": "Smallest Change",
  // Frontend
  "component-composition": "Component Composition",
  "forms-and-validation": "Forms and Validation",
  "frontend-ui": "UI Components",
  "nextjs-app": "Next.js App Router",
  "react-performance": "React Performance",
  "shadcn-ui": "Ready-Made Components",
  "tailwind-styling": "Tailwind Styling",
  "web-animation": "Web Animation",
  // Databases
  "backups-and-restore": "Backups and Restore",
  "data-modeling": "Data Modeling",
  "drizzle-orm": "Drizzle ORM",
  "mysql-schema": "MySQL Schema",
  "postgres-best-practices": "Postgres Tuning",
  "prisma-orm": "Prisma ORM",
  "redis-caching": "Redis Caching",
  "safe-migrations": "Safe Migrations",
  "sqlite-local": "Local SQLite",
  "supabase-backend": "Supabase Backend",
  // Auth and sign-up
  "auth-hardening": "Auth Hardening",
  "auth-setup": "Auth Setup",
  "auth-testing": "Auth Testing",
  "auth0-setup": "Auth0 Setup",
  "authorization-roles": "Roles and Permissions",
  "clerk-setup": "Clerk Setup",
  "oauth-providers": "Social Sign-In",
  "password-reset-and-2fa": "Password Reset and 2FA",
  "supabase-auth": "Supabase Auth",
  // Design
  "color-and-type": "Color and Type",
  "design-critique": "Design Critique",
  "design-md": "Design Doc",
  "design-tokens": "Design Tokens",
  "frontend-design": "Distinctive Design",
  prototype: "Throwaway Prototype",
  "ui-ux-pro-max": "UI Style Finder",
  "ux-copy": "UX Copy",
  // Testing
  "accessibility-check": "Accessibility Check",
  "browser-devtools-check": "DevTools Check",
  "code-review": "Code Review",
  "e2e-tests": "End-to-End Tests",
  "endpoint-security-review": "Endpoint Security Review",
  "scope-check": "Scope Check",
  tdd: "Test-First Building",
  "ui-review": "UI Review",
  "verify-agent-work": "Agent Work Check",
  "verify-before-done": "Proof Before Done",
  "visual-check": "Visual Check",
  "webapp-testing": "Browser Testing",
  // Motion video
  "ffmpeg-media": "FFmpeg Media",
  "html-video": "HTML Video",
  "motion-principles": "Motion Principles",
  "remotion-video": "Remotion Videos",
  "shot-recipes": "Shot Recipes",
  "social-video-formats": "Social Video Formats",
  "sound-and-music": "Sound and Music",
  "video-captions": "Video Captions",
  "video-render": "Video Rendering",
  "video-review": "Video Review",
  "video-storyboard": "Storyboard",
  voiceover: "Voiceover",
  // 3D
  "3d-asset-review": "3D Asset Review",
  "blender-scripting": "Blender Scripting",
  "gltf-assets": "3D Model Compression",
  "image-to-threejs": "Image to 3D",
  "interactive-3d-feel": "Game Feel",
  "procedural-generation": "Procedural Generation",
  "r3f-scene": "React 3D Scenes",
  "shaders-and-postprocessing": "Shaders and Post Effects",
  "threejs-performance": "3D Performance",
  "threejs-scene": "Three.js Scenes",
  // Writing
  "adhd-friendly": "Plain Answers",
  "api-docs": "API Reference Docs",
  "convert-to-markdown": "Markdown Converter",
  "docs-and-adrs": "Docs and Decisions",
  humanizer: "Natural Prose",
  readme: "README Writer",
  "release-notes": "Release Notes",
  // Research
  "library-docs": "Current Library Docs",
  "license-check": "License Check",
  research: "Source Research",
  "source-evidence": "Evidence Sourcing",
  "tech-choice": "Tech Choice",
};

// Catalog Skills the moving row shows next to the Core ones, one per Pack. A Pack missing here shows its first.
const FEATURED = [
  "brainstorm-options",
  "api-design",
  "nextjs-app",
  "safe-migrations",
  "password-reset-and-2fa",
  "design-critique",
  "accessibility-check",
  "remotion-video",
  "r3f-scene",
  "adhd-friendly",
  "tech-choice",
];

const SMALL = new Set(["a", "an", "and", "as", "at", "by", "for", "in", "of", "on", "or", "the", "to", "vs"]);
const UPPER = new Set(["api", "ui", "ux", "ai", "mcp", "sql", "css", "html", "seo", "3d", "2fa", "e2e", "orm", "cli"]);
const titleFromId = (id) =>
  id
    .split("-")
    .map((w, i) => (UPPER.has(w) ? w.toUpperCase() : i > 0 && SMALL.has(w) ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ");

// One line: the first sentence that says what the Skill does, without the "Use when" guidance for Agents.
const oneLine = (desc) =>
  desc
    .replace(/`/g, "")
    .replace(/\s+Use (?:it )?when\b.*$/s, "")
    .replace(/\s+/g, " ")
    .trim();

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

if (!existsSync(src)) {
  console.error(`No skills folder at ${src}. Pass the path to Zveno's apps/desktop/resources/skills.`);
  process.exit(1);
}

const index = existsSync(join(src, "index.json")) ? readJson(join(src, "index.json")).skills ?? [] : [];
const byId = new Map(index.map((s) => [s.id, s]));
const folders = readdirSync(src).filter((d) => statSync(join(src, d)).isDirectory() && existsSync(join(src, d, "skill.json")));

const packIds = PACKS.map(([id]) => id);
const skills = [];
const unnamed = [];
for (const id of folders) {
  const s = { ...byId.get(id), ...readJson(join(src, id, "skill.json")) };
  if (!packIds.includes(s.pack)) {
    console.error(`${id}: unknown pack "${s.pack}". Add it to PACKS.`);
    process.exit(1);
  }
  if (!s.desc) {
    console.error(`${id}: no desc.`);
    process.exit(1);
  }
  if (!NAMES[id]) unnamed.push(id);
  skills.push({ id, name: NAMES[id] ?? titleFromId(id), pack: s.pack, core: s.core === true, desc: oneLine(s.desc) });
}
skills.sort((a, b) => packIds.indexOf(a.pack) - packIds.indexOf(b.pack) || a.name.localeCompare(b.name));

const names = new Map();
for (const s of skills) {
  if (names.has(s.name)) {
    console.error(`Two Skills are both called "${s.name}": ${names.get(s.name)} and ${s.id}.`);
    process.exit(1);
  }
  names.set(s.name, s.id);
}

const packs = PACKS.map(([id, label]) => ({ id, label, count: skills.filter((s) => s.pack === id && !s.core).length })).filter(
  (p) => p.count > 0,
);
const featured = packs.map((p) => {
  const pick = FEATURED.find((id) => skills.some((s) => s.id === id && s.pack === p.id && !s.core));
  return pick ?? skills.find((s) => s.pack === p.id && !s.core).id;
});

const ts = `// Generated by scripts/gen-skills.mjs from Zveno's apps/desktop/resources/skills. Do not edit; run
// \`npm run skills\` again instead.

export type SkillPack = ${packs.map((p) => JSON.stringify(p.id)).join(" | ")};

export type Skill = { id: string; name: string; pack: SkillPack; core: boolean; desc: string };

/** Every Skill that ships with Zveno, in Pack order, then by name. */
export const SKILLS: readonly Skill[] = ${JSON.stringify(skills, null, 2)};

/** The Packs of the Catalog (the Skills that are not Core), in the Library's order. */
export const PACKS: readonly { id: SkillPack; label: string; count: number }[] = ${JSON.stringify(packs, null, 2)};

/** Catalog Skills shown in the moving row next to the Core ones, one per Pack. */
export const FEATURED: readonly string[] = ${JSON.stringify(featured)};
`;
writeFileSync(out, ts);

const core = skills.filter((s) => s.core).length;
console.log(`${skills.length} skills (${core} Core, ${skills.length - core} in ${packs.length} Packs) -> ${out}`);
if (unnamed.length) console.log(`Named from the id (add to NAMES for a better name): ${unnamed.join(", ")}`);
