"use client";

import { Home, Plus, Settings, Info, Trash, Calendar, MapPin, Menu, X, Sparkles, Plane, PenTool, TreePine } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useProModal } from "@/hooks/use-pro-modal";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion"; // For Quipit icon animation
import Link from "next/link"; // For Quipit icon link
import { useAuth } from "@clerk/nextjs";
import { supabase } from '@/lib/supabaseClient'; // Make sure this import is at the top
import ImageModal from "@/components/ImageModal";
import NextImage from "next/image";
// At the top of your file with other imports


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

interface SavedImage {
  id: string;
  image_url: string;
  category: string;
  type: string;
  created_at: string;
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
        className="transition-all shrink-0"
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
  const [isNavigating, setIsNavigating] = useState(false);
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const proModal = useProModal();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const { userId } = useAuth();
  const [selectedImage, setSelectedImage] = useState<SavedImage | null>(null);

  const onNavigate = (url: string, pro: boolean) => {
    if (pro && !isPro) {
      return proModal.onOpen();
    }
    return router.push(url);
  };

  const navigateToTrip = (trip: SavedTrip) => {
    if (!trip.job_id) {
      toast.error("This trip is missing a job ID and cannot be opened.");
      return;
    }
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
        const formattedTrips: SavedTrip[] = data.trips.map((trip: any) => ({
          _id: trip._id || trip.id,
          job_id: trip.job_id,
          location: trip.location,
          dateRange: trip.dateRange || trip.date_range,
          interests: Array.isArray(trip.interests) ? trip.interests : [],
          cities: Array.isArray(trip.cities) ? trip.cities : [],
          content: trip.trip_result || trip.content || trip.tripResult || trip.result,
          createdAt: trip.id ? new Date(trip.id) : new Date()
        }));
        
        console.log('Formatted trips:', formattedTrips);
        setSavedTrips(formattedTrips);
      }
    } catch (error) {
      console.error('Error in fetchSavedTrips:', error);
    }
  };

  const fetchSavedImages = async () => {
    const endpoints = [
      { type: 'generate-room', url: `/api/generate-room?user_id=${userId}` },
      { type: 'generate-product', url: `/api/generate-product?user_id=${userId}` },
      { type: 'generate-recipe', url: `/api/generate-recipe-image?user_id=${userId}` },
      { type: 'generate-itinerary-visuals', url: `/api/generate-itinerary-visuals?user_id=${userId}` },
    ];

    let allImages: SavedImage[] = [];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.url);
        const data = await response.json();
        if (data.success && data.result && Array.isArray(data.result.images)) {
          allImages = allImages.concat(data.result.images);
        }
      } catch (err) {
        // Optionally handle errors for each endpoint
        console.error(`Error fetching images for ${endpoint.type}:`, err);
      }
    }

    setSavedImages(allImages);
  };

  useEffect(() => {
    fetchSavedTrips();
    fetchSavedImages();

    const handleTripSaved = async () => {
      console.log('Trip saved event received in sidebar');
      await fetchSavedTrips();
    };

    const handleImageSaved = async () => {
      console.log('Image saved event received in sidebar');
      await fetchSavedImages();
    };

    window.addEventListener('tripSaved', handleTripSaved);
    window.addEventListener('imageSaved', handleImageSaved);

    return () => {
      window.removeEventListener('tripSaved', handleTripSaved);
      window.removeEventListener('imageSaved', handleImageSaved);
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

  function handleImageClick(image: SavedImage) {
    setSelectedImage(image);
  }

  const imageTypes = [
    { type: 'generate-room', label: '3D Interior Creator' },
    { type: 'generate-product', label: 'Product Designer' },
    { type: 'generate-recipe', label: 'Recipe Generator' },
    { type: 'generate-itinerary', label: 'Travel Visuals' },
  ];

  const handleDeleteImage = async (img: SavedImage) => {
    try {
      // Remove from Supabase
      const { error } = await supabase
        .from('saved_images')
        .delete()
        .eq('id', img.id);

      if (error) {
        toast.error('Failed to delete image');
        return;
      }

      // Remove from local state
      setSavedImages(current => current.filter(i => i.image_url !== img.image_url));
      toast.success('Image deleted successfully');
      // Optionally, refresh images from backend:
      window.dispatchEvent(new Event('imageSaved'));
    } catch (err) {
      toast.error('Error deleting image');
    }
  };

  return (
    <div>
      {/* Loading Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            <p className="text-lg">Loading your trip...</p>
          </div>
        </div>
      )}

      {/* Main Sidebar */}
      <div className="fixed top-0 left-0 h-screen bg-white w-64 border-r z-40 overflow-x-hidden">
        <div className="overflow-y-auto flex-1 px-4 py-3">
          {/* Quipit Icon and Title */}
          <div className="p-4 flex items-center">
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
                <h1 className="text-xl font-bold text-gray-800 ml-2">Quipit</h1>
              </div>
            </Link>
          </div>

          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Start New Chat</h2>
            <div className="space-y-2">
              {routes.map((route) => (
                <div
                  onClick={() => onNavigate(route.href, route.pro)}
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

          <div className="border-t border-gray-100 pt-4 mt-4">
            <h2 className="px-4 py-2 text-sm font-semibold text-gray-800 tracking-wide">
              SAVED TRIPS
            </h2>
            {savedTrips.length > 0 ? (
              <div className="space-y-2">
                {savedTrips.map((trip) => {
                  const urlParams = new URLSearchParams(window.location.search);
                  const isActive = urlParams.get('job_id') === trip.job_id;
                  return (
                    <div
                      key={trip._id}
                      className={`
                        px-2 py-3 w-full
                        hover:bg-blue-50/50 rounded-lg 
                        cursor-pointer transition-all
                        ${isActive ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-white shadow-sm'}
                      `}
                      onClick={() => navigateToTrip(trip)}
                    >
                      <div className="flex items-center justify-between mb-2 w-full">
                        <span className="font-semibold text-gray-800 truncate max-w-[160px]">
                          {trip.location}
                        </span>
                        <Button
                          onClick={(e) => handleDeleteTrip(e, trip.job_id)}
                          variant="ghost"
                          size="icon"
                          className="transition-all shrink-0"
                        >
                          <Trash className="h-4 w-4 text-gray-400 hover:text-red-500" />
                        </Button>
                      </div>

                      <div className="flex flex-col space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 shrink-0" />
                          <span className="truncate">{trip.dateRange}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 shrink-0" />
                          <span className="truncate">{trip.cities[0]}</span>
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
                })}
              </div>
            ) : (
              <p className="px-4 text-sm text-gray-500">No saved trips</p>
            )}
          </div>

          <div className="border-t border-gray-100 pt-4 mt-4">
            <h2 className="px-4 py-2 text-sm font-semibold text-gray-800 tracking-wide">
              SAVED IMAGES
            </h2>
            {imageTypes.map(group => {
              const groupImages = savedImages.filter(img => img.type === group.type);
              return (
                <div key={group.type}>
                  <h3 className="text-xs font-bold mt-4 mb-2">{group.label}</h3>
                  {groupImages.length > 0 ? (
                    groupImages.map(img => (
                      <div key={img.id} className="flex items-center space-x-2">
                        <NextImage
                          src={img.image_url}
                          alt={img.category}
                          width={50}
                          height={50}
                          className="rounded cursor-pointer"
                          onClick={() => handleImageClick(img)}
                          unoptimized={img.image_url.startsWith('data:')}
                        />
                        <span className="text-xs text-gray-700">{img.category}</span>
                        <Button
                          onClick={() => handleDeleteImage(img)}
                          variant="ghost"
                          size="icon"
                          className="transition-all shrink-0"
                          title="Delete image"
                        >
                          <Trash className="h-4 w-4 text-gray-400 hover:text-red-500" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="px-4 text-sm text-gray-500">No saved images</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedImage && (
        <ImageModal src={selectedImage.image_url} onClose={() => setSelectedImage(null)} />
      )}
    </div>
  );  
};