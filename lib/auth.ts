import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "ai_usage_session";

function secret() {
  return process.env.SESSION_SECRET || process.env.DASHBOARD_PASSWORD || "dev-secret";
}

export function signSession() {
  return createHmac("sha256", secret()).update("ok").digest("hex");
}

export function isValidSession(value?: string) {
  if (!value) return false;
  const expected = signSession();
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isValidPassword(password: string) {
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
