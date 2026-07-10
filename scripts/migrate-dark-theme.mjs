import fs from "fs";
import path from "path";

const ROOT = path.join(process.cwd(), "components");
const GLASS =
  "border border-white/10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.45)] ring-1 ring-white/10 bg-white/25 backdrop-blur-md backdrop-saturate-150";

const REPLACEMENTS = [
  ["text-ink-muted/80", "text-zinc-400"],
  ["text-ink-muted/70", "text-zinc-400"],
  ["text-ink-muted/60", "text-zinc-500"],
  ["text-ink-muted", "text-zinc-300"],
  ["text-ink/25", "text-zinc-600"],
  ["text-ink/70", "text-zinc-300"],
  ["hover:text-ink", "hover:text-white"],
  ["text-ink", "text-white"],
  ["border-slate-200/90 bg-white shadow-sm", GLASS],
  ["border border-slate-200/90 bg-white shadow-sm", GLASS],
  ["border border-line bg-white", "border border-white/15 bg-white/10"],
  ["border-line bg-white", "border-white/15 bg-white/10"],
  ["border-line bg-surface-dim", "border-white/10 bg-white/10"],
  ["bg-surface-dim/50", "bg-white/10"],
  ["bg-surface-dim/40", "bg-white/10"],
  ["bg-surface-dim/30", "bg-white/10"],
  ["bg-surface-dim/25", "bg-white/10"],
  ["bg-surface-dim/60", "bg-white/10"],
  ["hover:bg-surface-dim/80", "hover:bg-white/15"],
  ["hover:bg-surface-dim/50", "hover:bg-white/15"],
  ["hover:bg-surface-dim/30", "hover:bg-white/15"],
  ["hover:bg-surface-dim", "hover:bg-white/15"],
  ["border border-line", "border border-white/10"],
  ["border-line/80", "border-white/10"],
  ["border-line/70", "border-white/10"],
  ["border-line", "border-white/10"],
  ["divide-line", "divide-white/10"],
  ["bg-line", "bg-white/20"],
  ["bg-surface border-line", "bg-white/10 border-white/10"],
  ["bg-surface-dim", "bg-white/10"],
  ["border-amber-200 bg-amber-50/80 text-amber-950", "border-amber-400/30 bg-amber-500/15 text-amber-200"],
  ["border-amber-200 bg-amber-50/90", "border-amber-400/30 bg-amber-500/15 text-amber-200"],
  ["bg-amber-50/80", "bg-amber-500/15"],
  ["bg-amber-50/40", "bg-amber-500/10"],
  ["bg-amber-50 text-amber-800", "bg-amber-500/15 text-amber-200"],
  ["text-amber-800", "text-amber-200"],
  ["text-amber-950", "text-amber-200"],
  ["text-amber-700", "text-amber-300"],
  ["hover:bg-slate-50/80", "hover:bg-white/10"],
  ["hover:border-slate-300", "hover:border-white/20"],
  ["hover:border-slate-400", "hover:border-white/25"],
  ["bg-slate-50/40", "bg-white/5"],
  ["border-slate-200/80", "border-white/10"],
  ["border-slate-200/90", "border-white/10"],
  ["border-slate-300/90", "border-white/15"],
  ["bg-surface-dim", "bg-black"],
];

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (p.endsWith(".tsx")) files.push(p);
  }
  return files;
}

let changed = 0;
for (const file of walk(ROOT)) {
  let src = fs.readFileSync(file, "utf8");
  let next = src;
  for (const [from, to] of REPLACEMENTS) {
    next = next.split(from).join(to);
  }
  if (next !== src) {
    fs.writeFileSync(file, next, "utf8");
    changed++;
    console.log("updated:", path.relative(process.cwd(), file));
  }
}
console.log("done,", changed, "files");
