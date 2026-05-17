import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-key-replace-in-env-production'
);

const COOKIE_NAME = 'auth_session';

/**
 * Hashes a plaintext password using bcryptjs.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compares a plaintext password against a stored bcrypt hash.
 */
export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Creates and signs a secure JWT session token.
 */
export async function signJWT(payload: { userId: string; email: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Session valid for 7 days
    .sign(JWT_SECRET);
}

/**
 * Verifies a JWT session token and returns the parsed payload.
 */
export async function verifyJWT(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: string; email: string };
  } catch (error) {
    return null;
  }
}

/**
 * Retrieves the current authenticated user's session payload from a request's cookies.
 */
export async function getSession(req: NextRequest): Promise<{ userId: string; email: string } | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyJWT(token);
}

/**
 * Get cookie name utility
 */
export function getSessionCookieName(): string {
  return COOKIE_NAME;
}
