"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePlanTrip } from "@/hooks/usePlanTrip";
import { Toaster, toast } from "react-hot-toast"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ReactMarkdown from "react-markdown";
import { useRouter, useSearchParams } from "next/navigation";
import UserInfo from "@/components/UserInfo";
import { useAuth } from "@clerk/nextjs";
import DebugButton from "@/components/DebugButton";
import ReactConfetti from "react-confetti";
import { useWindowSize } from "react-use";
import ProfessionalTripView from "@/components/ProfessionalTripView";
import TripMap from "@/components/TripMap";
import { Sidebar } from "@/components/sidebar";
import EnhancedLoadingUI from "@/components/EnhancedLoadingUI";

// Create a LinkText component to handle clickable links
const LinkText = ({ text }: { text: string }) => {
  // First process markdown links
  const processMarkdownLinks = (content: string) => {
    const parts = content.split(/(\[.*?\]\(.*?\))/g);
    return parts.map((part, i) => {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        const [_, text, url] = match;
        return (
          <a 
            key={i} 
            href={url} 
            className="text-cyan-500 hover:underline" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            {text}
          </a>
        );
      }
      return part;
    });
  };

  // Then process plain URLs in the remaining text
  const processUrls = (content: React.ReactNode[]) => {
    return content.map((part) => {
      if (typeof part !== 'string') return part;
      
      const urlRegex = /https?:\/\/[^\s)]+/g;
      const parts = part.split(urlRegex);
      const matches = part.match(urlRegex) || [];
      
      return parts.map((text, i) => {
        return (
          <React.Fragment key={i}>
            {text}
            {matches[i] && (
              <a 
                href={matches[i]} 
                className="text-cyan-500 hover:underline" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                {matches[i]}
              </a>
            )}
          </React.Fragment>
        );
      });
    });
  };

  const markdownProcessed = processMarkdownLinks(text);
  const urlProcessed = processUrls(markdownProcessed);
  
  return <>{urlProcessed}</>;
};

// Updated TripData type
export type TripData = {
  location: string;
  cities: string;
  date_range: string;
  interests: string;
  job_id?: string;
  userId?: string;
};

// Add a new interface for saved itineraries
interface SavedItinerary {
  id: string;
  displayId: string;
  job_id: string;
  url: string;
  title: string;
  location: string;
  dateRange: string;
  interests: string[];
  cities: string[];
  content: any;
  formattedContent: {
    intro: string;
    days: string[];
  };
  createdAt: Date;
}

