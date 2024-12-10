  "use client";

  import React, { useState, useEffect } from "react";
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

// Updated TripData type
export type TripData = {  
  location: string;
  cities: string;
  date_range: string;
  interests: string;
  job_id?: string;
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
    const [location, setLocation] = useState<string>("");
    const [addedCities, setAddedCities] = useState<string>("");
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [currentInterest, setCurrentInterest] = useState<string>("");
    const [addedDateRange, setAddedDateRange] = useState<string>("");
    const [interests, setInterests] = useState<string>("");
    const [tripResult, setTripResult] = useState<TripData | null>(null);
    const [citiesList, setCitiesList] = useState<string[]>([]);
    const [interestsList, setInterestsList] = useState<string[]>([]);
    const [addedLocation, setAddedLocation] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [jobId, setJobId] = useState<string>("");
    // Add at the top with other state declarations
    const [isViewMode, setIsViewMode] = useState(false);
    const router = useRouter();

    const { planTrip, isLoading: isPlanningTrip, error: planningError, itinerary } = usePlanTrip();

      // Add new persistence function
  const persistItineraries = (itineraries: SavedItinerary[]) => {
    try {
      localStorage.setItem('itineraries', JSON.stringify(itineraries));
      sessionStorage.setItem('itineraries_backup', JSON.stringify(itineraries));
    } catch (error) {
      console.error('Error persisting itineraries:', error);
    }
  };

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
  
      // Step 1: Add the clearAllFields function
      const clearAllFields = () => {
        // Clear all state
        setLocation("");
        setAddedLocation("");
        setAddedCities("");
        setCitiesList([]);
        setStartDate(null);
        setEndDate(null);
        setAddedDateRange("");
        setCurrentInterest("");
        setInterestsList([]);
        setTripResult(null);
        setJobId("");
        setIsViewMode(false);
        
        // Clear only session storage
        sessionStorage.removeItem('currentTripState');
        sessionStorage.removeItem('isFirstLoad');

        // Clear URL without affecting localStorage
        window.history.replaceState({}, '', '/agents1');  
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
  if (isViewMode) {
    toast("This is a saved trip - create a new trip to plan changes");
      return;
    }

      const tripData: TripData = {
        location: addedLocation,
        cities: citiesList.join(", "),
        date_range: addedDateRange,
        interests: interestsList.join(", "),
      };

      setLoading(true);
      const result = await planTrip(tripData);      
      setLoading(false);

      if (result) {
        setTripResult(result.result as TripData );
        setJobId(result.job_id);
        console.log("Full result object:", result);
        console.log("Job ID:", result.job_id);
      } else {
        toast.error("Failed to plan trip.");
      }
    };

// Update the handleSaveItinerary function
// In page.tsx, update the handleSaveItinerary function:
const handleSaveItinerary = async () => {
  if (!tripResult || !jobId) {
    toast.error("No trip to save!");
    return;
  }

  setLoading(true); // Show loading state

  try {
    // Format according to our Trip model
    const tripData = {
      job_id: jobId,
      location: addedLocation,
      dateRange: addedDateRange,
      interests: interestsList,
      cities: citiesList,
      content: tripResult,
    };

    console.log("Attempting to save trip:", tripData);

    const response = await fetch('/api/trips', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tripData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save trip');
    }

    const { success, trip } = await response.json();
    if (success) {
      console.log("Trip saved successfully:", trip);
      toast.success('Trip saved successfully!');
    } else {
      throw new Error('Failed to save trip');
    }
  } catch (error) {
    console.error("Error saving trip:", error);
    toast.error(error instanceof Error ? error.message : 'Failed to save trip');
  } finally {
    setLoading(false);
  }
};

// First useEffect - Handles loading saved trips
useEffect(() => {
  // Only run if we have a job_id in URL
  const urlParams = new URLSearchParams(window.location.search);
  const currentJobId = urlParams.get('job_id');

  if (currentJobId) {
    const savedTrip = localStorage.getItem(`saved_trip_${currentJobId}`);
    if (savedTrip) {
      try {
        const parsedTrip = JSON.parse(savedTrip);
        // Load saved trip data
        setTripResult(parsedTrip.content);
        setAddedLocation(parsedTrip.location);
        setAddedDateRange(parsedTrip.dateRange);
        setInterestsList(parsedTrip.interests || []);
        setCitiesList(parsedTrip.cities || []);
        setJobId(currentJobId);
        setIsViewMode(true);  // Important: Set view mode for saved trips
      } catch (error) {
        console.error('Error loading saved trip:', error);
        toast.error('Error loading saved trip');
      }
    }
  } else {
    // Clear view mode if no job_id
    setIsViewMode(false);
  }
}, [window.location.search]); // Only depends on URL search params

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
}, []); // Only runs on mount

