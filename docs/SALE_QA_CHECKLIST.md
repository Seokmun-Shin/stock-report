# 판매용 검수 체크리스트 (release/sale)

검수는 **`release/sale` 브랜치** + **`.env.sale.example` → `.env.local`** + **`START-SALE.bat`** 기준.

## 설치·실행

- [ ] Node.js **없는** PC에서 (최종 목표: exe/apk — 준비 전까지는 START-SALE.bat)
- [ ] `NEXT_PUBLIC_STANDALONE=true` 빌드에 포함
- [ ] Supabase 로그인 화면 **없음**
- [ ] 「동기화」·Vercel·git push 안내 **없음**

## 가계부式 — 핵심 기능

- [ ] 첫 실행: 빈 장부 / 샘플 선택
- [ ] 종목 추가 → 매수·매도 입력
- [ ] 「얼마벌어?」 손익 표시
- [ ] API **없이** 위 흐름 동작 (시세: Yahoo 또는 수동)

## 데이터·기기 간

- [ ] JSON 내보내기 → 다른 브라우저/PC 가져오기
- [ ] 덮어쓰기 전 확인 문구
- [ ] 설정에 「다른 기기로 옮기기」 3단계 안내

## 선택 기능

- [ ] KIS 없을 때 「강추!!」 안내 (앱 전체는 사용 가능)
- [ ] API 키는 `data/local-secrets.json` (선택)

## 크몽·문서 일치

- [ ] STANDALONE_USER.md 와 실제 동작 일치
- [ ] 「자동 PC↔모바일 동기화 없음」 명시
- [ ] 「유지보수·커스텀 없음」 명시
- [ ] 면책: 참고용, 투자 책임은 본인

## 통과 후

- [ ] exe / apk 패키징 (차기)
- [ ] ZIP + 설명서 + 버전 번호

## 실패 시

1. 이슈를 **research** 브랜치에서 수정  
2. 판매에 필요한 커밋만 **release/sale**에 반영  
3. 체크리스트 **재실행**
