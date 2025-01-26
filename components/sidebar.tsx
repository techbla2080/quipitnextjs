"use client";

import { Home, Plus, Settings, Info, Briefcase, Trash, Calendar, MapPin } from "lucide-react";
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
      relative px-3 py-2.5 
      hover:bg-blue-50/80 rounded-lg 
      cursor-pointer group transition-all
      ${isActive ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
    `}
  >
   <div className="flex items-center justify-between mb-1.5">
     <span className="font-medium text-gray-900">{trip.location}</span>
     <Button
       onClick={(e) => onDelete(e, trip.job_id)}
       variant="ghost"
       size="icon"
       className="opacity-0 group-hover:opacity-100 transition-all"
     >
       <Trash className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
     </Button>
   </div>
   
   <div className="flex items-center space-x-3 text-[10px] text-gray-500">
     <div className="flex items-center">
       <Calendar className="h-3 w-3 mr-1" />
       {trip.dateRange}
     </div>
     <div className="flex items-center">
       <MapPin className="h-3 w-3 mr-1" />
       {trip.cities[0]}
     </div>
   </div>

   <div className="mt-2 w-full bg-gray-100 rounded-full h-1">
     <div 
       className="bg-blue-500 h-1 rounded-full transition-all"
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
  <div className="flex flex-col h-screen bg-white w-32 border-r">
    {routes.map((route) => (
      <div
        onClick={() => onNavigate(route.href, route.pro)}
        key={route.href}
        className={cn(
          "flex flex-col items-center p-4 hover:bg-gray-50 transition-all duration-300",
          pathname === route.href && "bg-gray-100"
        )}
      >
        <route.icon className="h-5 w-5 text-gray-700" />
        <span className="text-xs mt-2 font-medium text-gray-600">{route.label}</span>
      </div>
    ))}

    <div className="border-t border-gray-100 pt-3">
      <h2 className="px-3 py-2 text-xs font-semibold text-gray-800 tracking-wide">
        SAVED TRIPS
      </h2>
      {savedTrips.length > 0 ? (
        savedTrips.map((trip) => {
          const urlParams = new URLSearchParams(window.location.search);
          const isActive = urlParams.get('job_id') === trip.job_id;
          return (
            <SavedTripItem
              key={trip._id}
              trip={trip}
              isActive={isActive}
              onClick={() => navigateToTrip(trip)}
              onDelete={handleDeleteTrip}
            />
          );
        })
      ) : (
        <p className="px-3 text-xs text-gray-500">No saved trips</p>
      )}
    </div>
  </div>
);
};