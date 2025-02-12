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
      <SheetContent 
        side="left" 
        className="p-0 w-[280px] overflow-y-auto overflow-x-hidden" // Fixed width and hide horizontal scroll
      >
        <div className="flex flex-col h-full w-full">
          <Sidebar isPro={isPro} />
        </div>
      </SheetContent>
    </Sheet>
  );
};