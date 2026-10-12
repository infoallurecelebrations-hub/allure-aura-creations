import "server-only";

import { createHmac, pbkdf2Sync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { getAdminEnvironment } from "./env";

export const ADMIN_COOKIE = "aac_admin_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 8;

type SessionPayload = {
  email: string;
  expiresAt: number;
};

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function verifyPassword(password: string, storedHash: string) {
  const [algorithm, iterationsText, saltText, expectedText] = storedHash.split("$");
  const iterations = Number(iterationsText);
  if (algorithm !== "pbkdf2-sha256" || !Number.isSafeInteger(iterations) || iterations < 100_000 || !saltText || !expectedText) {
    return false;
  }

  try {
    const salt = Buffer.from(saltText, "base64url");
    const expected = Buffer.from(expectedText, "base64url");
    const actual = pbkdf2Sync(password, salt, iterations, expected.length, "sha256");
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function verifyAdminCredentials(email: string, password: string) {
  const environment = getAdminEnvironment();
  const suppliedEmail = Buffer.from(email.trim().toLowerCase());
  const expectedEmail = Buffer.from(environment.adminEmail);
  const emailMatches = suppliedEmail.length === expectedEmail.length && timingSafeEqual(suppliedEmail, expectedEmail);
  const passwordMatches = verifyPassword(password, environment.adminPasswordHash);
  return emailMatches && passwordMatches;
}

export function createSessionToken(email: string) {
  const environment = getAdminEnvironment();
  const payload: SessionPayload = {
    email: email.trim().toLowerCase(),
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded, environment.sessionSecret)}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;

  try {
    const environment = getAdminEnvironment();
    const [encoded, suppliedSignature] = token.split(".");
    if (!encoded || !suppliedSignature) return null;
    const expectedSignature = sign(encoded, environment.sessionSecret);
    const supplied = Buffer.from(suppliedSignature);
    const expected = Buffer.from(expectedSignature);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;

    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (payload.email !== environment.adminEmail || payload.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(ADMIN_COOKIE)?.value);
}

export function hasValidOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}
