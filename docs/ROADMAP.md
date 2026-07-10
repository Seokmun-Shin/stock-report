# 기능 로드맵

| Phase | 상태 | 설명 |
|-------|------|------|
| **A** | ✅ | 정확성·신뢰 |
| **Daily 1** | ✅ | 일일 브리핑 |
| **B** | ✅ | KIS·모바일·CSV·KOSPI |
| **C** | ✅ | 타이밍 %·알림·기간 리포트·분할/배당 |
| **D** | 🔄 | 다계좌·차트·펀더멘털 — [PHASE_D.md](./PHASE_D.md) |

## Phase C (3단계)

- [x] 타이밍 비율 사용자 설정 (매수/매도 1·2차 %)
- [x] 목표가 + 브라우저 알림
- [x] 월별·연별 실현손익 리포트
- [x] 분할·배당 이벤트 (분할 시 매매 자동 조정)
- [x] KIS 전일가·KOSPI 등락 보정

## Phase D (4단계)

- [x] 펀더멘털 UI — PER·PBR·업종·52주 (`StockFundamentalsPanel`)
- [x] 차트 타이밍선 — 매수·매도 % 오버레이 (`chartTimingLines`)
- [x] 포트폴리오 차트 기간 — 7/30/90일
- [x] 다계좌 기반 — 계좌 추가·전환 (`multiAccount`, 설정 탭)
- [ ] 다계좌 합산 뷰

상세: [PHASE_D.md](./PHASE_D.md)

## KIS 보정

전일가=현재가인데 등락률/등락액이 있으면 `lib/kis/normalizeQuote.ts`에서 역산합니다.
