import { authMiddleware } from "@clerk/nextjs/server"; 

export default authMiddleware({
  publicRoutes: [
    "/api/webhook",
    "/api/crew",  // Allow public access to the crew API
    "/api/crew/[jobId]",  // Allow public access to the crew job status API
  ],
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};

