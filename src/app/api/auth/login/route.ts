import { NextRequest, NextResponse } from 'next/server';
import { csvDatabase } from '@/lib/csvDatabase';
import { createSession, hashPassword, verifyPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, isRegister, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const existingUser = await csvDatabase.findUserByEmail(email);

    if (isRegister) {
      // Registration
      if (!name || !name.trim()) {
        return NextResponse.json(
          { error: 'Name is required for registration' },
          { status: 400 }
        );
      }
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'User already exists' },
          { status: 400 }
        );
      }

      const hashedPassword = await hashPassword(password);
      const user = await csvDatabase.createUser(email, name, hashedPassword);
      const session = await createSession(user.id);

      const response = NextResponse.json({ 
        success: true, 
        user: { id: user.id, email: user.email, name: name || user.email.split('@')[0] } 
      });
      
      response.cookies.set('session', user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;
    } else {
      // Login
      if (!existingUser) {
        return NextResponse.json({ needsRegistration: true }, { status: 404 });
      }

      const isValidPassword = await verifyPassword(password, existingUser.password);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      const session = await createSession(existingUser.id);

      const response = NextResponse.json({ 
        success: true, 
        user: { id: existingUser.id, email: existingUser.email, name: existingUser.email.split('@')[0] } 
      });
      
      response.cookies.set('session', existingUser.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}