import fs from "fs";
import path from "path";

const ROOT = path.join(process.cwd(), "components");

const REPLACEMENTS = [
  // 중첩 bordered box → 테두리 없는 inset
  ["rounded-lg border border-white/10 bg-white/10 px-3 py-2.5", "ui-inner-block"],
  ["rounded-lg border border-white/10 bg-white/10 px-3 py-2", "ui-inner-block py-2"],
  ["rounded-lg border border-white/10 bg-white/10 p-3", "ui-inner-block"],
  ["rounded-lg border border-white/10 bg-white/10 px-3 py-1.5", "ui-inner-block py-1.5"],
  ["rounded-xl border border-white/15 bg-white/10 p-3", "ui-inner-block"],
  ["rounded-xl border border-white/15 bg-white/10 p-4", "ui-inner-block p-4"],
  ["rounded-lg border border-dashed border-white/10 bg-white/10 px-3 py-2.5", "ui-inner-block border border-dashed border-white/10"],
  ["rounded-xl border border-dashed border-white/10 bg-white/10 px-4 py-3", "ui-inner-block border border-dashed border-white/10 px-4 py-3"],
  ["rounded-lg border border-dashed border-white/10 bg-white/10 px-3 py-2", "ui-inner-block border border-dashed border-white/10"],
  ["rounded-lg border border-dashed border-white/10 bg-white/10 p-8", "ui-inner-block border border-dashed border-white/10 p-8"],
  ["rounded-lg border border-dashed border-white/10 px-3 py-2", "ui-inner-block border border-dashed border-white/10"],
  // 액션 블록
  [
    "w-full rounded-xl border border-white/15 bg-white/10 py-2.5 text-sm font-semibold text-zinc-300 hover:border-gain hover:text-red-400",
    "ui-action-block",
  ],
  [
    "w-full rounded-lg border border-dashed border-white/10 py-2.5 text-sm text-zinc-300 hover:border-gain hover:text-red-400",
    "ui-action-block border-dashed",
  ],
  [
    "w-full rounded-lg border border-white/15 bg-white/10 py-2 text-sm text-zinc-300 hover:bg-white/15",
    "ui-action-block py-2",
  ],
  // 세그먼트 탭 (inactive)
  [
    "border border-white/15 bg-white/10 text-zinc-300 hover:border-gain hover:text-red-400",
    "ui-segment-tab hover:border-gain",
  ],
  ["border border-white/10 text-zinc-300 hover:bg-white/15", "ui-segment-tab-lg hover:border-gain"],
  ["border border-white/10 text-zinc-300", "ui-segment-tab-lg"],
  // 입력
  ["mt-1 w-full rounded-lg border border-white/10 px-2 py-1.5 text-right", "mt-1 w-full ui-glass-input py-1.5 text-right"],
  ["mt-1 w-full rounded-lg border border-white/10 px-2 py-1.5", "mt-1 w-full ui-glass-input py-1.5"],
  [
    "mt-1 w-full max-w-full rounded-lg border border-white/10 px-2 py-1.5 text-right tabular-nums",
    "mt-1 w-full max-w-full ui-glass-input py-1.5 text-right tabular-nums",
  ],
  [
    "mt-1 w-full rounded-lg border border-white/10 px-2 py-1.5 text-right tabular-nums",
    "mt-1 w-full ui-glass-input py-1.5 text-right tabular-nums",
  ],
  [
    "mt-1 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-right text-sm tabular-nums",
    "mt-1 w-full ui-glass-input py-2 text-right text-sm tabular-nums",
  ],
  // chip
  ["rounded-lg bg-white/10 px-2 py-1 text-xs tabular-nums", "ui-chip tabular-nums"],
  ["rounded bg-white/10 px-1.5 py-0.5", "ui-chip px-1.5 py-0.5"],
  // 이중 panelShell
  [
    "min-w-0 overflow-hidden rounded-2xl border border-white/10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.45)] ring-1 ring-white/10 ${glassSurface}",
    "min-w-0 overflow-hidden ${panelShell}",
  ],
  [
    "min-w-0 rounded-2xl border border-white/10 ${glassSurface} p-3 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.45)] ring-1 ring-white/10 sm:p-5",
    "min-w-0 ${panelShell} p-3 sm:p-5",
  ],
  [
    "overflow-hidden rounded-2xl border border-white/10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.45)] ring-1 ring-white/10 ${glassSurface}",
    "overflow-hidden ${panelShell}",
  ],
  ["rounded-2xl border border-white/10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.45)] ring-1 ring-white/10 ${glassSurface}", "${panelShell}"],
  ["min-w-0 overflow-hidden rounded-2xl border border-white/15 bg-white/10 shadow-sm", "min-w-0 overflow-hidden ${panelShell}"],
  // 버튼
  ["rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-300", "ui-btn-secondary text-sm"],
  ["rounded-lg border border-white/15 px-3 py-1.5 text-sm text-zinc-300", "ui-btn-secondary text-sm"],
  ["rounded-lg border border-white/15 bg-white/10 px-4 py-1.5 text-sm text-zinc-300 hover:bg-white/15", "ui-btn-secondary text-sm"],
  ["rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/15", "ui-btn-secondary text-sm"],
  ["rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/15", "ui-btn-secondary text-xs font-bold"],
  ["rounded-lg border border-dashed border-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-gain hover:text-red-400", "ui-btn-secondary border-dashed text-xs font-semibold"],
  // 테이블 wrap
  ["min-w-0 overflow-x-auto rounded-xl border border-white/10", "ui-glass-inset min-w-0 overflow-x-auto rounded-xl"],
  ["max-h-40 overflow-y-auto rounded-lg border border-white/15 bg-white/10 text-xs", "ui-glass-inset max-h-40 overflow-y-auto text-xs"],
  ["mt-3 max-h-48 overflow-y-auto rounded-lg border border-white/10 text-xs", "ui-glass-inset mt-3 max-h-48 overflow-y-auto text-xs"],
  // market context outer
  ["space-y-4 rounded-xl border border-white/15 bg-white/10 p-4", "space-y-4 ui-inner-block p-4"],
  // ink button legacy
  ["rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-slate-800", "rounded-lg bg-gain px-4 py-2 text-sm font-medium text-white hover:bg-gain/90"],
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
    console.log("updated:", path.relative(process.cwd(), file));
  }
}
console.log("done,", changed, "files");
