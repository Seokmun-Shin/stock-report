/** M tock BI 시스템 가이드 스펙 */

export const BRAND_NAME = "M tock";
export const BRAND_FULL = "My Stock";
export const BRAND_VERSION = "1.0";
export const BRAND_UPDATED = "2026-06-25";

/** v1.0 헤더 원본 사이즈 — M(1.25rem) 기준 비율 유지 */
export const BRAND_HEADER_BASE = {
  mRem: 1.25,
  tockPx: { default: 10, sm: 12 },
  sectionTitlePx: { default: 14, sm: 15 },
  pipePx: 10,
  mTockGapRem: 0.125,
  segmentGapPx: { default: 8, sm: 9 },
  minHeightPx: 24,
} as const;

/** 헤더 전체 스케일 — 원본 대비 1.2× (비율 동일) */
export const BRAND_HEADER_SCALE = 1.2;

function scalePx(px: number) {
  return Math.round(px * BRAND_HEADER_SCALE * 10) / 10;
}

function scaleRem(rem: number) {
  return Math.round(rem * BRAND_HEADER_SCALE * 1000) / 1000;
}

/** 스케일 적용 후 헤더 사이즈 (px/rem) */
export const BRAND_HEADER = {
  mRem: scaleRem(BRAND_HEADER_BASE.mRem),
  tockPx: {
    default: scalePx(BRAND_HEADER_BASE.tockPx.default),
    sm: scalePx(BRAND_HEADER_BASE.tockPx.sm),
  },
  sectionTitlePx: {
    default: scalePx(BRAND_HEADER_BASE.sectionTitlePx.default),
    sm: scalePx(BRAND_HEADER_BASE.sectionTitlePx.sm),
  },
  pipePx: scalePx(BRAND_HEADER_BASE.pipePx),
  mTockGapRem: BRAND_HEADER_BASE.mTockGapRem,
  segmentGapPx: {
    default: scalePx(BRAND_HEADER_BASE.segmentGapPx.default),
    sm: scalePx(BRAND_HEADER_BASE.segmentGapPx.sm),
  },
  minHeightPx: scalePx(BRAND_HEADER_BASE.minHeightPx),
} as const;

/** M cap-height 대비 비율 (v1.0 기준, 스케일 후에도 동일) */
export const BRAND_RATIOS = {
  tockToM: {
    default: BRAND_HEADER_BASE.tockPx.default / (BRAND_HEADER_BASE.mRem * 16),
    sm: BRAND_HEADER_BASE.tockPx.sm / (BRAND_HEADER_BASE.mRem * 16),
  },
  sectionToM: {
    default: BRAND_HEADER_BASE.sectionTitlePx.default / (BRAND_HEADER_BASE.mRem * 16),
    sm: BRAND_HEADER_BASE.sectionTitlePx.sm / (BRAND_HEADER_BASE.mRem * 16),
  },
  pipeToM: BRAND_HEADER_BASE.pipePx / (BRAND_HEADER_BASE.mRem * 16),
  minHeightToM: BRAND_HEADER_BASE.minHeightPx / (BRAND_HEADER_BASE.mRem * 16),
} as const;

/** 컴포넌트용 Tailwind 클래스 — BRAND_HEADER에서 파생 */
export const BRAND_CLASSES = {
  m: `text-[${BRAND_HEADER.mRem}rem] font-bold`,
  tock: `text-[${BRAND_HEADER.tockPx.default}px] font-medium tracking-[-0.04em] text-ink/65 sm:text-[${BRAND_HEADER.tockPx.sm}px]`,
  tockOnDark: `text-[${BRAND_HEADER.tockPx.default}px] font-medium leading-none tracking-[-0.04em] sm:text-[${BRAND_HEADER.tockPx.sm}px]`,
  sectionTitle: `text-[${BRAND_HEADER.sectionTitlePx.default}px] font-bold tracking-[-0.04em] text-ink/70 sm:text-[${BRAND_HEADER.sectionTitlePx.sm}px]`,
  pipe: `inline-block text-center text-[${BRAND_HEADER.pipePx}px] font-extralight leading-none text-ink/25`,
  mTockGap: "ml-0.5",
  pipeSide: `mx-[${BRAND_HEADER.segmentGapPx.default}px] sm:mx-[${BRAND_HEADER.segmentGapPx.sm}px]`,
} as const;

