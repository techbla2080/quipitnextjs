import { connectDB } from '@/lib/mongodb';
import { Trip } from '@/models/Trip';
import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    console.log('1. Starting connection attempt');
    await connectDB();
    console.log('2. MongoDB connected successfully');
    
    const body = await request.json();
    console.log('3. Received body:', JSON.stringify(body, null, 2));
    
    const trip = await Trip.create({
      userId,  // Add userId to the trip
      location: body.location,
      cities: body.cities,
      dateRange: body.dateRange,
      interests: body.interests,
      jobId: body.jobId,
      tripResult: body.tripResult,
      createdAt: new Date()
    });
    
    console.log('4. Trip created successfully:', trip);
    
    return NextResponse.json({ success: true, trip });
  } catch (err) {
    const error = err as Error;
    console.error('Detailed error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      mongoUriExists: !!process.env.MONGODB_URI
    });
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.stack
      },
      { status: 500 }
    );
  }
}