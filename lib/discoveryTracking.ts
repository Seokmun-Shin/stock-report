import type { DiscoveryPick } from "@/lib/briefing/stockDiscovery";

const STORAGE_KEY = "stock-report-discovery-track";

export interface TrackedDiscoveryPick {
  code: string;
  name: string;
  entryPrice: number;
  entryChangeRate: number;
  score: number;
  trackedAt: string;
}

export interface DiscoveryTrackStat {
  code: string;
  name: string;
  entryPrice: number;
  currentPrice: number;
  changePct: number;
  daysHeld: number;
  score: number;
}

function loadAll(): TrackedDiscoveryPick[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TrackedDiscoveryPick[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(items: TrackedDiscoveryPick[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(-50)));
}

export function trackDiscoveryPicks(picks: DiscoveryPick[]) {
  const existing = loadAll();
  const byCode = new Map(existing.map((e) => [e.code, e]));
  const today = new Date().toISOString().slice(0, 10);

  for (const p of picks.slice(0, 10)) {
    if (byCode.has(p.stockCode)) continue;
    byCode.set(p.stockCode, {
      code: p.stockCode,
      name: p.stockName,
      entryPrice: p.price,
      entryChangeRate: p.changeRate,
      score: p.score,
      trackedAt: today,
    });
  }

  saveAll([...byCode.values()]);
}

export function computeDiscoveryTrackStats(
  picks: DiscoveryPick[]
): DiscoveryTrackStat[] {
  const tracked = loadAll();
  if (tracked.length === 0) return [];

  const priceByCode = new Map(picks.map((p) => [p.stockCode, p.price]));
  const today = new Date();

  return tracked
    .map((t) => {
      const currentPrice = priceByCode.get(t.code) ?? t.entryPrice;
      const changePct = t.entryPrice > 0 ? ((currentPrice - t.entryPrice) / t.entryPrice) * 100 : 0;
      const daysHeld = Math.max(
        0,
        Math.floor((today.getTime() - new Date(t.trackedAt).getTime()) / 86400000)
      );
      return {
        code: t.code,
        name: t.name,
        entryPrice: t.entryPrice,
        currentPrice,
        changePct,
        daysHeld,
        score: t.score,
      };
    })
    .slice(-8)
    .reverse();
}
