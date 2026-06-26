# Vercel 배포 — 집·사무실 접속용

배포가 끝나면 **`https://xxxx.vercel.app`** 주소로 어디서든 접속합니다.

---

## 준비물

- [x] Supabase `portfolios` 테이블
- [x] `.env.local` (Supabase URL + anon key)
- [x] 로그인 테스트 완료
- [ ] GitHub 계정
- [ ] Vercel 계정 (GitHub로 가입 가능)

---

## 1단계 — GitHub에 코드 올리기

### 1-1. DEPLOY.bat 실행 (선택)

`Desktop\stock-report\DEPLOY.bat` 더블클릭 → Git 초기화·커밋

### 1-2. GitHub에 빈 저장소 만들기

1. [https://github.com/new](https://github.com/new)
2. **Repository name:** `stock-report`
3. **Private** 선택 (개인용 권장)
4. **Add README** 체크 **하지 않음**
5. **Create repository**

### 1-3. 터미널에서 push

`stock-report` 폴더에서 cmd:

```bat
git remote add origin https://github.com/본인GitHub아이디/stock-report.git
git push -u origin main
```

(GitHub 로그인 창이 뜨면 승인)

> 이미 `origin`이 있으면:  
> `git remote set-url origin https://github.com/본인아이디/stock-report.git`

---

## 2단계 — Vercel 배포

1. [https://vercel.com/new](https://vercel.com/new) 접속
2. **Continue with GitHub** → 권한 허용
3. **Import** → `stock-report` 선택
4. **Environment Variables** 펼치기 → `.env.local`과 **동일하게** 2개 추가:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://kuuvibchyzlkblzdfcia.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local`의 anon 키 |

5. **Deploy** 클릭 (2~3분)

6. 완료 후 **Visit** → 배포 URL 확인  
   예: `https://stock-report-xxxx.vercel.app`

---

## 3단계 — Supabase URL 허용 (필수)

1. Supabase → **Authentication** → **URL Configuration**
2. 설정:

| 항목 | 값 |
|------|-----|
| **Site URL** | `https://stock-report-xxxx.vercel.app` (본인 Vercel URL) |
| **Redirect URLs** | `https://stock-report-xxxx.vercel.app/**` |

3. **Save**

로컬 개발용으로 `http://localhost:3000/**` 도 Redirect URLs에 남겨 두세요.

---

## 4단계 — 집에서 접속

1. 브라우저에서 **Vercel URL** 열기
2. **같은 이메일 / 비밀번호** 로그인
3. 사무실과 **동일 데이터** 확인

집 PC에 Node.js·`npm run dev` **필요 없음**.

---

## 이후 코드 수정 시

GitHub에 push하면 Vercel이 **자동 재배포**합니다.

```bat
git add .
git commit -m "update"
git push
```

---

## 문제 해결

| 증상 | 해결 |
|------|------|
| Vercel 빌드 실패 | Vercel 로그에서 에러 확인, 로컬 `npm run build` 테스트 |
| 배포 URL에서 로그인 실패 | Supabase Redirect URLs · Site URL 재확인 |
| 데이터 안 맞음 | 같은 계정으로 로그인했는지 확인 |

---

## .env.local은 GitHub에 올리지 마세요

`.gitignore`에 포함되어 있습니다. Vercel에는 **Environment Variables**로만 등록합니다.
