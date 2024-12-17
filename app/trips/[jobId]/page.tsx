"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function TripView() {
  const [tripData, setTripData] = useState(null);
  const params = useParams();

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        // Using your existing trips endpoint
        const response = await fetch(`/api/trips?job_id=${params.jobId}`);
        const data = await response.json();
        if (data.success) {
          setTripData(data.trip);
        }
      } catch (error) {
        console.error('Failed to fetch trip:', error);
      }
    };

    fetchTrip();
  }, [params.jobId]);

  if (!tripData) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Saved Trip Data</h1>
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(tripData, null, 2)}
      </pre>
    </div>
  );
}