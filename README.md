# 주식 매매 리포트

엑셀 없이 **수익 + 매매 타이밍**을 한 화면에서 확인합니다.

## 실행 (로컬)

```bash
cd Desktop\stock-report
npm install
npm run dev
```

브라우저 **http://localhost:3000**

Windows: `START.bat` 더블클릭

## 클라우드 (사무실·집 동기화)

Supabase + Vercel 배포 방법 → **[DEPLOY.md](./DEPLOY.md)**

1. `.env.local.example` → `.env.local` (Supabase URL·키)
2. `supabase/schema.sql` 실행
3. 로그인 → 데이터 자동 동기화

`.env` 없으면 예전처럼 **브라우저 localStorage**만 사용합니다.

## 기능

- 전체 요약 · 초기 투자금 기준 수익
- 종목별 타이밍 · 정산 · 매매 내역
- FIFO 수익률 · ★ 초기 투자금 지정
- (선택) 이메일 로그인 + 클라우드 저장
