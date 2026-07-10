# mtock — 연구용 / 판매용 워크플로

## 브랜치

| 브랜치 | 에디션 | 역할 | 실행 |
|--------|--------|------|------|
| **`research`** | **온라인** | 연구·실험·Vercel | `DEV.bat` |
| **`release/sale`** | **패키지** | 검수·exe/apk·크몽 | `START-SALE.bat` · `packaging/` |

에디션: [EDITIONS.md](./EDITIONS.md)

**규칙**

- 연구용에서 **막 테스트** → 완성된 기능만 판매용으로 **merge / cherry-pick**
- 판매용 브랜치에서 **연구용 실험 코드 직접 작성 금지** (버그·패키징·검수만)
- 판매 검수 **실패** → 연구용에서 수정 → 다시 판매용 반영

## 환경 변수 (`.env.local`)

| 브랜치 | 템플릿 | 내용 |
|--------|--------|------|
| research | `.env.research.example` | Supabase·KIS 등 (연구·Vercel) |
| release/sale | `.env.sale.example` | `NEXT_PUBLIC_STANDALONE=true` 만 |

같은 폴더를 쓰므로 **브랜치 전환 후 `.env.local` 확인** 필수.

## 흐름

```
research     개발 · 기능 테스트 · 실험
    ↓  (판매에 넣을 기능만)
release/sale 판매 검수 (docs/SALE_QA_CHECKLIST.md)
    ↓  통과
             exe/apk 패키징 → 크몽
    ↓  실패
research     수정 → 다시 release/sale 반영
```

## Git — 최초 1회

```bash
cd Desktop\stock-report
git checkout -b research
git checkout -b release/sale
git checkout research
```

일상: `git checkout research` / `git checkout release/sale`

## Cursor 대화 (2개 권장)

**연구용 첫 메시지**

> stock-report **온라인 에디션 · research** 만.  
> 브랜치: `research` · `DEV.bat` · Supabase/Vercel OK.  
> **패키지·packaging·STANDALONE 수정 금지** (release/sale).

**판매용 첫 메시지**

> stock-report **패키지 에디션 · release/sale** 만.  
> exe/apk · JSON · 외부 서버 없음 · `packaging/` · `NEXT_PUBLIC_STANDALONE=true`.  
> **온라인·Supabase·Vercel merge 금지.** 검수: SALE_QA_CHECKLIST.md

## 문서

- 판매 검수: [SALE_QA_CHECKLIST.md](./SALE_QA_CHECKLIST.md)
- 구매자 안내: [STANDALONE_USER.md](./STANDALONE_USER.md)
- 클라우드(연구·본인): [../DEPLOY.md](../DEPLOY.md)
