/** API 키 발급 안내 — 설정 화면 전용 */

export type ApiKeyFieldDef = {
  key: "KIS_APP_KEY" | "KIS_APP_SECRET" | "DART_API_KEY" | "FRED_API_KEY" | "BOK_API_KEY";
  label: string;
  placeholder: string;
};

export type ApiKeyGuide = {
  id: "kis" | "dart" | "fred" | "bok";
  label: string;
  tier: "권장" | "선택";
  summary: string;
  portalLabel: string;
  portalUrl: string;
  fields: ApiKeyFieldDef[];
  steps: string[];
  notes?: string[];
};

export const API_KEY_GUIDES: ApiKeyGuide[] = [
  {
    id: "kis",
    label: "KIS Open API",
    tier: "권장",
    summary: "국내 종목 시세·등락·수급·호가·코스피/코스닥 · 「강추!!」 순위 발굴",
    portalLabel: "한국투자증권 Open API 포털",
    portalUrl: "https://apiportal.koreainvestment.com/",
    fields: [
      { key: "KIS_APP_KEY", label: "APP KEY", placeholder: "발급받은 App Key" },
      { key: "KIS_APP_SECRET", label: "APP SECRET", placeholder: "발급받은 App Secret" },
    ],
    steps: [
      "한국투자증권 계좌가 있어야 합니다 (실전·모의 모두 가능).",
      "Open API 포털에 접속해 한국투자증권 ID로 로그인합니다.",
      "「KIS Developers」→「앱 등록」에서 앱 이름을 입력하고 등록합니다.",
      "등록한 앱 상세에서 APP KEY · APP SECRET을 복사합니다.",
      "아래 두 칸에 붙여넣고 저장한 뒤 「KIS 시세」「발굴 순위」를 눌러 반영합니다.",
    ],
    notes: [
      "모의투자(VTS)만 쓸 경우 하단 「모의투자(VTS) 사용」을 켜세요.",
      "키는 본인 계정·PC에만 저장되며 다른 사용자와 공유되지 않습니다.",
      "미설정 시 Yahoo Finance로 현재가만 조회됩니다 (수급·발굴 순위 없음).",
    ],
  },
  {
    id: "dart",
    label: "DART Open API",
    tier: "선택",
    summary: "금융감독원 전자공시 — 종목 공시·감성 점수 보강",
    portalLabel: "DART 전자공시 OPENDART",
    portalUrl: "https://opendart.fss.or.kr/",
    fields: [{ key: "DART_API_KEY", label: "인증키", placeholder: "40자리 API 인증키" }],
    steps: [
      "OPENDART 홈페이지에서 회원가입 후 로그인합니다.",
      "상단 「인증키 신청/관리」→「인증키 신청」을 선택합니다.",
      "신청 즉시(또는 승인 후) 발급된 인증키를 복사합니다.",
      "아래 입력 후 저장하고 「뉴스·거시」를 갱신합니다.",
    ],
    notes: ["종목코드 6자리가 등록된 경우에만 해당 종목 공시를 조회합니다."],
  },
  {
    id: "fred",
    label: "FRED API",
    tier: "선택",
    summary: "미국 연준 공식 거시지표 — 금리·물가·고용 등",
    portalLabel: "FRED (Federal Reserve Economic Data)",
    portalUrl: "https://fred.stlouisfed.org/docs/api/api_key.html",
    fields: [{ key: "FRED_API_KEY", label: "API KEY", placeholder: "32자리 api_key" }],
    steps: [
      "FRED 사이트에서 무료 계정을 만듭니다.",
      "로그인 후 「My Account」→「API Keys」→「Request API Key」를 클릭합니다.",
      "이메일로 받거나 화면에 표시된 API Key를 복사합니다.",
      "아래에 입력 후 저장하고 「뉴스·거시」를 갱신합니다.",
    ],
  },
  {
    id: "bok",
    label: "BOK ECOS",
    tier: "선택",
    summary: "한국은행 경제통계 — 기준금리·환율·GDP 등",
    portalLabel: "한국은행 ECOS",
    portalUrl: "https://ecos.bok.or.kr/",
    fields: [{ key: "BOK_API_KEY", label: "서비스 인증키", placeholder: "ECOS Open API Key" }],
    steps: [
      "ECOS 홈페이지에서 회원가입 후 로그인합니다.",
      "「Open API」→「인증키 신청」 메뉴에서 키를 발급받습니다.",
      "발급된 서비스 인증키를 아래에 입력하고 저장합니다.",
      "「뉴스·거시」 갱신 시 FRED와 함께 한국 거시 지표에 반영됩니다.",
    ],
  },
];
