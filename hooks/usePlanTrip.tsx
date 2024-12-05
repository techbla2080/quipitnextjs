import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/nextjs';

interface TripData {
  location: string;
  cities: string;
  date_range: string;
  interests: string;
}

interface TripResult {
  location: string;
  cities: string;
  date_range: string;
  interests: string;
  itinerary: string;
}

interface TripResponse {
  job_id: string;
  status: string;
  result: TripResult | null;
}

export const usePlanTrip = () => {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [itinerary, setItinerary] = useState<string | null>(null);

  const planTrip = useCallback(async (tripData: TripData): Promise<TripResponse | null> => {
    setIsLoading(true);
    setError(null);
    setItinerary(null);

    try {
      const token = await getToken(); 
      console.log("Retrieved token:", token);

      const updatedTripData = {
        location: String(tripData.location),
        cities: String(tripData.cities),
        date_range: String(tripData.date_range),
        interests: String(tripData.interests),
      };

      console.log("Sending trip data:", updatedTripData);

      const response = await axios.post<TripResponse>(
        'https://triplanner.onrender.com/api/crew', 
        updatedTripData,
        {
          headers: {
            Authorization: `Bearer ${token?.trim()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log("Response from backend:", response.data);

      const jobId = response.data.job_id;
      console.log("Job ID received:", jobId);

      let jobCompleted = false;
      let attempts = 0;
      const maxAttempts = 50;

      while (!jobCompleted && attempts < maxAttempts) {
        const statusResponse = await axios.get<TripResponse>(
          `https://triplanner.onrender.com/api/crew/${jobId}`, 
          {
            headers: {
              Authorization: `Bearer ${token?.trim()}`,
              'Content-Type': 'application/json',
            },
          }
        );

        console.log(`Status check attempt ${attempts + 1}:`, statusResponse.data);

        if (statusResponse.data.status === 'completed') {
          if (statusResponse.data.result) {
            setItinerary(statusResponse.data.result.itinerary);
            console.log("Itinerary received:", statusResponse.data.result.itinerary);
            setIsLoading(false); // End loading only after polling completes
          }
          return statusResponse.data;
        } else {
          attempts += 1;
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

      // If max attempts reached without success, set error
      if (attempts >= maxAttempts) {
        setError(new Error("Trip planning process timed out."));
      }

      setIsLoading(false); // Ensure loading is set to false if max attempts reached
      return null;
      
    } catch (error) {
      setIsLoading(false);
      console.error("Error planning the trip:", error);

      if (axios.isAxiosError(error) && error.code === 'ERR_NETWORK') {
        setError(new Error("Network Error: Unable to reach the backend server. Check server status and CORS settings."));
      } else {
        setError(error as Error);
      }

      return null;
    }
  }, [getToken]);

  return { planTrip, isLoading, error, itinerary };
};
