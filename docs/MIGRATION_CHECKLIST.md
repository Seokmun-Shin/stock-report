# 회사 PC → 개인 PC 이관 체크리스트

웹(Vercel)에서 **독립 운영**하고, 로컬은 **개발용**만 쓰는 전제입니다.

---

## 1. 이관 전 (회사 PC)

- [ ] Git 원격에 최신 push (`git status` 깨끗한지 확인)
- [ ] `.env.local` 내용을 **비밀 메모**(1Password 등)에 백업 — Git에 올리지 말 것
- [ ] Supabase Dashboard → Authentication → URL Configuration 에 Vercel URL 등록됨
- [ ] Vercel → Project → Environment Variables 전체 등록됨 (아래 목록)
- [ ] Vercel 배포 URL에서 로그인·동기화·판단 새로고침·추천·원천 동작 확인
- [ ] `npm run build` / `npm run typecheck` 로컬 통과

### Vercel Environment Variables (Production)

| 변수 | 필수 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 웹 사용 시 **필수** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 웹 사용 시 **필수** |
| `KIS_APP_KEY` / `KIS_APP_SECRET` | 시세 자동 갱신 시 |
| `DART_API_KEY` | 공시·브리핑 |
| `FRED_API_KEY` / `BOK_API_KEY` | 거시 지표 |

---

## 2. 개인 PC 설정

```bash
git clone https://github.com/YOUR_ID/stock-report.git
cd stock-report
npm install
copy .env.local.example .env.local
# .env.local 에 백업한 값 입력

npm run dev    # 개발용 localhost:3000
npm run build  # 배포 전 검증
```

- [ ] Node.js 18+ 설치
- [ ] `.env.local` 복원 (회사 PC와 동일 키 → 같은 Supabase·KIS 데이터)
- [ ] `npm run dev` 후 로그인 → 클라우드 데이터 동기화 확인

---

## 3. 웹 vs 로컬 동작

| 환경 | Supabase env | 동작 |
|------|----------------|------|
| **Vercel (운영)** | 설정됨 | 로그인 필수, 클라우드 저장 |
| **로컬 개발** | 설정됨 | 동일 (로그인 + 동기화) |
| **로컬 개발** | **미설정** | localStorage만, 로그인 없음 (시드/데모) |

운영(웹)에서는 반드시 Supabase env를 Vercel에 등록하세요.

---

## 4. CSS·UI 관리 (변경 시)

| 파일 | 역할 |
|------|------|
| `app/globals.css` | 디자인 토큰·공통 클래스 |
| `components/ui/PanelCard.tsx` | 패널/헤더/버튼 클래스 export |
| `tailwind.config.ts` | gain/loss 색 (`--market-up` 등) |

화면별 Tailwind border/bg 조합 **새로 만들지 말 것** — 위 두 파일만 수정.

---

## 5. 보안 (이관 후 권장)

- [ ] `.env.local.example`에 실키 넣지 않기 (placeholder만)
- [ ] Supabase anon key가 공개 저장소에 올라갔었다면 **키 로테이션** 검토
- [ ] KIS/DART 키는 Vercel **Production** env에만, `NEXT_PUBLIC_` 금지
- [ ] 정기 `npm audit` / Dependabot

---

## 6. 반응형·레이아웃

- 본문 최대 너비: `appLayoutMax` (`max-w-7xl`) — `Dashboard.tsx`, `AppTabNav.tsx`
- 탭 본문: `tabPageStack` / 패널: `tabPanel` — `PanelCard.tsx`
- 매매 판단: 모바일 세로 카드 / `lg+` 2열 비교
- 가격 추이: 모바일에서 차트 컨트롤 헤더 아래 배치

---

## 7. 문제 발생 시

| 증상 | 확인 |
|------|------|
| 로그인 안 됨 | Supabase Redirect URL, Email confirm 설정 |
| 빈 데이터 | schema.sql RLS, 같은 계정 로그인 |
| 시세 — | KIS env, 종목코드 6자리 |
| API 403/429 | 프로덕션 동일 출처·요청 제한 (의도된 보호) |

상세 배포: [DEPLOY.md](../DEPLOY.md) · 보안: [SECURITY_AUDIT.md](./SECURITY_AUDIT.md)
