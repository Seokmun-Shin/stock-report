# Phase D — 다계좌 · 차트 · 펀더멘털

연구용(`research`) 브랜치 확장 로드맵입니다.

## 현황

| 항목 | 상태 | 비고 |
|------|------|------|
| **펀더멘털** | ✅ | KIS → `StockFundamentalsPanel` |
| **차트** | ✅ | 가격 차트 + 타이밍선 + 포트폴리오 기간(7/30/90일) |
| **다계좌** | 🔄 | 설정 탭 계좌 전환·추가 (`lib/multiAccount.ts`) |

## D.1 펀더멘털 (완료)

KIS 시세 갱신 시 이미 수집되는 필드를 종목 상세에 표시합니다.

- PER · PBR · EPS · BPS
- 시가총액 · 52주 고/저 · 외국인 보유비율
- 업종명 · 업종 지수 등락

**파일:** `components/StockFundamentalsPanel.tsx` · `TradingVerdictView`

## D.2 차트 보강 (완료)

- 가격 차트에 **매수·매도 타이밍 %** 수평선 (`lib/chartTimingLines.ts`)
- 포트폴리오 vs KOSPI **7/30/90일** 기간 선택

## D.3 다계좌 (진행 중)

- `AccountPortfolio` · `accounts` / `activeAccountId` in `AppData`
- 설정 탭 **계좌 추가·전환·이름 변경** (`AccountSwitcherPanel`)
- 저장 시 `packActiveAccount`로 활성 slice 동기화
- 🔜 합산 뷰 · 계좌별 Supabase 마이그레이션 문서

## D.4 기타 (문서만)

- 시그널 % → 타이밍 레이더 반영
- 브라우저/이메일 알림 확장
- Cursor Automation (일일 브리핑 자동화)

---

## 구현 순서 (권장)

1. **D.1 펀더멘털 UI** ← 현재
2. **D.2 차트 보강**
3. **D.3 다계좌** (스키마·마이그레이션·UI)
