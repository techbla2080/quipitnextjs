// pages/api/trips/save.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '@/lib/mongodb';
import { Trip } from '@/models/Trip';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();

    const {
      location,
      cities,
      dateRange,
      interests,
      jobId,
      tripResult,
      userId
    } = req.body;

    const trip = await Trip.create({
      location,
      cities,
      dateRange,
      interests,
      jobId,
      tripResult,
      userId
    });

    return res.status(200).json({ success: true, trip });
  } catch (error) {
    console.error('Error saving trip:', error);
    return res.status(500).json({ success: false, error: 'Error saving trip' });
  }
}