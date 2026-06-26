# 웹 배포 가이드 (Vercel + Supabase)

사무실·집에서 **같은 URL, 같은 데이터**로 쓰는 설정입니다.

---

## 1. Supabase (데이터 + 로그인)

1. [supabase.com](https://supabase.com) 가입 → **New project** 생성
2. **Project Settings → API** 에서 복사:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **SQL Editor** → `supabase/schema.sql` 내용 붙여넣기 → **Run**
4. **Authentication → Providers → Email**  
   - 1인용이면 **Confirm email** 끄기 (바로 로그인 가능)
5. **Authentication → Users** 에서 회원가입하거나, 앱에서 회원가입

---

## 2. 로컬 테스트

```bash
cd stock-report
copy .env.local.example .env.local
# .env.local 에 Supabase URL·키 입력

npm install
npm run dev
```

브라우저 `http://localhost:3000` → 로그인 화면 → 가입/로그인

> `.env.local` 없으면 예전처럼 **브라우저만** 저장 (로그인 화면 없음)

---

## 3. GitHub에 올리기

```bash
git init
git add .
git commit -m "Add Supabase cloud sync"
git branch -M main
git remote add origin https://github.com/YOUR_ID/stock-report.git
git push -u origin main
```

`node_modules`, `.env.local` 은 `.gitignore`에 포함되어 있습니다.

---

## 4. Vercel 배포

1. [vercel.com](https://vercel.com) 가입 → **Add New Project**
2. GitHub 저장소 `stock-report` 연결
3. **Environment Variables** 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Deploy**

배포 후 URL 예: `https://stock-report-xxx.vercel.app`

---

## 5. Supabase URL 허용 (중요)

Vercel 배포 후:

**Authentication → URL Configuration**

| 항목 | 값 |
|------|-----|
| Site URL | `https://your-app.vercel.app` |
| Redirect URLs | `https://your-app.vercel.app/**` |

로컬 개발용: `http://localhost:3000/**` 도 추가

---

## 6. 사용 방법

1. 사무실·집 **같은 이메일/비밀번호**로 로그인
2. 매매 입력 → 자동 클라우드 저장 (헤더에 「클라우드 동기화」)
3. 다른 PC에서 같은 계정 로그인 → **동일 데이터**

### 기존 localStorage 데이터 옮기기

1. 사무실 PC에서 `.env.local` 설정 후 로그인
2. 로그인 시 **「이 기기 데이터로 덮어쓸까요?」** → 예 (로컬에 데이터가 더 많을 때)
3. 집 PC에서 같은 계정 로그인 → 자동 동기화

---

## 문제 해결

| 증상 | 확인 |
|------|------|
| 로그인 안 됨 | Supabase Email 확인 끄기 / Redirect URL |
| 저장 실패 | `schema.sql` 실행 여부 / RLS 정책 |
| 빈 화면 | Vercel Environment Variables 재배포 |
