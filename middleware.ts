import { authMiddleware } from "@clerk/nextjs/server";

export default authMiddleware({
  publicRoutes: [
    "/",                     // Home page
    "/about",                // About page
    "/privacy-policy",       // Privacy policy
    "/terms",                // Terms of service
    "/refund-policy",        // Refund policy
    "/api/webhook",          // Webhooks endpoint
    "/api/crew",             // Crew API
    "/api/crew/[jobId]",     // Crew job status API
    // agents1 route requires authentication
    "/"                      // Any other public pages you want to add
  ],
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};