return (
  <div className="container mx-auto p-4">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold">Trip Planner</h1>
      <div className="flex gap-2">
      </div>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Trip Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Location */}
          <div>
            <Label htmlFor="location">Location</Label>
            <div className="flex space-x-2">
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter main location"
              />
              <Button onClick={handleAddLocation}>Add Location</Button>
            </div>
            <div className="mt-2">
              <h3 className="font-semibold">Added Location:</h3>
              <p>{addedLocation || "No location added yet."}</p>
            </div>
          </div>

          {/* Cities */}
          <div>
            <Label htmlFor="cities">Cities</Label>
            <div className="flex space-x-2">
              <Input
                id="cities"
                value={addedCities}
                onChange={(e) => setAddedCities(e.target.value)}
                placeholder="Enter cities"
              />
              <Button onClick={handleAddCity}>Add</Button>
            </div>
            <div className="mt-2">
              <h3 className="font-semibold">Added Cities:</h3>
              <p>{citiesList.join(", ") || "No cities added yet."}</p>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <Label>Trip Dates</Label>
            <div className="flex space-x-4">
              <div>
                <Label>Start Date</Label>
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date | null) => setStartDate(date)}
                  dateFormat="MM/dd/yyyy"
                  className="border p-2 rounded"
                />
              </div>
              <div>
                <Label>End Date</Label>
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date | null) => setEndDate(date)}
                  dateFormat="MM/dd/yyyy"
                  className="border p-2 rounded"
                />
                <Button onClick={handleAddDateRange}>Add Date Range</Button>
              </div>
            </div>
            <div className="mt-2">
              <h3 className="font-semibold">Added Date Range:</h3>
              <p>{addedDateRange || "No date range added yet."}</p>
            </div>
          </div>

          {/* Interests */}
          <div>
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

        {/* Output Box for Loader and Result */}
        <div className="mt-4 border p-4 rounded">
          {loading ? (
            <div className="flex items-center">
              <div className="loader" style={{
                display: 'inline-block',
                width: '24px',
                height: '24px',
                border: '3px solid #3498db',
                borderRadius: '50%',
                borderTop: '3px solid transparent',
                animation: 'spin 1s linear infinite'
              }} />
              <span className="ml-2">Processing data...</span>
            </div>
          ) : tripResult ? (
            <div>
              <h2 className="text-xl font-bold">Trip Result:</h2>
              {jobId && ( // Add this section
               <div className="my-2 flex items-center space-x-2">
                <span className="font-medium text-gray-700">Job ID:</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-cyan-600">{jobId}</code>
              </div>
              )}
              <p>{JSON.stringify( tripResult, null, 2)}</p>
            </div>
          ) : (
            <p>Output will be displayed here.</p>
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
      <p className="mt-2 text-gray-600">{addedLocation} {citiesList.length > 0 && `→ ${citiesList.join(' → ')}`}</p>
      <p className="mt-2 text-gray-600">{interestsList.length > 0 ? `Interests: ${interestsList.join(', ')}` : ''}</p>
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
                        <li key={i}>{point}</li>
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
      <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between text-sm text-gray-600">
        <p>www.quipit.com</p>
        <p>greenvalleymotor@gmail.com</p>
        <p>+919830016577</p>
      </div>
    </div>
  </div>  
);
}
