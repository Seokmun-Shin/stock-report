/**
 * mtock 제품 원칙 (판매·단독 실행판)
 *
 * 사용자·판매자 모두 외부 서비스(계정·호스팅·동기화 SaaS) 없이 사용.
 * - 데이터: 이 PC 브라우저 localStorage + JSON 백업
 * - API 키·Supabase·Vercel·Google Drive·판매자 서버: 사용하지 않음 (판매 SKU)
 * - 인터넷: 시세(Yahoo)·뉴스(RSS) 등 조회용만 선택 (계정 불필요). 완전 오프라인 시 수동 시세.
 * - PC↔모바일: 같은 ZIP/서버 없이 JSON 파일·(차기) QR로 기기 간 옮김
 */

export const PRODUCT_PRINCIPLES = {
  /** 가계부식 「내 주식 거래 관리」 — 투자 자문·자동매매 아님 */
  positioning: "ledger" as const,
  /** Supabase/Vercel/Google OAuth/판매자 라이선스 서버 미사용 */
  noExternalAccounts: true,
  /** 포트폴리오를 제3자 클라우드에 저장하지 않음 */
  localDataOnly: true,
  /** 판매자 호스팅·장애 대응 의무 없음 */
  noSellerInfrastructure: true,
  /** v2 클라우드/Drive/웹호스팅 SKU는 이 원칙과 별도(미채택) */
  cloudSkuDeferred: true,
  /** Git: research=온라인, release/sale=패키지 — docs/EDITIONS.md */
  onlineEditionBranch: "research",
  packageEditionBranch: "release/sale",
} as const;

/** 판매판에서 숨기거나 비활성화하는 기능 */
export const STANDALONE_EXCLUDES = [
  "supabase-auth",
  "cloud-sync",
  "vercel-deploy-hints",
  "google-drive-sync",
  "online-license-server",
] as const;
