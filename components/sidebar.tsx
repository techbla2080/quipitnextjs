"use client";

import { Home, Plus, Settings, Info, Briefcase, Trash } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useProModal } from "@/hooks/use-pro-modal";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";

interface SavedTrip {
  _id: string;
  job_id: string;
  location: string;
  dateRange: string;
  interests: string;
  cities: string;
  content: any;
  createdAt: Date;
}

interface SidebarProps {
  isPro: boolean;
}

export const Sidebar = ({ isPro }: SidebarProps) => {
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const proModal = useProModal();
  const router = useRouter();
  const pathname = usePathname();

  const onNavigate = (url: string, pro: boolean) => {
    if (pro && !isPro) {
      return proModal.onOpen();
    }
    return router.push(url);
  };

  const navigateToTrip = (trip: SavedTrip) => {
    router.push(`/agents1?job_id=${trip.job_id}`);
  };

  const handleDeleteTrip = async (e: React.MouseEvent<HTMLButtonElement>, job_id: string) => {
    e.stopPropagation();
    try {
      // First make the DELETE request to backend
      const response = await fetch(`/api/trips?job_id=${job_id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete trip');
      
      // If backend delete was successful, then update frontend state
      setSavedTrips(current => current.filter(trip => trip.job_id !== job_id));
      toast.success('Trip deleted successfully');

      // If we're currently viewing this trip, redirect to main page
      const urlParams = new URLSearchParams(window.location.search);
      const currentJobId = urlParams.get('job_id');
      
      if (currentJobId === job_id) {
        router.push('/agents1');
      }
      
    } catch (error) {
      console.error('Error deleting trip:', error);
      toast.error('Failed to delete trip');
    }
};

useEffect(() => {
  const fetchSavedTrips = async () => {
    try {
      console.log('Fetching saved trips...'); 
      const response = await fetch('/api/trips');
      
      if (!response.ok) {
        console.error('Fetch failed:', response.status);
        return;
      }

      const data = await response.json();
      console.log('Fetched trips data:', data);
      
      if (data.success) {
        setSavedTrips(data.trips);
        console.log('Updated savedTrips state:', data.trips);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
    }
  };

  // Handle trip saved event with data
  const handleTripSaved = async (event: Event) => {
    console.log('Trip saved event received');
    if ((event as CustomEvent).detail) {
      console.log('Event detail:', (event as CustomEvent).detail);
    }
    await fetchSavedTrips(); // Refetch all trips
  };
  
  // Initial fetch
  fetchSavedTrips();
  
  // Add event listener
  window.addEventListener('tripSaved', handleTripSaved);
  
  // Shorter interval for testing
  const intervalId = setInterval(fetchSavedTrips, 3000);
  
  return () => {
    window.removeEventListener('tripSaved', handleTripSaved);
    clearInterval(intervalId);
  };
}, []);

  const routes = [
    {
      icon: Home,
      href: "/",
      label: "Home",
      pro: false,
    },
    {
      icon: Briefcase,
      href: "/agents1",
      label: "Travel Agents",
      pro: false,
    },
    {
      icon: Settings,
      href: "/settings",
      label: "Settings",
      pro: false,
    },
    {
      icon: Info,
      href: "/about",
      label: "About",
      pro: false,
    },
  ];

  return (
    <div className="space-y-4 flex flex-col h-full text-primary bg-secondary">
      <div className="p-3 flex-1 flex justify-center">
        <div className="space-y-2 w-full">
          {routes.map((route) => (
            <div
              onClick={() => onNavigate(route.href, route.pro)}
              key={route.href}
              className={cn(
                "text-muted-foreground text-xs group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-primary hover:bg-primary/10 rounded-lg transition",
                pathname === route.href && "bg-primary/20 text-primary"
              )}
            >
              <div className="flex flex-col gap-y-2 items-center flex-1">
                <route.icon className="h-5 w-5" />
                {route.label}
              </div>
            </div>
          ))}

          <div className="mt-6 border-t pt-4">
            <h2 className="px-3 text-xs font-semibold mb-2">SAVED TRIPS</h2>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {savedTrips && savedTrips.length > 0 ? (
                savedTrips.map((trip) => (
                  <div
                    key={trip._id}
                    onClick={() => navigateToTrip(trip)}
                    className="px-3 py-2 text-xs hover:bg-primary/10 rounded-lg cursor-pointer relative group"
                  >
                    <div className="pr-8">
                      <div className="font-medium">{trip.location}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {trip.dateRange}
                        <br />
                        <span className="opacity-60">ID: {trip.job_id}</span>
                      </div>
                    </div>
                    <Button
                      onClick={(e) => handleDeleteTrip(e, trip.job_id)}
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="px-3 text-xs text-muted-foreground">
                  No saved trips yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};