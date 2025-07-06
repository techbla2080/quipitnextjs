"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Poppins } from "next/font/google";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion"; // Added for animation

import { cn } from "@/lib/utils";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { useProModal } from "@/hooks/use-pro-modal";

const font = Poppins({ weight: "600", subsets: ["latin"] });

interface NavbarProps {
  isPro: boolean;
}

export const Navbar = ({ isPro }: NavbarProps) => {
  const proModal = useProModal();

  return (
    <div className="fixed w-full z-50 flex justify-between items-center py-2 px-4 h-16 border-b border-primary/10 bg-secondary">
      <div className="flex items-center">
        <MobileSidebar isPro={isPro} />
        <Link href="/">
          <div className="flex items-center">
            <div className="relative">
              <Sparkles className="w-8 h-8 text-blue-500" />
              <motion.div
                className="absolute inset-0 text-blue-600 opacity-75"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="w-8 h-8" />
              </motion.div>
            </div>
            <h1 className={cn("hidden md:block text-xl md:text-3xl font-bold text-primary ml-2", font.className)}>
              Quipit
            </h1>
          </div>
        </Link>
      </div>
      <div className="flex-grow flex justify-center items-center">
        <span className={cn("text-sm md:text-base text-primary font-light", font.className)}>
          AI that Works for You!
        </span>
      </div>
      <div className="flex items-center gap-x-3">
        {!isPro && (
          <Link href="/settings">
            <Button size="sm" variant="premium">
              Upgrade
              <Sparkles className="h-4 w-4 fill-white text-white ml-2" />
            </Button>
          </Link>
        )}
        <ModeToggle />
        <UserButton afterSignOutUrl="/" />
      </div>
    </div>
  );
};