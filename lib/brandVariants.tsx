import type { CSSProperties, ReactNode } from "react";
import { BRAND_CLASSES } from "@/lib/brandGuide";

export type BrandBase = "10" | "box";

export interface BrandVariant {
  id: number;
  label: string;
  note: string;
  base: BrandBase;
  render: () => ReactNode;
}

function W({ className = "", style, children }: { className?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <span className={`font-sans leading-none ${className}`} style={style}>
      {children}
    </span>
  );
}

/** #10 M xl · −14° center */
export const BOX_INK_SQUARE = "inline-flex items-baseline gap-0 overflow-visible rounded-sm bg-ink px-1 py-0.5 text-white";

export function Tilt10({
  mClass,
  tockClass,
  onDark = false,
  wrapClass,
}: {
  mClass?: string;
  tockClass?: string;
  onDark?: boolean;
  wrapClass?: string;
}) {
  const mBase = mClass ?? (onDark ? `${BRAND_CLASSES.m} text-white` : `${BRAND_CLASSES.m} text-ink`);
  const tBase = tockClass ?? (onDark ? `${BRAND_CLASSES.tockOnDark} text-white/80` : BRAND_CLASSES.tock);
  const mCls = onDark ? `${mBase} text-white` : mBase;
  const tCls = onDark ? `${tBase} text-white/80` : tBase;
  const m = (
    <span
      className={`inline-block leading-none ${mCls}`}
      style={{ transform: "rotate(-14deg)", transformOrigin: "center center" }}
    >
      M
    </span>
  );
  const tail = <span className={`${BRAND_CLASSES.mTockGap} ${tCls}`}>tock</span>;
  if (wrapClass) {
    return (
      <W className={wrapClass}>
        {m}
        {tail}
      </W>
    );
  }
  return (
    <W className="inline-flex items-baseline">
      {m}
      {tail}
    </W>
  );
}

export const BRAND_BASE_LABEL: Record<BrandBase, string> = {
  "10": "#10 M xl",
  box: "검정 박스",
};

export const BRAND_BASE_COLOR: Record<BrandBase, string> = {
  "10": "bg-slate-100 text-ink-muted",
  box: "bg-zinc-800 text-white",
};

export const BRAND_VARIANTS: BrandVariant[] = [
  {
    id: 1,
    base: "10",
    label: "M xl",
    note: "#10 · M 작게 · −14° center",
    render: () => <Tilt10 />,
  },
  {
    id: 2,
    base: "box",
    label: "M xl · ink box",
    note: "#10 · 사각 검정 · 여백 최소",
    render: () => <Tilt10 onDark wrapClass={BOX_INK_SQUARE} />,
  },
];
