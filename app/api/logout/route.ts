import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    // Optionally call Laravel logout endpoint to invalidate token server-side
    if (token) {
      try {
        await fetch(`${apiBase}/api/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
      } catch (error) {
        logger.warn('Laravel logout endpoint failed:', error);
        // Continue with client-side logout even if server-side fails
      }
    }

    // Return success response
    // Client will handle clearing localStorage and redirecting
    return NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Logout failed' },
      { status: 500 }
    );
  }
}
