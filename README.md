# mtock — 주식 거래 관리

**에디션** (실행 방식)과 **브랜치** (작업 줄기)를 구분합니다.

→ **[docs/EDITIONS.md](./docs/EDITIONS.md)** (온라인 vs 패키지)  
→ **[docs/BRANCH_WORKFLOW.md](./docs/BRANCH_WORKFLOW.md)** (연구 vs 판매)

| | 에디션 | 브랜치 | 실행 |
|--|--------|--------|------|
| **연구** | 온라인 (웹·Vercel) | `research` | `DEV.bat` |
| **판매** | 패키지 (exe/apk) | `release/sale` | `START-SALE.bat` · `packaging/` |

최초: `scripts\setup-branches.bat` → `git checkout research`

---

## 연구용 (빠른 시작)

```bash
npm install
copy .env.research.example .env.local   # Supabase 등 설정
npm run dev
```

Windows: **`DEV.bat`**

클라우드 배포 → **[DEPLOY.md](./DEPLOY.md)**

---

## 판매용

```bash
copy .env.sale.example .env.local
START-SALE.bat
```

검수: **[docs/SALE_QA_CHECKLIST.md](./docs/SALE_QA_CHECKLIST.md)**  
구매자 안내: **[docs/STANDALONE_USER.md](./docs/STANDALONE_USER.md)**

---

## 기능 (공통 코드베이스)

- 매매 기록 · FIFO 손익 · 타이밍 참고
- (연구) Supabase 동기화 · (판매) JSON 기기 간 옮김
