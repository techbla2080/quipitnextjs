import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Trip } from '@/models/Trip';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    // Get request data
    const data = await req.json();
    
    // Format the trip data
    const tripData = {
      job_id: data.job_id,
      location: data.location,
      dateRange: data.dateRange,
      interests: data.interests, 
      cities: data.cities,
      content: data.content
    };

    // Check if trip already exists
    const existingTrip = await Trip.findOne({ job_id: tripData.job_id });
    
    let trip;
    if (existingTrip) {
      // Update existing trip
      trip = await Trip.findOneAndUpdate(
        { job_id: tripData.job_id },
        tripData,
        { new: true }
      );
    } else {
      // Create new trip
      trip = await Trip.create(tripData);
    }

    return NextResponse.json(trip);
  } catch (error) {
    console.error('Error saving trip:', error);
    return NextResponse.json({ error: 'Failed to save trip' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const trips = await Trip.find().sort({ createdAt: -1 });
    return NextResponse.json(trips);
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const job_id = searchParams.get('job_id');

    if (!job_id) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const result = await Trip.deleteOne({ job_id });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Error deleting trip:', error);
    return NextResponse.json({ error: 'Failed to delete trip' }, { status: 500 });
  }
}