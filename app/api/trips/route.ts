import { connectDB } from '@/lib/mongodb';
import { Trip } from '@/models/Trip';
import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { User } from '@/models/User';  // Add this line

export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    await connectDB();
    // Filter trips by userId
    const trips = await Trip.find({ userId }).sort({ createdAt: -1 });
    
    console.log('Fetched trips count:', trips.length);
    
    return NextResponse.json({ 
      success: true, 
      trips: trips || [] 
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trips' },
      { status: 500 }
    );
  }
}

// In your /api/trips/route.ts

export async function DELETE(request: Request) {
  try {
    const { userId } = auth();
    const { job_id } = await request.json();
    
    if (!job_id) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // First delete the trip
    const deletedTrip = await Trip.findOneAndDelete({ jobId: job_id });

    if (deletedTrip) {
      // If trip was deleted, decrease the user's trip count
      await User.findOneAndUpdate(
        { userId },
        { $inc: { tripCount: -1 } } // Decrease count by 1
      );

      // Get updated trip count
      const updatedUser = await User.findOne({ userId });
      const remainingTrips = updatedUser ? updatedUser.tripCount : 0;

      return NextResponse.json({ 
        success: true,
        remainingTrips,
        message: 'Trip deleted successfully'
      });
    }

    return NextResponse.json({ success: false, error: 'Trip not found' });
  } catch (error) {
    console.error('Error deleting trip:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete trip' },
      { status: 500 }
    );
  }
}