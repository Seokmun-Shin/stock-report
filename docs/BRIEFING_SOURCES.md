# 일일 브리핑 · 통합 매매 추천 데이터 원천

## 자동 수집 (무료·공개 API)

| 원천 | 키 필요 | 내용 |
|------|---------|------|
| **KIS Open API** | KIS_APP_KEY | 현재가·수급·호가·프로그램·**공매도**·업종·KOSPI/KOSDAQ |
| **DART Open API** | DART_API_KEY | 최근 14일 공시 (종목코드 필수) |
| **FRED** | FRED_API_KEY | 미국 CPI·근원CPI·실업률·Fed금리·10Y·2Y·10Y-2Y·HY OAS·GDP·PPI |
| **BOK ECOS** | BOK_API_KEY | 한국 기준금리·CPI·GDP·산업생산·수출·국고채10Y·**원/달러(공식)** |
| **Google RSS** | 없음 | 국내·미국 시장·미·일·중·영·EU·대만 거시·금리·국제정세·Fed/한은 정책·반도체·2차전지·코스닥·수출 뉴스 |
| **Yahoo Finance** | 없음 | 미·일·중·대만·영·EU 지수, **KOSPI200**, VIX/VIX3M, SOX, S&P/NQ 선물, BTC, 미국 국채, DXY, 금·유가 |
| **Frankfurter** | 없음 | USD/EUR/JPY/GBP/CNY → KRW (전일比) · BOK ECOS와 대조 |
| **Naver Finance** | 없음 | KOSPI·KOSDAQ **등락 종목 수** (breadth) |
| **KIS 시장 수급** | KIS_APP_KEY | 코스피·코스닥 시장 전체 외국인/기관/개인 · **코스피 공매도 상위** |
| **KIS 순위 API** | KIS_APP_KEY | 코스피·코스닥 **거래대금·등락률·외국인 순매수** 상위 30 (종목 발굴) |
| **내 매매 FIFO** | 없음 | 평단·타이밍선·매매 구간 |

## 통합 매매 추천

**일일 브리핑** · **통합 매매 추천** 패널 · **매매 입력**에서 다음을 제공합니다.

| 항목 | 설명 |
|------|------|
| **추천** | 매수 / 매도 / 관망 |
| **시점** | 지금~오늘 / 이번 주 / 구간 대기 |
| **가격** | 추천 체결가 + 허용 구간 (min~max) |
| **신뢰도** | 타이밍·시장·뉴스·공시 종합 점수 |
| **수동 입력** | 모든 값 자동 채움 → 수정 후 저장 |

### 점수 요소

1. 매수/매도 타이밍 구간 (전략 %)
2. KIS 전일比 · KOSPI 대비 (알파)
3. KIS 투자자 순매수 (외국인·기관·개인) · 5일 추세 · 52주 구간 · 외국인 지분 · 프로그램 · 호가 잔량
4. 글로벌 지수·VIX·반도체(SOX)·선물(ES/NQ)·BTC·금리·달러·유가·구리 (미·일·중·대만·영)
5. 주요국 환율 (USD/EUR/JPY/GBP/CNY) · JPY/CNY 변동
6. 거시·국제정세·Fed/한은 정책 RSS
7. **FRED · BOK ECOS 공식 지표** (CPI·금리·GDP·HY스프레드·수출·국채)
8. **코스피·코스닥 시장 전체 수급** (KIS)
9. 종목 뉴스·DART 공시 키워드 감성

> **투자 조언이 아닙니다.** 참고용 자동 요약입니다.

## 종목 발굴 (추천 탭)

| 항목 | 설명 |
|------|------|
| **데이터** | KIS 거래대금·등락률·외국인 순매수 순위 (코스피·코스닥 각 30건) |
| **점수** | 순위 가중 + 복수 신호 보너스 + 시장 환경 게이트 |
| **출력** | 시장별 Top 10 관심 종목 |
| **추가** | 「+ 추가」로 포트폴리오 등록 → 판단 탭에서 타이밍 분석 |

## 설정

### `.env.local` / Vercel

```env
KIS_APP_KEY=...
KIS_APP_SECRET=...
DART_API_KEY=...   # https://opendart.fss.or.kr/
FRED_API_KEY=...   # https://fred.stlouisfed.org/docs/api/api_key.html
BOK_API_KEY=...    # https://ecos.bok.or.kr/api/
```

### 사용 순서

1. 종목에 **6자리 코드** 등록
2. **KIS 새로고침** (시세)
3. **데이터 새로고침** (통합 매매 추천 패널)
4. 종목 상세 → **+ 매매 내역** (추천값 확인·수정)

## 미연동 (유료·제휴)

- FnGuide / WISE 컨센서스·리포트
- 증권사 PDF 리포트 전체
- Bloomberg 등 유료 터미널

## API

- `GET /api/briefing` — 원천 설정 상태
- `POST /api/briefing` — `{ stocks: [{ id, name, code }] }` → 뉴스·공시·지수 수집
- `GET /api/discovery` — 발굴 API 설정 상태
- `POST /api/discovery` — `{ portfolioCodes?: string[] }` → 코스피·코스닥 관심 종목 Top 10