export const BRAND_COLORS = [
  { name: "Ink", role: "Primary text · M", hex: "#0F172A", token: "text-ink", bg: "bg-ink" },
  { name: "Ink Muted", role: "tock · 보조 텍스트", hex: "#64748B", token: "text-ink/65", bg: "bg-ink-muted" },
  { name: "Gain", role: "Accent · UI 강조", hex: "#2563EB", token: "text-gain", bg: "bg-gain" },
  { name: "Gain Soft", role: "배경 · 배지", hex: "#EFF6FF", token: "bg-gain-soft", bg: "bg-gain-soft" },
  { name: "White", role: "배경 · 역상 로고", hex: "#FFFFFF", token: "bg-white", bg: "bg-white" },
] as const;

export const BRAND_TYPO = {
  family: "System UI / sans-serif (font-sans)",
  m: {
    weight: "700 (bold)",
    sizeHeader: `${BRAND_HEADER.mRem}rem (base ${BRAND_HEADER_BASE.mRem} × ${BRAND_HEADER_SCALE})`,
    tracking: "0",
  },
  tock: {
    weight: "500 (medium)",
    sizeHeader: `${BRAND_HEADER.tockPx.default}px · sm:${BRAND_HEADER.tockPx.sm}px (M × 0.5 · 0.6)`,
    tracking: "-0.04em",
  },
  sectionTitle: {
    weight: "700 (bold)",
    size: `${BRAND_HEADER.sectionTitlePx.default}px · sm:${BRAND_HEADER.sectionTitlePx.sm}px (M × 0.7 · 0.75)`,
    tracking: "-0.04em",
    color: "ink/70",
  },
  pipe: {
    weight: "200 (extralight)",
    size: `${BRAND_HEADER.pipePx}px (M × 0.5)`,
    color: "ink/25",
  },
} as const;

/** SVG lockup 자산 — public/brand (가이드 단일 소스) */
export const BRAND_ASSETS = {
  primary: {
    path: "/brand/lockup-primary.svg",
    file: "lockup-primary.svg",
    width: 54,
    height: 23,
    role: "Primary Lockup · Header · UI",
    format: "SVG",
  },
  inkBox: {
    path: "/brand/lockup-ink-box.svg",
    file: "lockup-ink-box.svg",
    width: 62,
    height: 28,
    role: "Secondary Lockup · Icon · Splash · 역상",
    format: "SVG",
  },
} as const;

export type BrandAssetKey = keyof typeof BRAND_ASSETS;

export const BRAND_LOGO = {
  mRotate: "−14°",
  mOrigin: "center center",
  mTockGap: `${BRAND_HEADER.mTockGapRem}rem (ml-0.5 · 스케일 미적용)`,
  segmentGap: `${BRAND_HEADER.segmentGapPx.default}px · sm:${BRAND_HEADER.segmentGapPx.sm}px (| 좌·우 동일 · pipe mx)`,
  clearSpace: "M cap-height × 0.5 (상하좌우)",
  minHeight: `${BRAND_HEADER.mRem * 16}px (M cap-height · SVG crop 기준)`,
  headerScale: `${BRAND_HEADER_SCALE}× (v1.0 base, ratio preserved)`,
  assetPrimary: BRAND_ASSETS.primary.path,
  assetInkBox: BRAND_ASSETS.inkBox.path,
} as const;

export const GUIDE_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "logo", label: "Logo" },
  { id: "assets", label: "Assets" },
  { id: "color", label: "Color" },
  { id: "typography", label: "Typography" },
  { id: "spacing", label: "Spacing" },
  { id: "application", label: "Application" },
  { id: "rules", label: "Do & Don't" },
] as const;
