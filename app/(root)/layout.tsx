import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { checkSubscription } from "@/lib/subscription";

const RootLayout = async ({
  children
}: {
  children: React.ReactNode;
}) => {
  const isPro = await checkSubscription();

  return ( 
    <div className="h-full relative">
      <Navbar isPro={isPro} />
      <div className="hidden md:flex mt-16 h-full w-20 flex-col fixed inset-y-0 z-10 bg-gray-950">
        <Sidebar isPro={isPro} />
      </div>
      <main className="md:pl-20 pt-16 h-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}

export default RootLayout;