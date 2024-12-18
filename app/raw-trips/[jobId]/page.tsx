"use client";
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function TripDisplay() {
  const params = useParams();
  const [tripData, setTripData] = useState(null);

  useEffect(() => {
    fetch(`/api/trips?job_id=${params.jobId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTripData(data.trip);
        }
      });
  }, [params.jobId]);

  return (
    <div className="p-8">
      <pre>{JSON.stringify(tripData, null, 2)}</pre>
    </div>
  );
}