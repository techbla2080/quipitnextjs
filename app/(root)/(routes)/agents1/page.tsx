"use client";

import React, { useState, useEffect,  useRef } from "react";
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
import { useRouter } from "next/navigation";
import UserInfo from "@/components/UserInfo";  // Add this import
import { useAuth } from "@clerk/nextjs";
import DebugButton from '@/components/DebugButton';

// Updated TripData type
export type TripData = {  
location: string;
cities: string;
date_range: string;
interests: string;
job_id?: string;
userId?: string;  // Add this line
};

// Add a new interface for saved itineraries
interface SavedItinerary {
id: string;
displayId: string;
job_id: string; // Add this
url: string;    // Add this
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
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const router = useRouter();

  const { planTrip, isLoading: isPlanningTrip, error: planningError, itinerary } = usePlanTrip();
  const { userId } = useAuth();  // Add this right after your state declarations

  // Add this right after your state declarations
  const useLoadingControl = () => {
    const loadingRef = useRef<boolean>(false);
    const lastLoadedId = useRef<string | null>(null);
  
    const startLoading = () => {
      // Remove the early return that's preventing the first load
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
      // Modify this to allow first load
      return lastLoadedId.current !== newId; // Remove the loadingRef.current check
    };
  
    return {
      startLoading,
      stopLoading,
      setLastLoadedId,
      shouldLoadTrip,
      isLoading: loadingRef.current,
      lastLoadedId: lastLoadedId.current
    };
  };

// Then in your component:
const loadingControl = useLoadingControl();

// Add this after your loading control
const clearTripStates = async () => {
  console.log('=== CLEARING STATES ===');
  
  // Clear all states in a batch
  await Promise.all([
    setTripResult(null),
    setAddedLocation(''),
    setCitiesList([]),
    setAddedDateRange(''),
    setInterestsList([]),
    setJobId(''),
    setIsViewMode(false)
  ]);

  // Clear session storage
  sessionStorage.removeItem('currentTripState');
  console.log('All states cleared');
};

// Add state restoration function
const restoreTripStates = async (trip: any) => {
  console.log('=== RESTORING STATES ===');
  
  await Promise.all([
    setJobId(trip.jobId),
    setAddedLocation(trip.location || ''),
    setCitiesList(Array.isArray(trip.cities) ? trip.cities : [trip.cities]),
    setAddedDateRange(trip.dateRange || ''),
    setInterestsList(Array.isArray(trip.interests) ? trip.interests : [trip.interests]),
    setTripResult(trip.content || trip.tripResult),
    setIsViewMode(true)
  ]);
  
  console.log('All states restored');
};

const loadFromSessionStorage = async () => {
  const storedTrip = sessionStorage.getItem('preloadedTrip');
  if (storedTrip) {
    await restoreTripStates(JSON.parse(storedTrip));
    sessionStorage.removeItem('preloadedTrip');
    return true;
  }
  return false;
};

// Replace your existing trip loading useEffect with this
useEffect(() => {
  const loadTripFromId = async (currentJobId: string) => {
    if (!userId) {  // Add this check
      console.log('No userId available, skipping trip load');
      return;
    }

    try {
      const response = await fetch(`/api/trips?userId=${userId}`);  // Add userId to query
      const data = await response.json();
      
      if (data.success && data.trips) {
        // Only get trips belonging to this user
        const trip = data.trips.find((t: any) => 
          t.jobId === currentJobId && t.userId === userId
        );
        
        if (trip) {
          setTripResult(trip.tripResult || trip.result);
          setAddedLocation(trip.location || '');
          setCitiesList(Array.isArray(trip.cities) ? trip.cities : [trip.cities]);
          setAddedDateRange(trip.dateRange || '');
          setInterestsList(Array.isArray(trip.interests) ? trip.interests : [trip.interests]);
          setJobId(currentJobId);
          setIsViewMode(true);
        }
      }
    } catch (error) {
      console.error('Loading error:', error);
    }
  };

  const params = new URLSearchParams(window.location.search);
  const currentJobId = params.get('job_id');
  if (currentJobId && userId) loadTripFromId(currentJobId);  // Add userId check
}, [window.location.search, userId]);  // Add userId to dependencies

useEffect(() => {
  // Handle state persistence
  const handleBeforeUnload = () => {
    if (!isViewMode && tripResult) {
      const stateToSave = {
        location: addedLocation,
        dateRange: addedDateRange,
        interests: interestsList,
        cities: citiesList,
        tripResult,
        jobId
      };
      console.log('Saving state before unload:', stateToSave);
      sessionStorage.setItem('currentTripState', JSON.stringify(stateToSave));
    }
  };

  // Load saved state on mount
  const loadInitialState = () => {
    if (!window.location.search.includes('job_id')) {
      const savedState = sessionStorage.getItem('currentTripState');
      if (savedState) {
        try {
          console.log('Loading saved state');
          const parsedState = JSON.parse(savedState);
          restoreTripStates(parsedState);
        } catch (error) {
          console.error('Error loading saved state:', error);
        }
      }
    }
  };

  // Initial load
  loadInitialState();

  // Setup unload handler
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [isViewMode, tripResult, addedLocation, addedDateRange, interestsList, citiesList, jobId]); // Only run on mount

    // Add these new utility functions
const loadSavedItineraries = () => {
  try {
    const stored = localStorage.getItem('itineraries') || sessionStorage.getItem('itineraries_backup');
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (error) {
    console.error('Error loading itineraries:', error);
  }
  return [];
};

const verifySavedItinerary = (newItinerary: SavedItinerary) => {
  try {
    const stored = localStorage.getItem('itineraries');
    if (!stored) return false;
    
    const itineraries = JSON.parse(stored);
    return itineraries.some((i: SavedItinerary) => i.id === newItinerary.id);
  } catch {
    return false;
  }
};

const handleAddLocation = () => {
  if (isViewMode) {
    toast.custom("This is a saved trip - create a new trip to make changes");
    // or just use
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
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
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
    toast.error('Please login to plan trips');
    return;
  }

  if (isViewMode) {
    toast("This is a saved trip - create a new trip to plan changes");
    return;
  }

  if (!loadingControl.startLoading()) {
    console.log('Planning already in progress');
    return;
  }

  try {
    // Check trip count
    const checkResponse = await fetch(`/api/subscription/check?userId=${userId}`);
    const checkData = await checkResponse.json();

    // If user has reached limit, show toast and redirect to settings
    if (!checkData.canCreate) {
      toast.error("You've reached your free trip limit");
      loadingControl.stopLoading();
      // Add slight delay before redirect to ensure toast is visible
      setTimeout(() => {
        router.push('/settings');
      }, 1500);
      return;
    }

    const tripData: TripData = {
      location: addedLocation,
      cities: citiesList.join(", "),
      date_range: addedDateRange,
      interests: interestsList.join(", "),
      userId: userId
    };

    console.log('Planning trip with data:', tripData);
    const result = await planTrip(tripData);

    if (result) {
      setTripResult(result.result);
      setJobId(result.job_id);
      console.log('Trip planned successfully');
    } else {
      toast.error("Failed to plan trip.");
    }
  } catch (error) {
    console.error('Plan error:', error);
    toast.error("Failed to plan trip.");
  } finally {
    loadingControl.stopLoading();
  }
};

// Update handleSaveItinerary
const handleSaveItinerary = async () => {
  if (!jobId) {
    toast.error('No job ID available');
    return;
  }

  if (!userId) {  
    toast.error('Please login to save trips');
    return;
  }

  if (!loadingControl.startLoading()) {
    return;
  }

  try {
    // Add subscription check here
    const subscriptionCheck = await fetch(`/api/subscription/check?userId=${userId}`);
    const subscriptionData = await subscriptionCheck.json();
    
    if (!subscriptionData.canCreate) {
      toast.error('Please subscribe to create more trips');
      router.push('/settings');
      return;
    }

    // Your existing trip data construction
    const tripData = {
      location: addedLocation,
      cities: citiesList,
      dateRange: addedDateRange,
      interests: interestsList,
      jobId: jobId,
      tripResult: tripResult,
      userId: userId
    };

    console.log('Saving trip with userId:', userId);
    console.log('Saving trip:', tripData);
    
    const response = await fetch('/api/trips/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tripData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to save trip');
    }

    toast.success('Trip saved successfully!');
    loadingControl.setLastLoadedId(jobId);

    // Navigate after successful save
    router.push(`/agents1?job_id=${jobId}`);

  } catch (error) {
    console.error('Save error:', error);
    toast.error('Failed to save trip');
  } finally {
    loadingControl.stopLoading();
  }
}; // Make sure this closing brace matches with the opening of the function

// Second useEffect - Handles page state persistence
useEffect(() => {
// Function to save state before unload
const handleBeforeUnload = () => {
  if (tripResult && !isViewMode) {  // Only save if we're not viewing a saved trip
    sessionStorage.setItem('currentTripState', JSON.stringify({
      location: addedLocation,
      dateRange: addedDateRange,
      interests: interestsList,
      cities: citiesList,
      tripResult,
      jobId
    }));
  }
};

// Function to load saved state
const loadSavedState = () => {
  if (!isViewMode) {  // Only load if we're not viewing a saved trip
    const savedState = sessionStorage.getItem('currentTripState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        setAddedLocation(parsedState.location);
        setAddedDateRange(parsedState.dateRange);
        setInterestsList(parsedState.interests);
        setCitiesList(parsedState.cities);
        setTripResult(parsedState.tripResult);
        setJobId(parsedState.jobId);
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    }
  }
};

// Load state on mount if we're not viewing a saved trip
if (!window.location.search.includes('job_id')) {
  loadSavedState();
}

// Add unload handler
window.addEventListener('beforeunload', handleBeforeUnload);
return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [isViewMode, tripResult, addedLocation, addedDateRange, interestsList, citiesList, jobId, setAddedLocation, setAddedDateRange, setInterestsList, setCitiesList, setTripResult, setJobId]); // Only runs on mount

return (
  <div className="container mx-auto px-4 max-w-full sm:max-w-3xl overflow-x-hidden">
    <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-0">Trip Planner</h1>
      <div className="flex gap-2">
        <DebugButton />
      </div>
    </div>

    <UserInfo />  {/* Add here */}    

    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl">Trip Details</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-6">
          {/* Location */}
          <div className="flex flex-col space-y-3">
            <Label htmlFor="location" className="text-base sm:text-lg font-semibold">Location</Label>
            <div className="flex flex-col space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter main location"
                  className="w-full"
                />
                <Button onClick={handleAddLocation} className="w-full sm:w-auto">
                  Add Location
                </Button>
              </div>
              <div className="mt-2">
                <h3 className="font-semibold text-sm">Added Location:</h3>
                <p className="text-gray-700 break-words mt-1">
                  {addedLocation || "No location added yet."}
                </p>
              </div>
            </div>
          </div>

{/* Cities */}
<div className="flex flex-col space-y-3">
 <Label htmlFor="cities" className="text-base sm:text-lg font-semibold">Cities</Label>
 <div className="flex flex-col space-y-2">
   <div className="flex flex-col sm:flex-row gap-2">
     <Input
       id="cities"
       value={addedCities}
       onChange={(e) => setAddedCities(e.target.value)}
       placeholder="Enter cities"
       className="w-full"
     />
     <Button onClick={handleAddCity} className="w-full sm:w-auto">Add</Button>
   </div>
   <div>
     <h3 className="font-semibold text-sm">Added Cities:</h3>
     <p className="text-gray-700 break-words mt-1">{citiesList.join(", ") || "No cities added yet."}</p>
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
         className="w-full border p-2 rounded bg-white"
       />
     </div>
     <div className="space-y-2">
       <Label className="text-sm">End Date</Label>
       <DatePicker
         selected={endDate}
         onChange={(date: Date | null) => setEndDate(date)}
         dateFormat="MM/dd/yyyy"
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
        <Button
          onClick={handlePlanTrip}
          disabled={isPlanningTrip}
        >
          {isPlanningTrip ? "Planning Trip..." : "Plan Trip"}
        </Button>
      </div>

      <div className="mt-4 border p-4 rounded">
  {isLoading ? (
    <div className="flex items-center justify-center p-4">
      <div className="loader" style={{
        display: 'inline-block',
        width: '24px',
        height: '24px',
        border: '3px solid #3498db',
        borderRadius: '50%',
        borderTop: '3px solid transparent',
        animation: 'spin 1s linear infinite'
      }} />
      <span className="ml-2">Processing your itinerary...</span>
    </div>
  ) : tripResult ? (
    <div>
      {jobId && !loadingControl.isLoading && (
        <div className="flex items-center justify-center p-4">
          <p className="text-gray-600">Your itinerary is ready below</p>
        </div>
      )}
      {loadingControl.isLoading && (
        <div className="flex items-center justify-center p-4">
          <div className="loader" style={{
            display: 'inline-block',
            width: '24px',
            height: '24px',
            border: '3px solid #3498db',
            borderRadius: '50%',
            borderTop: '3px solid transparent',
            animation: 'spin 1s linear infinite'
          }} />
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
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `}</style>

  {/* Itinerary Display Section */}
  <div className="mt-8 p-6 bg-white rounded-lg shadow-lg">
{/* Header with Logo */}
<div className="text-center mb-8">
  <div className="mb-4">
    <div className="w-16 h-16 mx-auto bg-cyan-500 rounded-full flex items-center justify-center">
      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  </div>
  <h2 className="text-3xl font-bold">
    <span className="text-black">TRAVELOGUE</span>
    <span className="text-cyan-500"> ITINERARY</span>
  </h2>
  <div className="mt-4 text-gray-600">
    <p>{addedDateRange || "Select travel dates"}</p>
    <p className="mt-2 text-gray-600">{addedLocation} {citiesList.length > 0 && `→ ${citiesList.join(" → ")}`}</p>
    <p className="mt-2 text-gray-600">{interestsList.length > 0 ? `Interests: ${interestsList.join(" → ")}` : ''}</p>
    <p className="mt-2 text-cyan-500">Job ID: {jobId}</p>
  </div>
</div>

    {/* Intro Box */}
    {(() => {
      const introText = tripResult && (tripResult as unknown as string);
      let intro = '';
      
      if (typeof introText === 'string' && introText) {
        const parts = introText.split(/Day \d+:/);
        intro = parts[0]?.trim() || '';
      }

      const createBullets = (text: string) => {
        if (!text) return null;
        
        const points = text
          .split('.')
          .map(point => point?.trim())
          .filter(point => point && point.length > 0);

        return points.length > 0 ? (
          <ul className="list-disc pl-6 space-y-2">
            {points.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        ) : null;
      };
      
      return intro ? (
        <div className="mb-8 bg-cyan-50 p-6 rounded-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Trip Overview</h3>
          <div className="space-y-2">
            {createBullets(intro)}
          </div>
        </div>
      ) : null;
    })()}


{/* Day Boxes */}
{addedDateRange && (
  <div className="space-y-6 mt-8">
    {(() => {
      try {
        const [startStr, endStr] = addedDateRange.split(' to ');
        
        const parseDate = (dateStr: string) => {
          const [month, day, year] = dateStr.split('/').map(num => parseInt(num, 10));
          return new Date(year, month - 1, day);
        };

        const startDate = parseDate(startStr);
        const endDate = parseDate(endStr);
        
        const diffTime = endDate.getTime() - startDate.getTime();
        const numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        const getDayDate = (dayIndex: number) => {
          const date = new Date(startDate);
          date.setDate(date.getDate() + dayIndex);
          return date.toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          });
        };

        let days: string[] = [];
        const itineraryText = tripResult as unknown as string;
        
        if (typeof itineraryText === 'string') {
          const mainContent = itineraryText.split(/Day 1:/)[1];
          if (mainContent) {
            days = ('Day 1:' + mainContent).split(/Day \d+:/);
            days.shift();
          }
        }

        return Array.from({ length: numberOfDays }).map((_, index) => {
          const createBullets = (text: string) => {
            const points = text
              .split('.')
              .map(point => point.trim())
              .filter(point => point.length > 0);

            return (
              <ul className="list-disc pl-6 space-y-2">
                {points.map((point, i) => (
                  <li key={i} className="break-words">{point}</li>
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
                <div className="space-y-2">
                  {days[index] ? (
                    createBullets(days[index])
                  ) : (
                    <p className="text-gray-500 italic">No activities planned for this day yet</p>
                  )}
                </div>
              </div>
            </div>
          );
        });
      } catch (error) {
        console.error('Error details:', error);
        return <div>Error generating itinerary boxes: {String(error)}</div>;
      }
    })()}
  </div>
)}
    

    {/* Save Button */}
    {tripResult && (
      <div className="flex justify-end mt-6 mb-4">
        <Button 
          onClick={handleSaveItinerary}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-md flex items-center gap-2"
        >
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
        </Button>
      </div>
    )}

{/* Footer */}
<div className="mt-8 pt-4 border-t border-gray-200">
  <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 text-xs sm:text-sm text-gray-600">
    <p className="text-center sm:text-left">www.quipit.com</p>
    <p className="text-center">greenvalleymotor@gmail.com</p>
    <p className="text-center sm:text-right">+919830016577</p>
  </div>
</div>
</div> 
</div>
);
}