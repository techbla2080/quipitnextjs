"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface TripData {
  location: string;
  cities: string[];
  dateRange: string;
  interests: string[];
  jobId: string;
  tripResult: string;
  createdAt: Date;
}

export default function TripView() {
  const [trip, setTrip] = useState<TripData | null>(null);
  const params = useParams();
  const jobId = params.jobId;

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const response = await fetch(`/api/trips/${jobId}`);
        const data = await response.json();
        if (data.success) {
          setTrip(data.trip);
        }
      } catch (error) {
        console.error('Error fetching trip:', error);
      }
    };

    if (jobId) {
      fetchTrip();
    }
  }, [jobId]);

  if (!trip) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Trip Details</h1>
      <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
        {JSON.stringify(trip, null, 2)}
      </pre>
    </div>
  );
}