"use client";

/**
 * 앱 공통 액션 버튼 — 용도별로 이 컴포넌트만 사용
 *
 * | 용도       | 컴포넌트       | 비고 |
 * |------------|----------------|------|
 * | 등록·추가  | BtnCreate      | primary |
 * | 저장·적용  | BtnSave        | primary, form submit |
 * | 새로고침   | RefreshButton  | kind별 라벨 · RefreshButtonGroup |
 * | 취소·닫기  | BtnCancel      | secondary |
 * | 기본값     | BtnReset       | secondary (초기화) |
 * | 수정       | BtnEdit        | row/header 보조 |
 * | 삭제       | BtnDelete      | danger 보조 |
 * | 가져오기   | BtnImport      | secondary (파일) |
 * | 내보내기   | BtnExport      | secondary (파일) |
 * | 보조 적용  | BtnApply       | secondary (참고값·분할 반영 등) |
 * | 블록 추가  | BtnCreateBlock | 점선 전체 너비 |
 * | 펼치기     | BtnExpand      | 목록 더보기·접기 |
 * | 텍스트 액션 | BtnTextAction  | 안내 토글·복사 등 |
 * | 이동       | BtnNavigate    | 텍스트 링크 — 탭 이동 등 극히 제한 |
 */

import type { ButtonHTMLAttributes } from "react";
import type { RefreshKind } from "@/lib/refreshActions";
import { refreshHint, refreshLabel } from "@/lib/refreshActions";
import {
  ActionBlockButton,
  BtnPrimary,
  BtnSecondary,
  HeaderActionButton,
  LinkAccent,
  UI,
} from "./PanelCard";

function RefreshGlyph({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={`h-3.5 w-3.5 shrink-0 opacity-80 ${className}`.trim()}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/** @deprecated 새 UI는 RefreshButton(kind=…) 사용 */
export function BtnRefresh({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <BtnSecondary className={className} {...props}>
      {children ?? "새로고침"}
    </BtnSecondary>
  );
}

/** 갱신 대상별 새로고침 — 라벨·로딩·스타일 통일 */
export function RefreshButton({
  kind,
  loading = false,
  className = "",
  title,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { kind: RefreshKind; loading?: boolean }) {
  return (
    <BtnSecondary
      type="button"
      title={title ?? refreshHint(kind)}
      className={`ui-btn-refresh ${className}`.trim()}
      {...props}
    >
      <RefreshGlyph />
      {children ?? refreshLabel(kind, loading)}
    </BtnSecondary>
  );
}

/** KIS 시세 + 뉴스·거시 — 판단·원천 탭 공통 */
export function RefreshButtonGroup({
  onKisRefresh,
  onBriefingRefresh,
  kisLoading = false,
  briefingLoading = false,
  kisDisabled,
  briefingDisabled,
  className = "",
}: {
  onKisRefresh: () => void;
  onBriefingRefresh: () => void;
  kisLoading?: boolean;
  briefingLoading?: boolean;
  kisDisabled?: boolean;
  briefingDisabled?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`.trim()}>
      <RefreshButton kind="kis" loading={kisLoading} onClick={onKisRefresh} disabled={kisDisabled || kisLoading} />
      <RefreshButton
        kind="briefing"
        loading={briefingLoading}
        onClick={onBriefingRefresh}
        disabled={briefingDisabled || briefingLoading}
      />
    </div>
  );
}


export function BtnCreate({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <BtnPrimary className={className} {...props}>
      {children ?? "추가"}
    </BtnPrimary>
  );
}

export function BtnSave({
  className = "",
  children,
  type = "submit",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={`${UI.btnPrimary} ${className}`.trim()} {...props}>
      {children ?? "저장"}
    </button>
  );
}

export function BtnCancel({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <BtnSecondary type="button" className={className} {...props}>
      {children ?? "취소"}
    </BtnSecondary>
  );
}

export function BtnReset({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <BtnCancel className={className} {...props}>
      {children ?? "기본값"}
    </BtnCancel>
  );
}

export function BtnEdit({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <HeaderActionButton type="button" className={className} {...props}>
      {children ?? "수정"}
    </HeaderActionButton>
  );
}

export function BtnDelete({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <HeaderActionButton type="button" variant="danger" className={className} {...props}>
      {children ?? "삭제"}
    </HeaderActionButton>
  );
}

export function BtnImport({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <BtnSecondary type="button" className={className} {...props}>
      {children ?? "가져오기"}
    </BtnSecondary>
  );
}

export function BtnExport({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <BtnSecondary type="button" className={className} {...props}>
      {children ?? "내보내기"}
    </BtnSecondary>
  );
}

export function BtnApply({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <BtnSecondary type="button" className={className} {...props}>
      {children}
    </BtnSecondary>
  );
}

/** 탭·화면 이동 — 하단 탭으로 대체 가능하면 쓰지 않음 */
export function BtnNavigate({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`ui-btn-nav ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

export function BtnCreateBlock({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <ActionBlockButton type="button" className={`border-dashed ${className}`.trim()} {...props}>
      {children ?? "+ 추가"}
    </ActionBlockButton>
  );
}

export function BtnExpand({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <ActionBlockButton type="button" className={className} {...props}>
      {children}
    </ActionBlockButton>
  );
}

/** 안내 펼치기·복사·인라인 보조 — primary/secondary 버튼 대신 */
export function BtnTextAction({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <LinkAccent type="button" className={className} {...props}>
      {children}
    </LinkAccent>
  );
}
