# mtock 에디션 — 온라인 vs 패키지

지금까지 개발한 것과 앞으로 판매할 것은 **같은 UI·로직**이지만 **실행·배포 모델이 다릅니다.**  
브랜치(연구/판매)와 **별도로** 이 구분을 둡니다.

## 한눈에

| | **온라인 에디션** | **패키지 에디션** |
|--|-------------------|-------------------|
| **비유** | 웹 서비스 | 설치 프로그램 (exe/apk) |
| **실행** | 브라우저 + URL | 파일 1클릭 |
| **서버** | Vercel / `npm run dev` | **내 PC·폰 안** (내장) |
| **데이터** | Supabase 동기화 (연구) | localStorage + **JSON 파일** |
| **외부 계정** | Supabase (연구) | **없음** |
| **브랜치** | `research` | `release/sale` |
| **env** | `.env.research.example` | `.env.sale.example` |
| **실행 파일** | `DEV.bat` | `START-SALE.bat` → (차기) exe/apk |
| **코드 플래그** | `MTOCK_EDITION=online` | `NEXT_PUBLIC_STANDALONE=true` |

## 왜 구분?

- **온라인**: URL 접속, 클라우드·실험, PC·모바일 브라우저
- **패키지**: 다운로드·설치, 서버 장애 없음, 크몽 판매

같은 `stock-report` repo 안에서 **에디션 플래그**로 UI·저장·기능을 나눕니다.  
(`lib/editions.ts`, `IS_PACKAGE_EDITION` / `IS_ONLINE_EDITION`)

## 폴더

| 경로 | 용도 |
|------|------|
| `lib/` | 공통 (매매·손익·UI) |
| `packaging/` | **패키지 전용** — exe/apk 빌드 (Tauri, Capacitor 등) |
| `docs/` | 온라인·패키지 공통 문서 |

**온라인 전용** (Supabase, Vercel) 코드는 패키지 빌드에서 **타지 않거나 숨김**.  
**패키지 전용** (JSON 옮김, 온보딩, exe)은 `release/sale` + `packaging/` 에만 추가.

## 워크플로 (2축)

```
        온라인 에디션          패키지 에디션
              │                      │
         research 브랜치        release/sale 브랜치
         DEV.bat                START-SALE.bat → packaging/
              │                      │
         실험·개발              검수 → exe/apk
              └────── 기능 완성 ──────┘
                    (선별 반영)
```

## Cursor 대화에 한 줄 추가

**연구용:** `온라인 에디션(research)만 — 패키지/packaging/ 수정 금지`

**판매용:** `패키지 에디션(release/sale)만 — packaging/ · STANDALONE · exe/apk`

---

자세한 브랜치 규칙: [BRANCH_WORKFLOW.md](./BRANCH_WORKFLOW.md)
