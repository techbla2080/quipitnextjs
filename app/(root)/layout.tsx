import { Navbar } from "@/components/navbar";
import { checkSubscription } from "@/lib/subscription";
import SubscriptionLimitsProvider from "@/hooks/useSubscriptionLimits";

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const isPro = await checkSubscription();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <Navbar isPro={isPro} />
      <main className="pt-16 h-full overflow-x-hidden">
        <SubscriptionLimitsProvider>
          {children}
        </SubscriptionLimitsProvider>
      </main>
    </div>
  );
};

export default RootLayout;