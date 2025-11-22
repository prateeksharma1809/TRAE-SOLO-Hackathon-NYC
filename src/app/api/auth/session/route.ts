import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { csvDatabase } from '@/lib/csvDatabase';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false });
    }

    const userId = sessionCookie.value;
    const user = await csvDatabase.findUserById(userId);
    
    if (!user) {
      return NextResponse.json({ authenticated: false });
    }
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.email.split('@')[0]
      }
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ authenticated: false });
  }
}