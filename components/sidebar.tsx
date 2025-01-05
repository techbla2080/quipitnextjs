"use client";

import { Home, Plus, Settings, Info, Briefcase, Trash } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useProModal } from "@/hooks/use-pro-modal";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";

// Interface for the API response
interface TripApiResponse {
  _id: string;
  jobId: string;
  location: string;
  dateRange: string;
  interests: string[];
  cities: string[];
  tripResult: string;
  createdAt: string;
}

// Interface for the formatted trip data used in the sidebar
interface SavedTrip {
  _id: string;
  job_id: string;
  location: string;
  dateRange: string;
  interests: string[];
  cities: string[];
  content: string;
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

  const navigateToTrip = async (trip: SavedTrip) => {
    console.log('Navigating to trip:', trip.job_id);
    await router.replace('/agents1');
    router.push(`/agents1?job_id=${trip.job_id}`);
  };

  const handleDeleteTrip = async (e: React.MouseEvent<HTMLButtonElement>, job_id: string) => {
    e.stopPropagation();
    try {
      const response = await fetch('/api/trips', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ job_id }) // Send job_id in request body
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete trip');
      }

      // Remove from frontend state
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

  const fetchSavedTrips = async () => {
    try {
      console.log('Starting to fetch saved trips...');
      const response = await fetch('/api/trips');
      
      if (!response.ok) {
        console.error('Fetch response not ok:', response.status);
        return;
      }

      const data = await response.json();
      console.log('Raw API response:', data);

      if (data.success && Array.isArray(data.trips)) {
        const formattedTrips: SavedTrip[] = data.trips.map((trip: TripApiResponse) => ({
          _id: trip._id,
          job_id: trip.jobId,
          location: trip.location,
          dateRange: trip.dateRange,
          interests: trip.interests,
          cities: trip.cities,
          content: trip.tripResult,
          createdAt: new Date(trip.createdAt)
        }));
        
        console.log('Formatted trips:', formattedTrips);
        setSavedTrips(formattedTrips);
      }
    } catch (error) {
      console.error('Error in fetchSavedTrips:', error);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchSavedTrips();

    // Event listener for saved trips
    const handleTripSaved = async () => {
      console.log('Trip saved event received in sidebar');
      await fetchSavedTrips();
    };

    window.addEventListener('tripSaved', handleTripSaved);
    
    return () => {
      window.removeEventListener('tripSaved', handleTripSaved);
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
    <div className="space-y-4 flex flex-col h-full bg-gray-50 w-32 border-r">
      <div className="p-3 flex-1 flex justify-center overflow-y-auto">
        <div className="space-y-2 w-full">
          {routes.map((route) => (
            <div
              onClick={() => onNavigate(route.href, route.pro)}
              key={route.href}
              className={cn(
                "text-blue-600 text-xs group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-blue-50 rounded-lg transition",
                pathname === route.href && "bg-blue-50"
              )}
            >
              <div className="flex flex-col gap-y-2 items-center flex-1">
                <route.icon className="h-5 w-5 text-blue-600" />
                {route.label}
              </div>
            </div>
          ))}

          <div className="mt-6 border-t pt-4">
            <h2 className="px-3 text-xs font-semibold text-blue-600 mb-2">SAVED TRIPS</h2>
            <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
              {savedTrips && savedTrips.length > 0 ? (
                savedTrips.map((trip) => {
                  // Get the current job_id from URL to check if this trip is active
                  const urlParams = new URLSearchParams(window.location.search);
                  const currentJobId = urlParams.get('job_id');
                  const isActive = currentJobId === trip.job_id;

                  return (
                    <div
                      key={trip._id}
                      onClick={() => navigateToTrip(trip)}
                      className={cn(
                        "px-3 py-2 text-xs hover:bg-blue-50 rounded-lg cursor-pointer relative group",
                        isActive && "bg-blue-50"
                      )}
                    >
                      <div className="pr-8">
                        <div className="font-medium text-blue-600">{trip.location}</div>
                        <div className="text-[10px] text-blue-600/70">
                          {trip.dateRange}
                          <br />
                          <span className="opacity-75">ID: {trip.job_id}</span>
                        </div>
                      </div>
                      <Button
                        onClick={(e) => handleDeleteTrip(e, trip.job_id)}
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash className="h-4 w-4 text-blue-600 hover:text-red-500" />
                      </Button>
                    </div>
                  );
                })
              ) : (
                <p className="px-3 text-xs text-blue-600/70">
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