"use client";

import { formatKisUpdatedTime, isKrxMarketOpen } from "@/hooks/useKisPrices";

export function PriceRefreshBar({
  configured,
  loading,
  error,
  lastUpdated,
  autoRefresh,
  onAutoRefreshChange,
  onRefresh,
  codedCount,
  totalCount,
}: {
  configured: boolean | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  autoRefresh: boolean;
  onAutoRefreshChange: (v: boolean) => void;
  onRefresh: () => void;
  codedCount: number;
  totalCount: number;
}) {
  if (configured === null) return null;

  if (!configured) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        KIS 시세 연동: 서버에 <code className="text-xs">KIS_APP_KEY</code>,{" "}
        <code className="text-xs">KIS_APP_SECRET</code> 설정 시 「현재가 새로고침」 사용 가능
      </div>
    );
  }

  const marketOpen = isKrxMarketOpen();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface-dim px-4 py-3">
      <div className="min-w-0 text-sm text-ink-muted">
        <span className="font-semibold text-ink">KIS 실시간 시세</span>
        <span className="ml-2">
          종목코드 {codedCount}/{totalCount}
        </span>
        {lastUpdated && (
          <span className="ml-2 tabular-nums">· {formatKisUpdatedTime(lastUpdated)} 갱신</span>
        )}
        {autoRefresh && (
          <span className="ml-2">{marketOpen ? "· 1분 자동 갱신 중" : "· 장 마감 (다음 개장 시 갱신)"}</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex cursor-pointer items-center gap-1.5 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => onAutoRefreshChange(e.target.checked)}
            className="rounded border-line"
          />
          1분 자동
        </label>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading || codedCount === 0}
          className="rounded-lg bg-gain px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "조회 중…" : "현재가 새로고침"}
        </button>
      </div>
      {error && <p className="w-full text-sm text-loss">{error}</p>}
      {codedCount === 0 && (
        <p className="w-full text-sm text-amber-800">종목 탭 「이름 수정」에서 6자리 종목코드를 입력하세요.</p>
      )}
    </div>
  );
}
