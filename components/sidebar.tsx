"use client";

import { Home, Plus, Settings, Info, Briefcase, Trash, Calendar, MapPin, Menu, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useProModal } from "@/hooks/use-pro-modal";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";

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

interface SavedTripItemProps {
  trip: SavedTrip;
  isActive: boolean;
  onDelete: (e: React.MouseEvent<HTMLButtonElement>, job_id: string) => void;
  onClick: () => void;
}

const SavedTripItem: React.FC<SavedTripItemProps> = ({ trip, isActive, onDelete, onClick }) => (
  <div 
    onClick={onClick}
    className={`
      relative px-4 py-3 
      hover:bg-blue-50/50 rounded-lg 
      cursor-pointer group transition-all
      ${isActive ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-white shadow-sm'}
    `}
  >
   <div className="flex items-center justify-between mb-2">
     <span className="font-semibold text-gray-800">{trip.location}</span>
     <Button
       onClick={(e) => onDelete(e, trip.job_id)}
       variant="ghost"
       size="icon"
       className="opacity-0 group-hover:opacity-100 transition-all"
     >
       <Trash className="h-4 w-4 text-gray-400 hover:text-red-500" />
     </Button>
   </div>
   
   <div className="flex items-center space-x-4 text-sm text-gray-600">
     <div className="flex items-center">
       <Calendar className="h-4 w-4 mr-2" />
       {trip.dateRange}
     </div>
     <div className="flex items-center">
       <MapPin className="h-4 w-4 mr-2" />
       {trip.cities[0]}
     </div>
   </div>

   <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
     <div 
       className="bg-blue-500 h-1.5 rounded-full transition-all"
       style={{ width: isActive ? '100%' : '75%' }}
     />
   </div>
 </div>
);

export const Sidebar = ({ isPro }: SidebarProps) => {
 const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
 const proModal = useProModal();
 const router = useRouter();
 const pathname = usePathname();
 const [isOpen, setIsOpen] = useState(false);

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
       body: JSON.stringify({ job_id })
     });

     const data = await response.json();

     if (!response.ok) {
       throw new Error(data.error || 'Failed to delete trip');
     }

     setSavedTrips(current => current.filter(trip => trip.job_id !== job_id));
     toast.success('Trip deleted successfully');

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
   fetchSavedTrips();

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
  <>
    {/* Toggle Button */}
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="fixed top-4 left-4 z-50 p-2 rounded-md hover:bg-gray-100"
    >
      <Menu className="h-6 w-6" />
    </button>

    {/* Sidebar */}
    <div 
      className={`fixed top-0 left-0 h-screen bg-white border-r transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } w-64 shadow-lg z-40`}
    >
      <div className="overflow-y-auto h-full px-4 py-3">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Start New Chat</h2>
            <button onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          {/* Your existing routes section */}
          <div className="space-y-2">
            {routes.map((route) => (
              <div
                onClick={() => {
                  onNavigate(route.href, route.pro);
                  setIsOpen(false);
                }}
                key={route.href}
                className={cn(
                  "flex items-center p-2 hover:bg-gray-50 rounded-lg transition-all duration-300",
                  pathname === route.href && "bg-gray-100"
                )}
              >
                <route.icon className="h-5 w-5 text-gray-700 mr-3" />
                <span className="text-sm font-medium text-gray-600">{route.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Your existing saved trips section */}
        <div className="border-t border-gray-100 pt-4">
          <h2 className="px-4 py-2 text-sm font-semibold text-gray-800 tracking-wide">
            SAVED TRIPS
          </h2>
          {savedTrips.length > 0 ? (
            savedTrips.map((trip) => {
              const urlParams = new URLSearchParams(window.location.search);
              const isActive = urlParams.get('job_id') === trip.job_id;
              return (
                <div
                  key={trip._id}
                  className={`
                    px-4 py-3 
                    hover:bg-blue-50/50 rounded-lg 
                    cursor-pointer group transition-all
                    ${isActive ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-white shadow-sm'}
                  `}
                  onClick={() => {
                    navigateToTrip(trip);
                    setIsOpen(false);
                  }}
                >
                  {/* Location and Delete Button */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-800 truncate">
                      {trip.location}
                    </span>
                    <Button
                      onClick={(e) => handleDeleteTrip(e, trip.job_id)}
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash className="h-4 w-4 text-gray-400 hover:text-red-500" />
                    </Button>
                  </div>

                  {/* Date Range and City */}
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="truncate">{trip.dateRange}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="truncate">{trip.cities[0]}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all"
                      style={{ width: isActive ? '100%' : '75%' }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="px-4 text-sm text-gray-500">No saved trips</p>
          )}
        </div>
      </div>
    </div>
  </>
);
}