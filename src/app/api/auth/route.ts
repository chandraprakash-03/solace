import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, comparePasswords, signJWT, getSession, getSessionCookieName } from '@/lib/auth';

const COOKIE_NAME = getSessionCookieName();

/**
 * GET: Retrieves the active user's session information.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        preferredMode: true,
      },
    });

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 404 });
    }

    return NextResponse.json({ authenticated: true, user });
  } catch (error) {
    console.error('Session retrieval error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST: Handles login and registration.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const formattedEmail = email.toLowerCase().trim();

    // REGISTER ACTION
    if (action === 'register') {
      // Check if user already exists
      const existingUser = await db.user.findUnique({
        where: { email: formattedEmail },
      });

      if (existingUser) {
        return NextResponse.json({ error: 'User already exists' }, { status: 400 });
      }

      // Hash password and create user
      const passwordHash = await hashPassword(password);
      const user = await db.user.create({
        data: {
          email: formattedEmail,
          passwordHash,
          name: name || null,
        },
      });

      // Sign JWT and set cookie
      const token = await signJWT({ userId: user.id, email: user.email });
      const response = NextResponse.json({
        success: true,
        user: { id: user.id, email: user.email, name: user.name, preferredMode: user.preferredMode },
      });

      response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;
    }

    // LOGIN ACTION
    if (action === 'login') {
      const user = await db.user.findUnique({
        where: { email: formattedEmail },
      });

      if (!user) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      // Verify password
      const isPasswordValid = await comparePasswords(password, user.passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      // Sign JWT and set cookie
      const token = await signJWT({ userId: user.id, email: user.email });
      const response = NextResponse.json({
        success: true,
        user: { id: user.id, email: user.email, name: user.name, preferredMode: user.preferredMode },
      });

      response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Authentication POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE: Logs the user out by clearing their session cookie.
 */
export async function DELETE() {
  try {
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    response.cookies.set(COOKIE_NAME, '', {
      httpOnly: true,
      maxAge: 0,
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
