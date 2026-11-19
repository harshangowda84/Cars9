import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const SESSION_COOKIE_NAME = "cars9_session";
const JWT_SECRET = process.env.JWT_SECRET || "cars9-super-secret-studio-jwt-key-2026-production";
const key = new TextEncoder().encode(JWT_SECRET);

export interface SessionPayload {
  username: string;
  role: "admin" | "staff";
  [key: string]: any;
}

/**
 * Creates an encrypted JWT session token valid for 24 hours
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);
}

/**
 * Verifies and decodes a session token
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload as SessionPayload;
  } catch (err) {
    return null;
  }
}

/**
 * Retrieves the current session from request cookies or Next.js cookies()
 */
export async function getSession(request?: NextRequest | Request): Promise<SessionPayload | null> {
  let token: string | undefined;

  if (request) {
    if ("cookies" in request && typeof (request as NextRequest).cookies?.get === "function") {
      token = (request as NextRequest).cookies.get(SESSION_COOKIE_NAME)?.value;
    } else {
      const cookieHeader = request.headers.get("cookie") || "";
      const match = cookieHeader.match(new RegExp(`(^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
      token = match ? decodeURIComponent(match[2]) : undefined;
    }
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    } catch {
      return null;
    }
  }

  if (!token) return null;
  return await verifySessionToken(token);
}

/**
 * Sets the HttpOnly session cookie on a NextResponse.
 * Omits maxAge so it acts as an in-memory browser session cookie (cleared when browser/tab session ends).
 */
export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Clears the session cookie on a NextResponse
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
