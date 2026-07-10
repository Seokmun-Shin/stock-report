/**
 * mtock 에디션 — 실행·배포 모델
 *
 * | 에디션 | 코드 | 실행 | 브랜치 |
 * |--------|------|------|--------|
 * | 온라인 | online | Vercel / npm run dev / localhost | research |
 * | 패키지 | package | exe / apk (로컬 내장) | release/sale |
 *
 * 「온라인」= 브라우저 + (개발/호스팅) 서버
 * 「패키지」= 설치 파일 1클릭, 외부 서버·계정 없음
 */

export type MtockEdition = "online" | "package";

/** NEXT_PUBLIC_STANDALONE=true → 패키지(판매) 에디션 */
export const MTOCK_EDITION: MtockEdition =
  process.env.NEXT_PUBLIC_STANDALONE === "true" || process.env.NEXT_PUBLIC_STANDALONE === "1"
    ? "package"
    : "online";

export const IS_ONLINE_EDITION = MTOCK_EDITION === "online";
export const IS_PACKAGE_EDITION = MTOCK_EDITION === "package";

/** @deprecated IS_STANDALONE 와 동일 — 패키지 에디션 */
export const IS_STANDALONE = IS_PACKAGE_EDITION;

export const EDITION_LABEL = {
  online: "온라인 (연구·Vercel)",
  package: "패키지 (판매·exe/apk)",
} as const;

export const EDITION_BRANCH = {
  online: "research",
  package: "release/sale",
} as const;
