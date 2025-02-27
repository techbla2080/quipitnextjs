import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // If accessing with www, redirect to the non-www version
  if (url.hostname.startsWith('www.')) {
    const newHostname = url.hostname.replace(/^www\./, '');
    url.hostname = newHostname;
    
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

// This ensures it runs before the auth middleware
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};