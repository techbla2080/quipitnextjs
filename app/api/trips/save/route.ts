import { connectDB } from '@/lib/mongodb';
import { Trip } from '@/models/Trip';
import { NextResponse } from 'next/server';

// app/api/trips/save/route.ts
export async function POST(request: Request) {
  try {
    console.log('1. Starting connection attempt');
    console.log('MongoDB URI exists:', !!process.env.MONGODB_URI); // Will log true/false without exposing the string
    
    await connectDB();
    console.log('2. MongoDB connected successfully');
    
    const body = await request.json();
    console.log('3. Received body:', JSON.stringify(body, null, 2));
    
    const trip = await Trip.create({  
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
    // Detailed error logging
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

export async function GET() {
  try {
    await connectDB();
    const trips = await Trip.find({}).sort({ createdAt: -1 });
    console.log('Fetched trips:', trips); // Debug log
    return NextResponse.json({ success: true, trips });
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trips' },
      { status: 500 }
    );
  }
}