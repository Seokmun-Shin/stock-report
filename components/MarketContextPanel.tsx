"use client";

import type { MarketBriefingContext, TradeRecommendation } from "@/lib/briefing/types";
import { fmt } from "@/lib/calc";

function actionBadge(action: TradeRecommendation["action"]) {
  if (action === "buy") return "bg-gain-soft text-gain";
  if (action === "sell") return "bg-loss-soft text-loss";
  return "bg-surface-dim text-ink-muted";
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
    <div className="space-y-4 rounded-xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink">통합 매매 추천</p>
          <p className="text-xs text-ink-muted">
            DART·RSS·글로벌 지수·KIS·내 전략을 종합 (투자 조언 아님)
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-lg border border-line bg-surface-dim px-3 py-1.5 text-xs font-medium text-ink hover:bg-line/30 disabled:opacity-50"
        >
          {loading ? "수집 중…" : "데이터 새로고침"}
        </button>
      </div>

      {lastFetched && (
        <p className="text-[11px] text-ink-muted">
          마지막 수집: {lastFetched.toLocaleString("ko-KR")}
          {context?.sources && (
            <> · {context.sources.filter((s) => s.ok).length}/{context.sources.length} 원천 OK</>
          )}
        </p>
      )}

      {error && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{error}</p>}

      {context && (
        <>
          {context.globalIndices.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {context.globalIndices.slice(0, 8).map((idx) => (
                <span
                  key={idx.symbol}
                  className={`rounded-md px-2 py-1 text-xs tabular-nums ${
                    idx.changeRate >= 0 ? "bg-gain-soft/50 text-gain" : "bg-loss-soft/50 text-loss"
                  }`}
                  title={idx.region ? `${idx.region} · ${idx.label}` : idx.label}
                >
                  {idx.label} {idx.changeRate >= 0 ? "+" : ""}
                  {idx.changeRate.toFixed(2)}%
                </span>
              ))}
              {(context.fx ?? context.fxRates.find((f) => f.pair === "USD/KRW")) && (
                <span className="rounded-md bg-surface-dim px-2 py-1 text-xs tabular-nums text-ink-muted">
                  USD/KRW{" "}
                  {Math.round((context.fx ?? context.fxRates.find((f) => f.pair === "USD/KRW"))!.rate).toLocaleString()}
                </span>
              )}
            </div>
          )}

          {context.macroInstruments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {context.macroInstruments.slice(0, 5).map((m) => (
                <span
                  key={m.symbol}
                  className="rounded-md bg-surface-dim px-2 py-1 text-xs tabular-nums text-ink-muted"
                >
                  {m.label}{" "}
                  {m.unit === "%" ? `${m.price.toFixed(2)}%` : m.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              ))}
            </div>
          )}

          {context.officialIndicators.length > 0 && (
            <div className="rounded-lg border border-line bg-surface-dim/30 p-3">
              <p className="text-xs font-semibold text-ink">공식 경제지표 (FRED · BOK)</p>
              <ul className="mt-2 space-y-1">
                {context.officialIndicators.slice(0, 6).map((ind) => (
                  <li key={ind.id} className="text-xs text-ink-muted tabular-nums">
                    {ind.label}: {ind.unit === "%" ? `${ind.value.toFixed(2)}%` : ind.value.toFixed(2)}
                    {ind.changeValue != null && ind.changeLabel ? (
                      <span className="text-ink-faint"> · {ind.changeLabel} {ind.changeValue >= 0 ? "+" : ""}{ind.changeValue.toFixed(2)}</span>
                    ) : null}
                    <span className="text-ink-faint"> ({ind.asOf})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {context.macroNews.length > 0 && (
            <div className="rounded-lg border border-line bg-surface-dim/30 p-3">
              <p className="text-xs font-semibold text-ink">거시 · 국제정세</p>
              <ul className="mt-2 space-y-1">
                {context.macroNews.slice(0, 4).map((n, i) => (
                  <li key={i} className="text-xs leading-snug text-ink-muted">
                    <a href={n.link} target="_blank" rel="noopener noreferrer" className="hover:text-gain hover:underline">
                      {n.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {context.marketNews.length > 0 && (
            <div className="rounded-lg border border-line bg-surface-dim/30 p-3">
              <p className="text-xs font-semibold text-ink">시장 동향 뉴스</p>
              <ul className="mt-2 space-y-1">
                {context.marketNews.slice(0, 5).map((n, i) => (
                  <li key={i} className="text-xs leading-snug text-ink-muted">
                    <a href={n.link} target="_blank" rel="noopener noreferrer" className="hover:text-gain hover:underline">
                      {n.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {(buyRecs.length > 0 || sellRecs.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {buyRecs.length > 0 && (
            <div className="rounded-lg border border-gain/30 bg-gain-soft/20 p-3">
              <p className="text-xs font-semibold text-gain">매수 추천 ({buyRecs.length})</p>
              <ul className="mt-2 space-y-2">
                {buyRecs.map((r) => (
                  <li key={r.stockId} className="text-xs">
                    <button
                      type="button"
                      className="font-semibold text-ink hover:underline"
                      onClick={() => onOpenStock?.(r.stockId)}
                    >
                      {r.stockName}
                    </button>
                    <p className="mt-0.5 text-ink-muted">
                      {urgencyLabel(r.urgency)} · {fmt(r.suggestedPrice)} ({fmt(r.priceRange.min)}~{fmt(r.priceRange.max)})
                    </p>
                    <p className="text-[10px] text-ink-muted">신뢰도 {r.confidence}%</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {sellRecs.length > 0 && (
            <div className="rounded-lg border border-loss/30 bg-loss-soft/20 p-3">
              <p className="text-xs font-semibold text-loss">매도 추천 ({sellRecs.length})</p>
              <ul className="mt-2 space-y-2">
                {sellRecs.map((r) => (
                  <li key={r.stockId} className="text-xs">
                    <button
                      type="button"
                      className="font-semibold text-ink hover:underline"
                      onClick={() => onOpenStock?.(r.stockId)}
                    >
                      {r.stockName}
                    </button>
                    <p className="mt-0.5 text-ink-muted">
                      {urgencyLabel(r.urgency)} · {fmt(r.suggestedPrice)} ({fmt(r.priceRange.min)}~{fmt(r.priceRange.max)})
                    </p>
                    <p className="text-[10px] text-ink-muted">신뢰도 {r.confidence}%</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-xs">
            <thead className="text-ink-muted">
              <tr>
                <th className="py-1 text-left">종목</th>
                <th className="py-1 text-center">추천</th>
                <th className="py-1 text-center">시점</th>
                <th className="py-1 text-right">가격</th>
                <th className="py-1 text-right">구간</th>
                <th className="py-1 text-right">신뢰도</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((r) => (
                <tr
                  key={r.stockId}
                  className="cursor-pointer border-t border-line/60 hover:bg-surface-dim/40"
                  onClick={() => onOpenStock?.(r.stockId)}
                >
                  <td className="py-2 font-semibold text-ink">{r.stockName}</td>
                  <td className="py-2 text-center">
                    <span className={`rounded px-1.5 py-0.5 font-semibold ${actionBadge(r.action)}`}>
                      {actionLabel(r.action)}
                    </span>
                  </td>
                  <td className="py-2 text-center text-ink-muted">{urgencyLabel(r.urgency)}</td>
                  <td className="py-2 text-right tabular-nums">{fmt(r.suggestedPrice)}</td>
                  <td className="py-2 text-right tabular-nums text-ink-muted">
                    {fmt(r.priceRange.min)}~{fmt(r.priceRange.max)}
                  </td>
                  <td className="py-2 text-right tabular-nums">{r.confidence}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && recommendations.length === 0 && (
        <p className="text-sm text-ink-muted">매수·매도 시그널이 있는 종목이 없거나 데이터 수집 전입니다.</p>
      )}
    </div>
  );
}

export function StockContextSnippet({
  stockId,
  context,
}: {
  stockId: string;
  context: MarketBriefingContext | null;
}) {
  const stock = context?.stocks.find((s) => s.stockId === stockId);
  if (!stock) return null;

  return (
    <div className="rounded-lg border border-line bg-surface-dim/20 p-3 text-xs">
      <p className="font-semibold text-ink">
        기업·시장 이슈 · 감성 {stock.sentimentLabel}
      </p>
      {stock.disclosures.length > 0 && (
        <ul className="mt-2 space-y-1 text-ink-muted">
          {stock.disclosures.slice(0, 3).map((d, i) => (
            <li key={i}>[공시 {d.date}] {d.title}</li>
          ))}
        </ul>
      )}
      {stock.news.length > 0 && (
        <ul className="mt-2 space-y-1">
          {stock.news.slice(0, 3).map((n, i) => (
            <li key={i}>
              <a href={n.link} target="_blank" rel="noopener noreferrer" className="text-ink-muted hover:text-gain hover:underline">
                {n.title}
              </a>
            </li>
          ))}
        </ul>
      )}
      {stock.disclosures.length === 0 && stock.news.length === 0 && (
        <p className="mt-1 text-ink-muted">최근 뉴스·공시 없음 (DART 키·종목코드 확인)</p>
      )}
    </div>
  );
}
