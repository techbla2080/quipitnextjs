"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function RawTripData() {
  const [tripData, setTripData] = useState(null);
  const params = useParams();

  useEffect(() => {
    // Fetch just this specific trip's data from MongoDB
    fetch(`/api/trips?job_id=${params.jobId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTripData(data.trip);
        }
      });
  }, [params.jobId]);

  // Just show raw data, nothing else
  return (
    <div style={{ padding: '20px' }}>
      <pre>{JSON.stringify(tripData, null, 2)}</pre>
    </div>
  );
}