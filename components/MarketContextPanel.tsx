"use client";

import type { ReactNode } from "react";

import type { MarketBriefingContext, TradeRecommendation } from "@/lib/briefing/types";
import { fmt } from "@/lib/calc";
import { sanitizeExternalUrl } from "@/lib/safeUrl";
import { RefreshButton } from "@/components/ui/PanelCard";

function ExternalNewsLink({
  href,
  children,
  className,
}: {
  href?: string | null;
  children: ReactNode;
  className?: string;
}) {
  const safeHref = sanitizeExternalUrl(href);
  if (!safeHref) return <span className={className}>{children}</span>;
  return (
    <a href={safeHref} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

function actionBadge(action: TradeRecommendation["action"]) {
  if (action === "buy") return "bg-red-500/12 text-gain";
  if (action === "sell") return "bg-blue-500/12 text-loss";
  return "bg-white/10 text-zinc-300";
}

function actionLabel(action: TradeRecommendation["action"]) {
  if (action === "buy") return "매수";
  if (action === "sell") return "매도";
  return "관망";
}

function urgencyLabel(u: TradeRecommendation["urgency"]) {
  if (u === "now") return "지금~오늘";
  if (u === "this_week") return "이번 주";
  return "구간 대기";
}

export function MarketContextPanel({
  context,
  loading,
  error,
  lastFetched,
  onRefresh,
  recommendations,
  onOpenStock,
}: {
  context: MarketBriefingContext | null;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
  onRefresh: () => void;
  recommendations: TradeRecommendation[];
  onOpenStock?: (stockId: string) => void;
}) {
  const buyRecs = recommendations.filter((r) => r.action === "buy");
  const sellRecs = recommendations.filter((r) => r.action === "sell");

  return (
    <div className="space-y-4 ui-inner-block p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">통합 매매 추천</p>
          <p className="text-xs text-zinc-300">
            DART·RSS·글로벌 지수·KIS·내 전략을 종합 (투자 조언 아님)
          </p>
        </div>
        <RefreshButton kind="briefing" loading={loading} onClick={onRefresh} disabled={loading} />
      </div>

      {lastFetched && (
        <p className="text-[11px] text-zinc-300">
          마지막 수집: {lastFetched.toLocaleString("ko-KR")}
          {context?.sources && (
            <>
              {" "}
              · {context.sources.filter((s) => s.ok).length}/{context.sources.length} 원천 OK
            </>
          )}
        </p>
      )}

      {error && <p className="text-xs text-amber-200">{error}</p>}

      {!context && !loading && (
        <p className="text-sm text-zinc-300">「뉴스·거시」로 데이터를 수집하세요.</p>
      )}

      {(buyRecs.length > 0 || sellRecs.length > 0) && (
        <div className="space-y-3">
          {buyRecs.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gain">매수 참고</p>
              <ul className="mt-1 space-y-1">
                {buyRecs.map((r) => (
                  <li key={r.stockId}>
                    {onOpenStock ? (
                      <button
                        type="button"
                        onClick={() => onOpenStock(r.stockId)}
                        className="text-sm text-zinc-200 hover:text-gain"
                      >
                        {r.stockName} — {actionLabel(r.action)} {fmt(r.suggestedPrice)}
                      </button>
                    ) : (
                      <span className="text-sm text-zinc-200">{r.stockName}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {sellRecs.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-loss">매도 참고</p>
              <ul className="mt-1 space-y-1">
                {sellRecs.map((r) => (
                  <li key={r.stockId}>
                    {onOpenStock ? (
                      <button
                        type="button"
                        onClick={() => onOpenStock(r.stockId)}
                        className="text-sm text-zinc-200 hover:text-loss"
                      >
                        {r.stockName} — {actionLabel(r.action)} {fmt(r.suggestedPrice)}
                      </button>
                    ) : (
                      <span className="text-sm text-zinc-200">{r.stockName}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
