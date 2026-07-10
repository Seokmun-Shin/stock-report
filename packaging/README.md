# packaging/ — 패키지 에디션 전용

**온라인 에디션(research)** 과 분리된 **판매용 설치 파일** 빌드 설정이 들어갑니다.

- Windows: Tauri / Electron → `mtock-setup.exe`
- Android: Capacitor → `mtock.apk`

공통 UI·로직은 repo 루트 `app/`, `components/` (패키지 플래그 `NEXT_PUBLIC_STANDALONE=true`).

연구용 브랜치에서는 이 폴더를 **수정하지 않습니다.**

상세: [docs/EDITIONS.md](../docs/EDITIONS.md)
