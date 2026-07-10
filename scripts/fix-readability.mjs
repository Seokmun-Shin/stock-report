import fs from "fs";
import path from "path";

const ROOT = path.join(process.cwd(), "components");
const GLASS = "bg-white/15 backdrop-blur-md backdrop-saturate-125";

const REPLACEMENTS = [
  ["bg-white/25 backdrop-blur-md backdrop-saturate-150", GLASS],
  ["bg-gain-soft/50", "bg-red-500/12"],
  ["bg-gain-soft/40", "bg-red-500/12"],
  ["bg-gain-soft/30", "bg-red-500/10"],
  ["bg-gain-soft/25", "bg-red-500/10"],
  ["bg-gain-soft/20", "bg-red-500/10"],
  ["bg-gain-soft", "bg-red-500/12"],
  ["bg-loss-soft/50", "bg-blue-500/12"],
  ["bg-loss-soft/40", "bg-blue-500/12"],
  ["bg-loss-soft/30", "bg-blue-500/10"],
  ["bg-loss-soft/25", "bg-blue-500/10"],
  ["bg-loss-soft/20", "bg-blue-500/10"],
  ["bg-loss-soft", "bg-blue-500/12"],
  ["from-gain-soft/20 to-white", "from-red-500/10 to-transparent"],
  ["text-zinc-500", "text-zinc-300"],
  [" text-gain", " text-red-400"],
  [" text-loss", " text-blue-400"],
  [":text-gain", ":text-red-400"],
  [":text-loss", ":text-blue-400"],
  ['"text-gain"', '"text-red-400"'],
  ['"text-loss"', '"text-blue-400"'],
  ["? \"text-gain\"", "? \"text-red-400\""],
  ["? \"text-loss\"", "? \"text-blue-400\""],
  [": \"text-gain\"", ": \"text-red-400\""],
  [": \"text-loss\"", ": \"text-blue-400\""],
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
  if (file.includes("brand-preview")) continue;
  let src = fs.readFileSync(file, "utf8");
  let next = src;
  for (const [from, to] of REPLACEMENTS) {
    next = next.split(from).join(to);
  }
  if (next !== src) {
    fs.writeFileSync(file, next, "utf8");
    changed++;
    console.log(path.relative(process.cwd(), file));
  }
}
console.log("updated", changed, "files");
