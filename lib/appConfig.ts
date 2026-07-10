/** 앱 공통 설정 — 에디션(online/package)은 lib/editions.ts */

import { PRODUCT_PRINCIPLES } from "@/lib/productPrinciples";
import {
  IS_ONLINE_EDITION,
  IS_PACKAGE_EDITION,
  MTOCK_EDITION,
  EDITION_LABEL,
} from "@/lib/editions";

/** 패키지(판매) 에디션 — exe/apk, JSON, 외부 SaaS 없음 */
export const IS_STANDALONE = IS_PACKAGE_EDITION;

export { IS_ONLINE_EDITION, IS_PACKAGE_EDITION, MTOCK_EDITION, EDITION_LABEL };

/** 패키지 에디션 = 로컬 데이터 only */
export const IS_OFFLINE_FIRST_PRODUCT = IS_PACKAGE_EDITION && PRODUCT_PRINCIPLES.localDataOnly;

export const PRODUCT_NAME = "mtock";

export const ONBOARDING_KEY = "stock-report-onboarded-v1";
