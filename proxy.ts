import { NextRequest, NextResponse } from 'next/server'

export function proxy(req: NextRequest) {
  // Since your app handles auth state in the main page component (app/page.tsx),
  // we don't need to redirect here. The page component will show login or dashboard
  // based on the auth token check.
  
  // Just allow all requests to pass through
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}