export default function TripPlanner() {
  // Core States
  const [location, setLocation] = useState<string>("");
  const [addedCities, setAddedCities] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [currentInterest, setCurrentInterest] = useState<string>("");
  const [addedDateRange, setAddedDateRange] = useState<string>("");
  const [tripResult, setTripResult] = useState<TripData | null>(null);
  const [citiesList, setCitiesList] = useState<string[]>([]);
  const [interestsList, setInterestsList] = useState<string[]>([]);
  const [addedLocation, setAddedLocation] = useState<string>("");
  const [jobId, setJobId] = useState<string>("");
  const [showCelebration, setShowCelebration] = useState(false);
  const { width, height } = useWindowSize();
  const [loadedTrip, setLoadedTrip] = useState<any>(null);
  const [isAutoSaved, setIsAutoSaved] = useState(false);

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const { planTrip, isLoading: isPlanningTrip, error: planningError, itinerary } = usePlanTrip();
  const { userId } = useAuth();

  const searchParams = useSearchParams();
  const currentJobId = searchParams.get("job_id");

  // Add this right after your state declarations
  const useLoadingControl = () => {
    const loadingRef = useRef<boolean>(false);
    const lastLoadedId = useRef<string | null>(null);

    const startLoading = () => {
      loadingRef.current = true;
      setIsLoading(true);
      return true;
    };

    const stopLoading = () => {
      loadingRef.current = false;
      setIsLoading(false);
    };

    const setLastLoadedId = (id: string) => {
      lastLoadedId.current = id;
    };

    const shouldLoadTrip = (newId: string) => {
      return lastLoadedId.current !== newId;
    };

    return {
      startLoading,
      stopLoading,
      setLastLoadedId,
      shouldLoadTrip,
      isLoading: loadingRef.current,
      lastLoadedId: lastLoadedId.current,
    };
  };

  // Then in your component:
  const loadingControl = useLoadingControl();

  // Add this after your loading control
  const clearTripStates = async () => {
    console.log("=== CLEARING STATES ===");

    await Promise.all([
      setTripResult(null),
      setAddedLocation(""),
      setCitiesList([]),
      setAddedDateRange(""),
      setInterestsList([]),
      setJobId(""),
      setIsViewMode(false),
    ]);

    sessionStorage.removeItem("currentTripState");
    console.log("All states cleared");
  };

  // Add state restoration function
  const restoreTripStates = async (trip: any) => {
    console.log("=== RESTORING STATES ===");

    await Promise.all([
      setJobId(trip.jobId),
      setAddedLocation(trip.location || ""),
      setCitiesList(Array.isArray(trip.cities) ? trip.cities : [trip.cities]),
      setAddedDateRange(trip.dateRange || trip.date_range || ""),
      setInterestsList(Array.isArray(trip.interests) ? trip.interests : [trip.interests]),
      setTripResult(trip.trip_result || trip.tripResult || trip.result || trip.content),
      setIsViewMode(true),
    ]);

    console.log("All states restored");
  };

  const loadFromSessionStorage = async () => {
    const storedTrip = sessionStorage.getItem("preloadedTrip");
    if (storedTrip) {
      await restoreTripStates(JSON.parse(storedTrip));
      sessionStorage.removeItem("preloadedTrip");
      return true;
    }
    return false;
  };

  // Replace your existing trip loading useEffect with this
  useEffect(() => {
    setIsLoading(true);

    const loadTripFromUrl = async () => {
      if (!currentJobId || !userId) {
        setIsLoading(false);
        console.log("No job_id in URL or no userId available");
        return;
      }

      console.log("Loading trip with job_id:", currentJobId);
      
      try {
        const response = await fetch(`/api/trips?userId=${userId}`);
        const data = await response.json();
        
        console.log("API response:", data);

        if (data.success && data.trips) {
          const trip = data.trips.find((t: any) => t.job_id === currentJobId);
          
          if (trip) {
            console.log("Found trip:", trip);
            
            setLoadedTrip(trip);
            setTripResult(trip.trip_result || trip.tripResult || trip.result || trip.content);
            setAddedLocation(trip.location || "");
            setCitiesList(Array.isArray(trip.cities) ? trip.cities : trip.cities ? [trip.cities] : []);
            setAddedDateRange(trip.dateRange || trip.date_range || "");
            setInterestsList(Array.isArray(trip.interests) ? trip.interests : trip.interests ? [trip.interests] : []);
            setJobId(currentJobId);
            setIsViewMode(true);
            
            console.log("Trip data loaded successfully");
          } else {
            console.error("Trip not found with job_id:", currentJobId);
            toast.error("Trip not found");
          }
        } else {
          console.error("Failed to fetch trips:", data);
          toast.error("Failed to load trip");
        }
      } catch (error) {
        console.error("Loading error:", error);
        toast.error("Error loading trip");
      } finally {
        setIsLoading(false);
      }
    };

    loadTripFromUrl();
  }, [currentJobId, userId]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isViewMode && tripResult) {
        const stateToSave = {
          location: addedLocation,
          dateRange: addedDateRange,
          interests: interestsList,
          cities: citiesList,
          tripResult,
          jobId,
        };
        console.log("Saving state before unload:", stateToSave);
        sessionStorage.setItem("currentTripState", JSON.stringify(stateToSave));
      }
    };

    const loadInitialState = () => {
      if (!window.location.search.includes("job_id")) {
        const savedState = sessionStorage.getItem("currentTripState");
        if (savedState) {
          try {
            console.log("Loading saved state");
            const parsedState = JSON.parse(savedState);
            restoreTripStates(parsedState);
          } catch (error) {
            console.error("Error loading saved state:", error);
          }
        }
      }
    };

    loadInitialState();

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [
    isViewMode,
    tripResult,
    addedLocation,
    addedDateRange,
    interestsList,
    citiesList,
    jobId,
    setAddedLocation,
    setAddedDateRange,
    setInterestsList,
    setCitiesList,
    setTripResult,
    setJobId,
  ]);

    // ADD THIS DEBUG useEffect RIGHT HERE
    useEffect(() => {
      if (loadedTrip) {
        console.log("=== LOADED TRIP FULL OBJECT ===");
        console.log("loadedTrip full object:", loadedTrip);
        console.log("loadedTrip keys:", Object.keys(loadedTrip || {}));
        console.log("loadedTrip.trip_result:", loadedTrip?.trip_result);
        console.log("loadedTrip.content:", loadedTrip?.content);
        console.log("loadedTrip.result:", loadedTrip?.result);
        console.log("loadedTrip.tripResult:", loadedTrip?.tripResult);
        console.log("loadedTrip.itinerary:", loadedTrip?.itinerary);
        console.log("===============================");
      }
    }, [loadedTrip]);

  useEffect(() => {
    async function checkTripLimitOnLoad() {
      if (!userId) return;
      try {
        const res = await fetch(`/api/subscription/check?userId=${userId}`);
        const data = await res.json();
        if (!data.canCreate) {
          console.log("Dispatching showLockScreen event on load");
          window.dispatchEvent(new CustomEvent('showLockScreen', {
            detail: {
              type: 'trip',
              currentTrips: data.currentTrips || 1,
              currentImages: data.currentImages || 0
            }
          }));
        }
      } catch (err) {
        console.error("Failed to check trip limit on load", err);
      }
    }
    checkTripLimitOnLoad();
  }, [userId]);

  const loadSavedItineraries = () => {
    try {
      const stored = localStorage.getItem("itineraries") || sessionStorage.getItem("itineraries_backup");
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      console.error("Error loading itineraries:", error);
    }
    return [];
  };

  const verifySavedItinerary = (newItinerary: SavedItinerary) => {
    try {
      const stored = localStorage.getItem("itineraries");
      if (!stored) return false;

      const itineraries = JSON.parse(stored);
      return itineraries.some((i: SavedItinerary) => i.id === newItinerary.id);
    } catch {
      return false;
    }
  };

  const handleAddLocation = () => {
    if (isViewMode) {
      toast("This is a saved trip - create a new trip to make changes");
      return;
    }
    setAddedLocation(location);
    setLocation("");
    toast.success("Location added");
  };

  const handleAddCity = () => {
    if (isViewMode) {
      toast("This is a saved trip - create a new trip to make changes");
      return;
    }

    if (!addedCities) {
      toast.error("City is required");
      return;
    }
    setCitiesList((prev) => [...prev, addedCities]);
    setAddedCities("");
    toast.success("City added");
  };

  const handleAddDateRange = () => {
    if (isViewMode) {
      toast("This is a saved trip - create a new trip to make changes");
      return;
    }

    if (startDate && endDate) {
      const formatDate = (date: Date) => {
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      };

      const dateRange = `${formatDate(startDate)} to ${formatDate(endDate)}`;
      setAddedDateRange(dateRange);
      toast.success(`Date Range added: ${dateRange}`);
    } else {
      toast.error("Please select both start and end dates");
    }
  };

  const handleAddInterest = () => {
    if (isViewMode) {
      toast("This is a saved trip - create a new trip to make changes");
      return;
    }

    if (currentInterest) {
      setInterestsList((prev) => [...prev, currentInterest]);
      setCurrentInterest("");
      toast.success("Interest added");
    }
  };

  const handlePlanTrip = async () => {
    if (!userId) {
      toast.error("Please login to plan trips");
      return;
    }

    if (isViewMode) {
      toast("This is a saved trip - create a new trip to plan changes");
      return;
    }

    if (!loadingControl.startLoading()) {
      console.log("Planning already in progress");
      return;
    }

    try {
      const checkResponse = await fetch(`/api/subscription/check?userId=${userId}`);
      const checkData = await checkResponse.json();

      if (!checkData.canCreate) {
        toast.error("You've reached your free trip limit");
        loadingControl.stopLoading();
        window.dispatchEvent(new CustomEvent('showLockScreen', {
          detail: {
            type: 'trip',
            currentTrips: checkData.currentTrips || 1,
            currentImages: checkData.currentImages || 0
          }
        }));
        return;
      }

      const tripData: TripData = {
        location: addedLocation,
        cities: citiesList.join(", "),
        date_range: addedDateRange,
        interests: interestsList.join(", "),
        userId: userId,
      };

      console.log("Planning trip with data:", tripData);
      const result = await planTrip(tripData);

      if (result) {
        setTripResult(result.result);
        setJobId(result.job_id);
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
        console.log("Exact TripResult:", result.result);
        console.log("Trip planned successfully");

        await handleSaveItinerary(true, result.job_id, result.result);
        setIsAutoSaved(true);
        toast.success("Trip autosaved!");
        window.dispatchEvent(new Event('tripSaved'));
      } else {
        toast.error("Failed to plan trip.");
      }
    } catch (error) {
      console.error("Plan error:", error);
      toast.error("Failed to plan trip.");
    } finally {
      loadingControl.stopLoading();
    }
  };

  const handleSaveItinerary = async (isAutoSave = false, jobIdParam?: string | null, tripResultParam?: any) => {
    const jobIdToUse = jobIdParam || jobId;
    const tripResultToUse = tripResultParam !== undefined ? tripResultParam : tripResult;

    // ADD THESE DEBUG LOGS
    console.log("DEBUG: tripResultToUse:", tripResultToUse);
    
    const tripData = {
      location: addedLocation,
      cities: citiesList,
      dateRange: addedDateRange,
      interests: interestsList,
      jobId: jobIdToUse,
      trip_result: tripResultToUse || "No itinerary generated",
      userId: userId,
    };

    // ADD THIS DEBUG LOG
    console.log("DEBUG: tripData.trip_result:", tripData.trip_result);
    console.log("DEBUG: Full tripData object:", tripData);

    if (!jobIdToUse) {
      if (!isAutoSave) toast.error("No job ID available");
      return;
    }

    if (!userId) {
      if (!isAutoSave) toast.error("Please login to save trips");
      return;
    }

    if (!isAutoSave) {
      setIsSaving(true);
    }

    const loadingToast = !isAutoSave ? toast.loading("Saving your trip...") : null;

    try {
      console.log("Frontend jobId being sent:", jobIdToUse);

      const subscriptionCheck = await fetch(`/api/subscription/check?userId=${userId}`);
      const subscriptionData = await subscriptionCheck.json();

      if (!subscriptionData.canCreate) {
        if (!isAutoSave) {
          toast.dismiss(loadingToast ?? undefined);
          toast.error("Please subscribe to create more trips");
          router.push("/settings");
        }
        return;
      }

      console.log("tripResult value and type:", tripResultToUse, typeof tripResultToUse);

      const response = await fetch("/api/trips/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tripData),
      });

      const data = await response.json();
      console.log("Save response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to save trip");
      }

      // Notify sidebar to refresh
      window.dispatchEvent(new Event('tripSaved'));

      if (!isAutoSave) {
        toast.dismiss(loadingToast ?? undefined);
        toast.success("Trip saved successfully!");
        loadingControl.setLastLoadedId(jobIdToUse);
        await new Promise(resolve => setTimeout(resolve, 2000));
        if (data.success) {
          setJobId('');
          setTripResult(null);
          router.push(`/agents1?job_id=${jobIdToUse}`);
        }
      }
    } catch (error) {
      if (!isAutoSave) {
        console.error("Save error:", error);
        toast.dismiss(loadingToast ?? undefined);
        toast.error(error instanceof Error ? error.message : "Failed to save trip");
      }
    } finally {
      if (!isAutoSave) {
        setIsSaving(false);
      }
    }
  };

  return (
    <>
      <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
        {/* Sidebar for saved trips */}
        <div className="hidden md:flex w-64 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <Sidebar isPro={true} />
        </div>
        {/* Main trip planner content */}
        <div className="flex-1 p-4">
          {isViewMode || window.location.search.includes("job_id") ? (
  <div>    
    {isLoading ? (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        <span className="ml-4">Loading your trip...</span>
      </div>
    ) : loadedTrip ? (
      <ProfessionalTripView
        tripData={{
          location: loadedTrip.location || "",
          cities: Array.isArray(loadedTrip.cities) ? loadedTrip.cities : (loadedTrip.cities ? [loadedTrip.cities] : []),
          dateRange: loadedTrip.dateRange || loadedTrip.date_range || "",
          interests: Array.isArray(loadedTrip.interests) ? loadedTrip.interests : (loadedTrip.interests ? [loadedTrip.interests] : []),
          jobId: loadedTrip.job_id || "",
          tripResult: loadedTrip.trip_result || loadedTrip.content || loadedTrip.result || "",
        }}
      />
    ) : (
      <div className="text-center p-8">Trip not found</div>
    )}
  </div>
        ) : (
          <>
            {showCelebration && (
              <>
                <div className="fixed inset-0 z-50 pointer-events-none">
                  <ReactConfetti width={width} height={height} recycle={false} numberOfPieces={500} />
                </div>
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div className="bg-white p-8 rounded-2xl shadow-2xl transform scale-100 animate-bounce">
                    <h2 className="text-4xl font-bold text-center text-cyan-600 mb-4">
                      🎉 Your Trip is Ready! 🎉
                    </h2>
                    <p className="text-xl text-gray-700 text-center">Get ready for an amazing adventure!</p>
                  </div>
                </div>
              </>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-0 dark:text-white">Trip Planner</h1>
              <div className="flex gap-2">
                <DebugButton />
              </div>
            </div>

            <UserInfo />

            <Card className="w-full dark:bg-gray-800">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-xl sm:text-2xl dark:text-white">Trip Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-6">
                  {/* Location */}
                  <div className="flex flex-col space-y-3">
                    <Label htmlFor="location" className="text-base sm:text-lg font-semibold dark:text-white">
                      Location
                    </Label>
                    <div className="flex flex-col space-y-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          id="location"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="Enter main location"
                          className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        />
                        <Button onClick={handleAddLocation} className="w-full sm:w-auto">
                          Add Location
                        </Button>
                      </div>
                      <div className="mt-2">
                        <h3 className="font-semibold text-sm dark:text-white">Added Location:</h3>
                        <p className="text-gray-700 dark:text-gray-300 break-words mt-1">
                          {addedLocation || "No location added yet."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Cities */}
                  <div className="flex flex-col space-y-3">
                    <Label htmlFor="cities" className="text-base sm:text-lg font-semibold">
                      Cities
                    </Label>
                    <div className="flex flex-col space-y-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          id="cities"
                          value={addedCities}
                          onChange={(e) => setAddedCities(e.target.value)}
                          placeholder="Enter cities"
                          className="w-full"
                        />
                        <Button onClick={handleAddCity} className="w-full sm:w-auto">
                          Add
                        </Button>
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">Added Cities:</h3>
                        <p className="text-gray-700 break-words mt-1">
                          {citiesList.join(", ") || "No cities added yet."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="flex flex-col space-y-3">
                    <Label className="text-base sm:text-lg font-semibold">Trip Dates</Label>
                    <div className="flex flex-col space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Start Date</Label>
                          <DatePicker
                            selected={startDate}
                            onChange={(date: Date | null) => setStartDate(date)}
                            dateFormat="MM/dd/yyyy"
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="select"
                            monthsShown={2}
                            className="w-full border p-2 rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">End Date</Label>
                          <DatePicker
                            selected={endDate}
                            onChange={(date: Date | null) => setEndDate(date)}
                            dateFormat="MM/dd/yyyy"
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="select"
                            monthsShown={2}
                            className="w-full border p-2 rounded bg-white"
                          />
                        </div>
                      </div>
                      <Button onClick={handleAddDateRange} className="w-full sm:w-auto mt-2">
                        Add Date Range
                      </Button>
                      <div>
                        <h3 className="font-semibold text-sm">Added Date Range:</h3>
                        <p className="text-gray-700 break-words mt-1">{addedDateRange || "No date range added yet."}</p>
                      </div>
                    </div>
                  </div>

                  {/* Interests */}
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Label htmlFor="interests">Interests</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="interests"
                        value={currentInterest}
                        onChange={(e) => setCurrentInterest(e.target.value)}
                        placeholder="Enter an interest"
                      />
                      <Button onClick={handleAddInterest}>Add</Button>
                    </div>
                    <div className="mt-2">
                      <h3 className="font-semibold">Added Interests:</h3>
                      <p>{interestsList.join(", ") || "No interests added yet."}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <Button onClick={handlePlanTrip} disabled={isPlanningTrip}>
                    {isPlanningTrip ? "Planning Trip..." : "Plan Trip"}
                  </Button>
                </div>

                <div className="mt-4 border dark:border-gray-700 p-4 rounded dark:bg-gray-800">
                  {isLoading || isPlanningTrip ? (
                    <EnhancedLoadingUI 
                      isLoading={isLoading || isPlanningTrip}
                      error={planningError}
                      onRetry={() => {
                        if (addedLocation && addedDateRange) {
                          handlePlanTrip();
                        }
                      }}
                    />
                  ) : tripResult ? (
                    <div>
                      {jobId && !loadingControl.isLoading && (
                        <div className="flex items-center justify-center p-4">
                          <p className="text-gray-600">Your itinerary is ready below</p>
                        </div>
                      )}
                      {loadingControl.isLoading && (
                        <div className="flex items-center justify-center p-4">
                          <div
                            className="loader"
                            style={{
                              display: "inline-block",
                              width: "24px",
                              height: "24px",
                              border: "3px solid #3498db",
                              borderRadius: "50%",
                              borderTop: "3px solid transparent",
                              animation: "spin 1s linear infinite",
                            }}
                          />
                          <span className="ml-2">Updating...</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-gray-600">Your itinerary will be displayed below once generated.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Toaster />

            <style jsx>{`
              @keyframes spin {
                0% {
                  transform: rotate(0deg);
                }
                100% {
                  transform: rotate(360deg);
                }
              }
            `}</style>

            {addedDateRange && (
              <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                {/* Header with Logo */}
                <div className="text-center mb-8">
                  <div className="mb-4">
                    <div className="w-16 h-16 mx-auto bg-cyan-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <h2 className="mt-4 text-gray-600 dark:text-gray-300">
                    <span className="text-black dark:text-white">TRAVELOGUE</span>
                    <span className="text-cyan-500"> ITINERARY</span>
                  </h2>
                  <div className="mt-4 text-gray-600 dark:text-gray-300">
                    <p>{addedDateRange || "Select travel dates"}</p>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">
                      {addedLocation} {citiesList.length > 0 && `→ ${citiesList.join(" → ")}`}
                    </p>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">
                      {interestsList.length > 0 ? `Interests: ${interestsList.join(" → ")}` : ""}
                    </p>
                    <p className="mt-2 text-cyan-500">Job ID: {jobId}</p>
                  </div>
                </div>

                {/* Trip Map Visualization */}
                {tripResult && (
                  <div className="mt-8">
                    <TripMap
                      location={addedLocation}
                      cities={citiesList}
                      dateRange={addedDateRange}
                      tripResult={typeof tripResult === "string" ? tripResult : JSON.stringify(tripResult)}
                    />
                  </div>
                )}

                {/* Intro Box */}
                {(() => {
                  const introText = tripResult && (tripResult as unknown as string);
                  let intro = "";

                  if (typeof introText === "string" && introText) {
                    const parts = introText.split(/Day \d+:/);
                    intro = parts[0]?.trim() || "";
                  }

                  const createBullets = (text: string) => {
                    if (!text && isLoading) return <p className="text-gray-500 italic">Loading overview...</p>;
                    if (!text) return null;

                    const points = text
                      .split(".")
                      .map((point) => point?.trim())
                      .filter((point) => point && point.length > 0);

                    return points.length > 0 ? (
                      <ul className="list-disc pl-6 space-y-2">
                        {points.map((point, i) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    ) : null;
                  };

                  return intro || isLoading ? (
                    <div className="mb-8 bg-cyan-50 dark:bg-gray-800/50 p-6 rounded-lg">
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Trip Overview</h3>
                      <div className="space-y-2 text-gray-700 dark:text-gray-300">{createBullets(intro)}</div>
                    </div>
                  ) : null;
                })()}

                {/* Day Boxes */}
                <div className="space-y-6 mt-8">
                  {(() => {
                    try {
                      const [startStr, endStr] = addedDateRange.split(" to ");

                      const parseDate = (dateStr: string) => {
                        const [month, day, year] = dateStr.split("/").map((num) => parseInt(num, 10));
                        return new Date(year, month - 1, day);
                      };

                      const startDate = parseDate(startStr);
                      const endDate = parseDate(endStr);

                      const diffTime = endDate.getTime() - startDate.getTime();
                      const numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                      const getDayDate = (dayIndex: number) => {
                        const date = new Date(startDate);
                        date.setDate(date.getDate() + dayIndex);
                        return date.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        });
                      };

                      let days: string[] = [];
                      if (tripResult && typeof (tripResult as unknown as string) === "string") {
                        const itineraryText = tripResult as unknown as string;
                        const mainContent = itineraryText.split(/Day 1:/)[1];
                        if (mainContent) {
                          days = ("Day 1:" + mainContent).split(/Day \d+:/);
                          days.shift();
                        }
                      }

                      return Array.from({ length: numberOfDays }).map((_, index) => {
                        const createBullets = (text: string) => {
                          if (!text && isLoading)
                            return <p className="text-gray-500 italic">Loading activities...</p>;
                          if (!text) return <p className="text-gray-500 italic">No activities planned for this day yet</p>;

                          const points = text
                            .split(".")
                            .map((point) => point.trim())
                            .filter((point) => point.length > 0);

                          return (
                            <ul className="list-disc pl-6 space-y-2">
                              {points.map((point, i) => (
                                <li key={i} className="break-words">
                                  {point}
                                </li>
                              ))}
                            </ul>
                          );
                        };

                        return (
                          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-cyan-50 p-6 rounded-lg flex flex-col items-center justify-center">
                              <h3 className="text-2xl font-bold text-gray-800">DAY {index + 1}</h3>
                              <p className="text-sm text-gray-600 mt-2">{getDayDate(index)}</p>
                            </div>
                            <div className="bg-cyan-50 p-6 rounded-lg col-span-2">
                              <h4 className="font-bold mb-4">Activities:</h4>
                              <div className="space-y-2">{createBullets(days[index])}</div>
                            </div>
                          </div>
                        );
                      });
                    } catch (error) {
                      console.error("Error details:", error);
                      return <div>Error generating itinerary boxes: {String(error)}</div>;
                    }
                  })()}
                </div>

                {/* Additional Sections */}
                {tripResult && (
                  <div className="space-y-8 mt-12">
                    {/* Define the sections we want to display */}
                    {[
                      { title: "Accommodation Options", keywords: ["Accommodation Options", "hotel", "Pearl Continental", "Avari"] },
                      { title: "Logistics Options", keywords: ["Logistics Options", "Flight:", "Local Transport:", "Careem"] },
                      { title: "Detailed Budget Breakdown", keywords: ["Budget Breakdown", "Accommodation Costs", "Meal Costs", "Overall Budget"] },
                      { title: "Real-Time Flight Pricing", keywords: ["Real-Time Flight", "IndiGo", "Emirates", "Flight:"] },
                      { title: "Weather Forecast and Packing Suggestions", keywords: ["Weather Forecast", "Packing", "Temperature:", "Conditions:", "Packing List"] },
                      { title: "Restaurant Reservations", keywords: ["Restaurant Reservations", "Lunch:", "Dinner:", "Café Zouk", "Food Street"] }
                    ].map((section: {title: string, keywords: string[]}, index: number) => {
                      // Get the full text content
                      const itineraryText = typeof tripResult === "string" ? tripResult : JSON.stringify(tripResult);
                      
                      // Create extraction patterns based on the section title and keywords
                      let sectionContent = "";
                      
                      // 1. Try to find section with title exactly as is
                      const titlePattern = new RegExp(`${section.title}[^]*?(?=(?:${[
                        "Accommodation Options",
                        "Logistics Options", 
                        "Detailed Budget Breakdown",
                        "Real-Time Flight Pricing",
                        "Restaurant Reservations",
                        "Weather Forecast and Packing Suggestions"
                      ].filter(t => t !== section.title).join("|")})|$)`, "i");
                      
                      const titleMatch = itineraryText.match(titlePattern);
                      if (titleMatch && titleMatch[0].length > section.title.length + 10) {
                        sectionContent = titleMatch[0].substring(section.title.length).trim();
                      }
                      
                      // 2. If that fails, try to extract using keywords
                      if (!sectionContent) {
                        for (const keyword of section.keywords) {
                          if (itineraryText.includes(keyword)) {
                            const keywordPattern = new RegExp(`${keyword}[^]*?(?=(?:${[
                              "Accommodation Options",
                              "Logistics Options", 
                              "Detailed Budget Breakdown",
                              "Real-Time Flight Pricing",
                              "Restaurant Reservations",
                              "Weather Forecast and Packing Suggestions",
                              "Day \\d+"
                            ].filter(t => !t.includes(keyword)).join("|")})|$)`, "i");
                            
                            const keywordMatch = itineraryText.match(keywordPattern);
                            if (keywordMatch && keywordMatch[0].length > keyword.length + 5) {
                              sectionContent = keywordMatch[0].trim();
                              break;
                            }
                          }
                        }
                      }
                      
                      // 3. For specific sections, try pattern matching based on your data structure
                      if (!sectionContent) {
                        if (section.title === "Accommodation Options") {
                          const accomPattern = /Day\s+\d+\s*(?:[^]*?)((?:Pearl\s+Continental|Avari|hotel|Hotel)[^]*?)(?=Day|Logistics|$)/i;
                          const accomMatch = itineraryText.match(accomPattern);
                          if (accomMatch && accomMatch[1]) {
                            sectionContent = "Accommodation Options " + accomMatch[1].trim();
                          }
                        } 
                        else if (section.title === "Logistics Options") {
                          const logisticsPattern = /(?:Flight:)[^]*?(?=Detailed Budget|Restaurant|Weather|$)/i;
                          const logisticsMatch = itineraryText.match(logisticsPattern);
                          if (logisticsMatch) {
                            sectionContent = "Logistics Options " + logisticsMatch[0].trim();
                          }
                        }
                        else if (section.title === "Restaurant Reservations") {
                          const restaurantPattern = /(?:Day\s+\d+\s+(?:Lunch|Dinner)|Restaurant Reservations)[^]*?(?=Weather|Enjoy your|$)/i;
                          const restaurantMatch = itineraryText.match(restaurantPattern);
                          if (restaurantMatch) {
                            sectionContent = "Restaurant Reservations " + restaurantMatch[0].trim();
                          }
                        }
                      }
                      
                      // Process the content for display
                      const renderContent = (content: string) => {
                        if (!content) return <p className="text-gray-500 italic">Details will be added soon.</p>;
                        
                        // Create bullet points based on the structure in your data
                        // The pattern in your data seems to use "•" or "-" for bullets
                        const bulletRegex = /(?:^|\n)(?:\s*[•-]\s*|\s*\d+\.\s*|\s*Day\s+\d+:?\s*)/g;
                        const hasBullets = bulletRegex.test(content);
                        
                        if (hasBullets) {
                          // Reset regex
                          bulletRegex.lastIndex = 0;
                          
                          // Split by bullet points
                          const bullets = content
                            .split(bulletRegex)
                            .map(item => item.trim())
                            .filter(item => item && item.length > 0 && !item.startsWith("Accommodation") && !item.startsWith("Logistics") && !item.startsWith("Budget") && !item.startsWith("Weather") && !item.startsWith("Restaurant"));
                          
                          return (
                            <ul className="list-disc pl-6 space-y-2">
                              {bullets.map((bullet, i) => (
                                <li key={i} className="text-gray-700 dark:text-gray-300">
                                  <LinkText text={bullet} />
                                </li>
                              ))}
                            </ul>
                          );
                        }
                        
                        // If no bullets found, split by lines
                        const lines = content
                          .split(/\n/)
                          .map(line => line.trim())
                          .filter(line => line.length > 0 && !line.startsWith("Accommodation") && !line.startsWith("Logistics") && !line.startsWith("Budget") && !line.startsWith("Weather") && !line.startsWith("Restaurant"));
                        
                        if (lines.length > 0) {
                          const formatText = (text: string) => {
                            // Handle markdown links
                            const markdownFormatted = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
                              (_, linkText, url) => `<a href="${url}" class="text-cyan-500 hover:underline" target="_blank">${linkText}</a>`
                            );
                            
                            // Handle plain URLs
                            return markdownFormatted.replace(
                              /(?<![[\("'])(https?:\/\/[^\s)]+)(?![)\]"'])/g, 
                              (url) => `<a href="${url}" class="text-cyan-500 hover:underline" target="_blank">${url}</a>`
                            );
                          };
                          
                          return (
                            <ul className="list-disc pl-6 space-y-2">
                              {lines.map((line, i) => (
                                <li key={i} className="text-gray-700 dark:text-gray-300">
                                  <LinkText text={line} />
                                </li>
                              ))}
                            </ul>
                          );
                        }
                        
                        return <p className="text-gray-500 italic">Details will be added soon.</p>;
                      };

                      return (
                        <div key={index} className="bg-cyan-50 dark:bg-gray-800/50 p-6 rounded-lg">
                          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                            {section.title}
                          </h3>
                          <div className="space-y-2">
                            {renderContent(sectionContent)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Trip Result Display */}
                {loadedTrip ? (
                  <div className="mt-8">
                    <ProfessionalTripView tripData={loadedTrip} />
                  </div>
                ) : (
                  <div>Loading trip...</div>
                )}

                {/* Save Button */}
                {tripResult && (
                  <div className="flex justify-end mt-6 mb-4">
                    <Button 
                      onClick={() => handleSaveItinerary(false)}
                      disabled={isSaving}
                      className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-md flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg 
                            className="w-5 h-5" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" 
                            />
                          </svg>
                          Save Itinerary
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    <p className="text-center sm:text-left">www.quipit.com</p>
                    <p className="text-center">greenvalleymotor@gmail.com</p>
                    <p className="text-center sm:text-right">+919830016577</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  </>
);
}