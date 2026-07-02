"use client";

import Link from "next/link";
import { AppBrandV10, AppBrandV10Box } from "@/components/AppBrand";
import { BrandLogo } from "@/components/BrandLogo";
import { AppHeaderBlock } from "@/components/AppHeader";
import { Tilt10 } from "@/lib/brandVariants";
import {
  BRAND_ASSETS,
  BRAND_COLORS,
  BRAND_FULL,
  BRAND_LOGO,
  BRAND_NAME,
  BRAND_TYPO,
  BRAND_UPDATED,
  BRAND_VERSION,
  GUIDE_SECTIONS,
} from "@/lib/brandGuide";
import { UnitNotice } from "@/components/StatCard";

function Section({
  id,
  num,
  title,
  children,
}: {
  id: string;
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-b border-slate-200/80 pb-12 last:border-0">
      <div className="mb-6 flex items-baseline gap-3">
        <span className="text-xs font-bold tabular-nums text-gain">{num}</span>
        <h2 className="text-xl font-bold tracking-tight text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 py-3 sm:flex-row sm:gap-4">
      <dt className="w-36 shrink-0 text-xs font-semibold text-ink-muted">{label}</dt>
      <dd className="text-sm text-ink">{value}</dd>
    </div>
  );
}

function DontCard({ bad, reason }: { bad: React.ReactNode; reason: string }) {
  return (
    <div className="rounded-xl border border-loss/20 bg-loss/5 p-4">
      <div className="flex min-h-[3rem] items-center">{bad}</div>
      <p className="mt-3 text-xs leading-relaxed text-ink-muted">
        <span className="font-semibold text-loss">✕ </span>
        {reason}
      </p>
    </div>
  );
}

