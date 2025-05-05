// src/app/api/auth/status/route.ts
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Set a JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

export async function GET() {
  try {
    // Get the token from the cookie with proper async handling
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('donorlink_token');
    
    if (!tokenCookie) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }
    
    const token = tokenCookie.value;
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      userType: 'donor' | 'clinic';
      name?: string;
    };
    
    // Return user info
    return NextResponse.json({
      authenticated: true,
      user: {
        id: decoded.id,
        email: decoded.email,
        userType: decoded.userType,
        name: decoded.name || ''
      }
    });
    
  } catch (error) {
    console.error('Auth status error:', error);
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}