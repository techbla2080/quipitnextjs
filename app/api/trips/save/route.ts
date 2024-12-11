import { connectDB } from '@/lib/mongodb';
import { Trip } from '@/models/Trip';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    
    const trip = await Trip.create({
      location: body.location,
      cities: body.cities,
      dateRange: body.dateRange,
      interests: body.interests,
      jobId: body.jobId,
      tripResult: body.tripResult,
      createdAt: new Date()
    });

    return NextResponse.json({ success: true, trip });
  } catch (error) {
    console.error('Error saving trip:', error);
    return NextResponse.json(
      { success: false, error: 'Error saving trip' },
      { status: 500 }
    );
  }
}