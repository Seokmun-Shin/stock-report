# 보안·시큐어코딩 점검 (2026-06)

포털 시스템 점검 관점 요약. **운영: Vercel 웹**, 로컬은 개발용.

---

## 점검 결과 요약

| 영역 | 등급 | 상태 |
|------|------|------|
| 시크릿 Git 노출 | High | `.env.local` gitignore OK · **example 실키 제거 완료** |
| API 남용 (KIS 등) | High | Origin 검증·Rate limit·Body cap **적용** |
| XSS (DOM) | Low | `dangerouslySetInnerHTML` 없음 |
| XSS (링크) | Medium | RSS `href` → **`sanitizeExternalUrl` 적용** |
| SQL Injection | Low | Supabase query builder + RLS |
| 인증·데이터 격리 | OK | portfolios RLS `auth.uid() = user_id` |
| CSV 업로드 | Low | 클라이언트 파싱, 크기·행 수 제한 **적용** |
| CSRF | Medium | Same-origin API guard (production) |
| Rate limiting | Medium | IP당 120req/min (in-memory, 서버리스 한계 있음) |
| HTTP 보안 헤더 | OK | `next.config.mjs` — X-Frame-Options, nosniff, Referrer-Policy |
| 의존성 | Medium | `npm audit` 주기 실행 권장 |

---

## 아키텍처

```
Browser (React)
  → hooks (useKisPrices, useBriefingData, …)
  → /api/* (Next.js Route Handlers)
  → lib/kis, lib/briefing, lib/yahoo… (server-only env)
  → Supabase (auth + portfolios JSON, RLS)
  → localStorage (캐시·오프라인)
```

- **UI 단일 출처:** `globals.css` + `PanelCard.tsx`
- **버전:** `lib/appVersion.ts` / `package.json`

---

## API 표면 (5 routes)

| Route | 메서드 | 비고 |
|-------|--------|------|
| `/api/stock-prices` | GET/POST | KIS/Yahoo, max 20 codes |
| `/api/stock-history` | POST | 차트 데이터 |
| `/api/portfolio-benchmark` | POST | 스냅샷 배열 |
| `/api/briefing` | GET/POST | max 30 stocks |
| `/api/discovery` | GET/POST | Top10 발굴 |

공통: `guardApiRequest` + `readJsonBody` (크기 제한).

---

## 웹 독립 운영 체크

1. Vercel에 Supabase env 등록 → 로그인 UI 표시
2. Supabase `schema.sql` + RLS 적용
3. Site URL / Redirect URLs = Vercel 도메인
4. API 키(KIS/DART/FRED/BOK) Vercel Production env
5. `.env.local` 없이 Vercel URL만으로 전 기능 사용 가능

---

## 잔여 권장 (차기)

1. **Vercel Firewall / Upstash Redis** 로 분산 Rate limit
2. **Zod** 스키마로 API body 엄격 검증
3. Supabase **JWT를 API Route에서 검증** (선택, 키 남용 추가 차단)
4. Dependabot + `next` 15 마이그레이션 계획
5. 실키가 Git history에 있었다면 **Supabase·KIS 키 로테이션**

---

## 스트레스·부하 (수동 시나리오)

| 시나리오 | 기대 |
|----------|------|
| 종목 20+ API 연속 호출 | 429 또는 캐시 hit |
| 대용량 CSV (>2MB) | 거부 |
| dailySnapshots 1만 건 POST | 413 |
| 모바일 375px | 탭·판단 세로 스택 |

자동 부하 테스트 도구(k6 등)는 미구축 — 필요 시 CI 추가.
