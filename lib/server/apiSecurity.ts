import { NextResponse } from "next/server";

const MAX_BODY_BYTES = 256 * 1024;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 120;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

function rateLimit(ip: string): NextResponse | null {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return null;
  }
  bucket.count += 1;
  if (bucket.count > RATE_MAX) {
    return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도하세요." }, { status: 429 });
  }
  return null;
}

/** 프로덕션: 동일 출처 브라우저 요청만 허용 (직접 curl 남용 완화) */
function assertSameOrigin(req: Request): NextResponse | null {
  if (process.env.NODE_ENV !== "production") return null;

  const host = req.headers.get("host");
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  if (!host) return null;

  const allowed = [`https://${host}`, `http://${host}`];
  if (origin && !allowed.some((a) => origin.startsWith(a))) {
    return NextResponse.json({ error: "허용되지 않은 요청 출처입니다." }, { status: 403 });
  }
  if (!origin && referer) {
    try {
      const refHost = new URL(referer).host;
      if (refHost !== host) {
        return NextResponse.json({ error: "허용되지 않은 요청 출처입니다." }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "잘못된 Referer입니다." }, { status: 400 });
    }
  }
  return null;
}

export function guardApiRequest(req: Request): NextResponse | null {
  const limited = rateLimit(clientIp(req));
  if (limited) return limited;

  const originBlock = assertSameOrigin(req);
  if (originBlock) return originBlock;

  const len = req.headers.get("content-length");
  if (len && Number(len) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "요청 본문이 너무 큽니다." }, { status: 413 });
  }

  return null;
}

export async function readJsonBody<T>(req: Request): Promise<T | NextResponse> {
  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return NextResponse.json({ error: "본문을 읽을 수 없습니다." }, { status: 400 });
  }

  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "요청 본문이 너무 큽니다." }, { status: 413 });
  }

  if (!raw.trim()) {
    return NextResponse.json({ error: "JSON body 필요" }, { status: 400 });
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return NextResponse.json({ error: "JSON 형식이 올바르지 않습니다." }, { status: 400 });
  }
}
