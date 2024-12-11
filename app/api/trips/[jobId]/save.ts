// pages/api/trips/[jobId].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '@/lib/mongodb';
import { Trip } from '@/models/Trip';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    const { jobId } = req.query;

    const trip = await Trip.findOne({ jobId });
    
    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    return res.status(200).json({ success: true, trip });
  } catch (error) {
    console.error('Error fetching trip:', error);
    return res.status(500).json({ success: false, error: 'Error fetching trip' });
  }
}