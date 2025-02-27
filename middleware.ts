import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authMiddleware } from "@clerk/nextjs/server";

// Export the clerk auth middleware with your existing configuration
export default authMiddleware({
  beforeAuth: (req) => {
    // Handle URL redirection before auth checks
    const url = req.nextUrl.clone();
    
    // If accessing with www, redirect to the non-www version
    if (url.hostname.startsWith('www.')) {
      const newHostname = url.hostname.replace(/^www\./, '');
      url.hostname = newHostname;
      
      return NextResponse.redirect(url);
    }
    
    return NextResponse.next();
  },
  publicRoutes: [
    "/",                     // Home page
    "/privacy-policy",       // Privacy policy
    "/terms",                // Terms of service
    "/refund-policy",        // Refund policy
    "/api/webhook",          // Webhooks endpoint
    "/api/crew",             // Crew API
    "/api/crew/[jobId]",     // Crew job status API
    // agents1 route requires authentication
  ],
});

// Keep your existing config
export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};