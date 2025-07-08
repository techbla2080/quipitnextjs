"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export function useEnforceFreeLimitRedirect() {
  const router = useRouter();
  const { userId } = useAuth();

  useEffect(() => {
    async function checkLimits() {
      if (!userId) return;
      const res = await fetch("/api/subscription/check-limits");
      const data = await res.json();
      if (
        data.user.subscriptionStatus === "free" &&
        (data.limits.currentTrips + data.limits.currentImages) >= 2
      ) {
        router.replace("/pricing");
      }
    }
    checkLimits();
  }, [userId, router]);
}