export default function BrandGuidePage() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Guide header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <AppBrandV10 />
            <span className="hidden text-xs text-ink-muted sm:inline">Brand Guidelines</span>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50"
          >
            ← 앱으로
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-10 px-4 py-8 sm:px-8">
        {/* Side nav */}
        <nav className="sticky top-16 hidden h-fit w-44 shrink-0 lg:block">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-ink-muted">Contents</p>
          <ul className="space-y-1">
            {GUIDE_SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="block rounded-md px-2 py-1.5 text-sm text-ink-muted transition hover:bg-white hover:text-ink"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0 flex-1">
          {/* Cover */}
          <div className="mb-14 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gain">Brand Identity System</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">{BRAND_NAME}</h1>
            <p className="mt-2 text-sm text-ink-muted">
              {BRAND_FULL} · 워드마크 가이드 · v{BRAND_VERSION} · {BRAND_UPDATED}
            </p>
            <div className="mt-10 flex items-end gap-6 border-t border-slate-100 pt-10">
              <div className="scale-150 origin-left">
                <AppBrandV10 />
              </div>
            </div>
          </div>

          <Section id="overview" num="01" title="Overview">
            <div className="space-y-4 text-sm leading-relaxed text-ink-muted">
              <p>
                <strong className="text-ink">M tock</strong>은 My Stock의 단축 워드마크입니다. 대형 M과 tock tail을
                결합해 <strong className="text-ink">My Stock → M + tock</strong>으로 읽히도록 설계했습니다.
              </p>
              <p>
                <strong className="text-ink">Primary Lockup</strong>은 헤더·앱 UI에 사용하는 표준 SVG입니다.{" "}
                <strong className="text-ink">Secondary Lockup</strong>(검정 박스)은 앱 아이콘·스플래시·역상 배경 등
                보조 용도로만 사용합니다.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gain/25 bg-gain-soft/30 p-6">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gain">Primary</p>
                <p className="mt-1 text-sm font-semibold text-ink">Standard · Header</p>
                <div className="mt-4">
                  <AppBrandV10 />
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-900 p-6">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">Secondary</p>
                <p className="mt-1 text-sm font-semibold text-white/90">Ink Box · 보조</p>
                <div className="mt-4">
                  <AppBrandV10Box />
                </div>
              </div>
            </div>
          </Section>

          <Section id="logo" num="02" title="Logo">
            <p className="mb-6 text-sm text-ink-muted">로고는 M(기울임) + tock(워드 tail) 두 요소로 구성됩니다.</p>
            <div className="rounded-xl border border-slate-200 bg-white p-8">
              <div className="flex flex-wrap items-end gap-12">
                <div className="scale-[2] origin-left">
                  <AppBrandV10 />
                </div>
              </div>
            </div>
            <dl className="mt-8">
              <SpecRow label="Header scale" value={BRAND_LOGO.headerScale} />
              <SpecRow label="M · Size (header)" value={BRAND_TYPO.m.sizeHeader} />
              <SpecRow label="M · Weight" value={BRAND_TYPO.m.weight} />
              <SpecRow label="M · Rotation" value={`${BRAND_LOGO.mRotate} · origin ${BRAND_LOGO.mOrigin}`} />
              <SpecRow label="M · Color" value="Ink #0F172A" />
              <SpecRow label="tock · Size (header)" value={BRAND_TYPO.tock.sizeHeader} />
              <SpecRow label="tock · Weight" value={BRAND_TYPO.tock.weight} />
              <SpecRow label="Section title · Size" value={BRAND_TYPO.sectionTitle.size} />
              <SpecRow label="Section title · Weight" value={`${BRAND_TYPO.sectionTitle.weight} · ${BRAND_TYPO.sectionTitle.tracking} · ${BRAND_TYPO.sectionTitle.color}`} />
              <SpecRow label="Pipe separator" value={`${BRAND_TYPO.pipe.size} · ${BRAND_TYPO.pipe.weight} · ${BRAND_TYPO.pipe.color}`} />
              <SpecRow label="M ↔ tock gap" value={BRAND_LOGO.mTockGap} />
              <SpecRow label="Segment gap" value={BRAND_LOGO.segmentGap} />
            </dl>
            <div className="mt-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-muted">Anatomy (spec reference)</p>
              <div className="relative inline-block rounded-lg bg-slate-50 p-8">
                <Tilt10 mClass="text-4xl font-bold text-ink" tockClass="text-lg font-medium tracking-[-0.04em] text-ink/65" />
                <span className="absolute left-2 top-2 text-[9px] font-bold text-gain">M −14°</span>
                <span className="absolute bottom-2 right-2 text-[9px] font-bold text-ink-muted">tock tail</span>
              </div>
              <p className="mt-3 text-xs text-ink-muted">
                프로덕션 UI는 아래 Assets SVG를 사용합니다. Anatomy는 제작 스펙 참고용입니다.
              </p>
            </div>
          </Section>

          <Section id="assets" num="03" title="Assets">
            <p className="mb-6 text-sm text-ink-muted">
              헤더·UI·외부 배포에 사용하는 공식 lockup SVG입니다. CSS 텍스트 렌더링 대신 아래 파일을 사용하세요.
            </p>
            <div className="space-y-4">
              {(Object.keys(BRAND_ASSETS) as Array<keyof typeof BRAND_ASSETS>).map((key) => {
                const asset = BRAND_ASSETS[key];
                return (
                  <div
                    key={key}
                    className={`flex flex-col gap-4 rounded-xl border p-6 sm:flex-row sm:items-center sm:justify-between ${
                      key === "inkBox" ? "border-slate-200 bg-slate-900" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          key === "inkBox" ? "text-white/50" : "text-gain"
                        }`}
                      >
                        {key === "primary" ? "Primary" : "Secondary"}
                      </p>
                      <p className={`mt-1 text-sm font-semibold ${key === "inkBox" ? "text-white/90" : "text-ink"}`}>
                        {asset.file}
                      </p>
                      <p className={`mt-1 text-xs ${key === "inkBox" ? "text-white/60" : "text-ink-muted"}`}>
                        {asset.role}
                      </p>
                      <dl className="mt-3 space-y-1 text-xs">
                        <div className="flex gap-2">
                          <dt className={key === "inkBox" ? "text-white/40" : "text-ink-muted"}>Path</dt>
                          <dd className={`font-mono ${key === "inkBox" ? "text-white/80" : "text-ink"}`}>{asset.path}</dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className={key === "inkBox" ? "text-white/40" : "text-ink-muted"}>Size</dt>
                          <dd className={key === "inkBox" ? "text-white/80" : "text-ink"}>
                            {asset.width}×{asset.height}px · {asset.format}
                          </dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className={key === "inkBox" ? "text-white/40" : "text-ink-muted"}>Display</dt>
                          <dd className={key === "inkBox" ? "text-white/80" : "text-ink"}>
                            height {key === "primary" ? BRAND_LOGO.minHeight : `${asset.height}px`}
                          </dd>
                        </div>
                      </dl>
                      <a
                        href={asset.path}
                        download={asset.file}
                        className={`mt-4 inline-block rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                          key === "inkBox"
                            ? "border-white/20 text-white hover:bg-white/10"
                            : "border-slate-200 text-ink hover:bg-slate-50"
                        }`}
                      >
                        SVG 다운로드
                      </a>
                    </div>
                    <div className="shrink-0">
                      <BrandLogo variant={key} />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-ink-muted">
              구현: <code className="rounded bg-slate-200/80 px-1 py-0.5 font-mono text-[11px]">BrandLogo</code> —{" "}
              <code className="rounded bg-slate-200/80 px-1 py-0.5 font-mono text-[11px]">variant=&quot;primary&quot;</code>
            </p>
          </Section>

          <Section id="color" num="04" title="Color">
            <p className="mb-6 text-sm text-ink-muted">브랜드 컬러는 앱 Tailwind 토큰과 동일합니다.</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {BRAND_COLORS.map((c) => (
                <div key={c.name} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className={`h-16 ${c.bg} ${c.name === "White" ? "border-b border-slate-100" : ""}`} />
                  <div className="p-4">
                    <p className="text-sm font-bold text-ink">{c.name}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{c.role}</p>
                    <p className="mt-2 font-mono text-xs text-ink">{c.hex}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="typography" num="05" title="Typography">
            <dl>
              <SpecRow label="Typeface" value={BRAND_TYPO.family} />
              <SpecRow label="M" value={`${BRAND_TYPO.m.weight} · ${BRAND_TYPO.m.sizeHeader}`} />
              <SpecRow label="tock" value={`${BRAND_TYPO.tock.weight} · ${BRAND_TYPO.tock.sizeHeader} · ${BRAND_TYPO.tock.tracking}`} />
              <SpecRow label="Section title" value={`${BRAND_TYPO.sectionTitle.weight} · ${BRAND_TYPO.sectionTitle.size}`} />
            </dl>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <p className="text-xs text-ink-muted">M · bold</p>
                <p className="mt-2 text-4xl font-bold text-ink">M</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <p className="text-xs text-ink-muted">tock · medium</p>
                <p className="mt-2 text-lg font-medium tracking-[-0.04em] text-ink/65">tock</p>
              </div>
            </div>
          </Section>

          <Section id="spacing" num="06" title="Spacing">
            <dl>
              <SpecRow label="Clear space" value={BRAND_LOGO.clearSpace} />
              <SpecRow label="Minimum size" value={BRAND_LOGO.minHeight} />
              <SpecRow label="M · tock" value={BRAND_LOGO.mTockGap} />
              <SpecRow label="Segment gap" value={BRAND_LOGO.segmentGap} />
            </dl>
            <div className="mt-6 rounded-xl border border-dashed border-gain/40 bg-white p-8">
              <p className="mb-4 text-xs font-semibold text-ink-muted">Clear space (개념도)</p>
              <div className="inline-block border border-dashed border-gain/30 p-4">
                <AppBrandV10 />
              </div>
            </div>
          </Section>

          <Section id="application" num="07" title="Application">
            <p className="mb-6 text-sm text-ink-muted">
              Primary Lockup은 헤더 좌측에 배치합니다. 설명·배지는 우측 같은 행에 desc → meta 순으로 배치합니다.
            </p>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-3 py-3 sm:px-4">
                <AppHeaderBlock
                  tab="verdict"
                  meta={
                    <span className="rounded-full border border-gain/20 bg-gain-soft px-2.5 py-0.5 text-[11px] font-semibold text-gain">
                      동기화
                    </span>
                  }
                  desc={
                    <>
                      시세·시장·뉴스·매매기록 종합 · <UnitNotice />
                    </>
                  }
                />
              </div>
              <div className="bg-slate-100 px-4 py-3">
                <p className="text-xs text-ink-muted">콘텐츠 영역 (예시)</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-ink-muted">
              구현: <code className="rounded bg-slate-200/80 px-1 py-0.5 font-mono text-[11px]">AppHeaderBlock</code> — 좌{" "}
              <code className="rounded bg-slate-200/80 px-1 py-0.5 font-mono text-[11px]">AppHeaderLead</code> · 우 desc + meta
            </p>
          </Section>

          <Section id="rules" num="08" title="Do & Don't">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gain/25 bg-gain-soft/20 p-4">
                <div className="flex min-h-[3rem] items-center">
                  <AppBrandV10 />
                </div>
                <p className="mt-3 text-xs leading-relaxed text-ink-muted">
                  <span className="font-semibold text-gain">✓ </span>
                  Primary Lockup SVG · −14° · 헤더 사용
                </p>
              </div>
              <DontCard
                bad={
                  <span className="inline-flex items-baseline font-sans text-xl font-bold text-ink">
                    <span style={{ transform: "rotate(14deg)", display: "inline-block" }}>M</span>
                    <span className="ml-0.5 text-sm text-ink/65">tock</span>
                  </span>
                }
                reason="M 기울기 방향 변경 금지 (+14° 등)"
              />
              <DontCard
                bad={
                  <span className="inline-flex items-baseline font-sans">
                    <span className="text-xl font-bold text-gain">M</span>
                    <span className="ml-0.5 text-sm text-gain">tock</span>
                  </span>
                }
                reason="Primary에서 M·tock 전체 gain 컬러 사용 금지"
              />
              <DontCard
                bad={
                  <span className="inline-flex items-baseline font-sans">
                    <span
                      className="inline-block text-xl font-bold text-ink"
                      style={{ transform: "scaleX(1.4) rotate(-14deg)" }}
                    >
                      M
                    </span>
                    <span className="ml-0.5 text-sm text-ink/65">tock</span>
                  </span>
                }
                reason="M 가로·세로 비율 변경(늘리기/찌그러뜨리기) 금지"
              />
              <DontCard
                bad={<AppBrandV10Box />}
                reason="헤더에 Secondary(Ink Box) 사용 금지 — 보조 용도만"
              />
              <DontCard
                bad={
                  <span className="text-xl font-bold tracking-[0.3em] text-ink">
                    M<span className="text-sm font-medium text-ink/65">tock</span>
                  </span>
                }
                reason="M 기울임 제거 · My Stock 풀워드 혼용 금지"
              />
            </div>
          </Section>

          <footer className="mt-12 border-t border-slate-200 pt-8 text-center text-xs text-ink-muted">
            {BRAND_NAME} Brand Guidelines v{BRAND_VERSION} · Internal · /brand-preview · noindex
          </footer>
        </main>
      </div>
    </div>
  );
}
