/** Supabase Auth 오류 → 한글 안내 */
export function formatAuthError(error: { message?: string; status?: number }): string {
  const msg = error.message ?? "";

  if (msg.includes("Invalid login credentials")) {
    return "이메일 또는 비밀번호가 맞지 않습니다.";
  }
  if (msg.includes("Email not confirmed")) {
    return "이메일 인증이 필요합니다. Supabase에서 Confirm email을 끄거나, 확인 메일 링크를 눌러 주세요.";
  }
  if (msg.includes("User already registered")) {
    return "이미 가입된 이메일입니다. 로그인을 시도해 주세요.";
  }
  if (msg.includes("Password should be at least")) {
    return "비밀번호는 6자 이상이어야 합니다.";
  }
  if (msg.includes("Unable to validate email address")) {
    return "이메일 형식을 확인해 주세요.";
  }
  if (msg.includes("Invalid API key") || msg.includes("JWT")) {
    return "Supabase API 키가 올바르지 않습니다. .env.local의 anon 키를 확인해 주세요.";
  }

  return msg || "로그인에 실패했습니다.";
}

export function toAuthError(error: unknown): Error {
  if (error && typeof error === "object" && "message" in error) {
    return new Error(formatAuthError(error as { message?: string }));
  }
  if (error instanceof Error) return error;
  return new Error("알 수 없는 오류가 발생했습니다.");
}
