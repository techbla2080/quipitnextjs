import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/sidebar";

export const MobileSidebar = ({
  isPro
}: {
  isPro: boolean;
}) => {
  return (
    <Sheet>
      <SheetTrigger className="md:hidden pr-4">
        <Menu />
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-screen max-w-[300px] overflow-y-auto">
        <div className="h-full">
          <Sidebar isPro={isPro} />
        </div>
      </SheetContent>
    </Sheet>
  );
};