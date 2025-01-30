import { connectDB } from '@/lib/mongodb';
import { Trip } from '@/models/Trip';
import { User } from '@/models/User';
import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    
    let user = await User.findOne({ userId });
    
    // If new user, create their record
    if (!user) {
      user = await User.create({ 
        userId, 
        tripCount: 0
      });
    }

    // Check trip count
    if (user.tripCount >= 2) {
      return NextResponse.json({
        success: false,
        error: 'Free trip limit reached',
        requiresSubscription: true
      }, { status: 403 });
    }

    const body = await request.json();
    
    // Save the trip
    const trip = await Trip.create({
      userId,
      location: body.location,
      cities: body.cities,
      dateRange: body.dateRange,
      interests: body.interests,
      jobId: body.jobId,
      tripResult: body.tripResult
    });

    // Increment trip count and get updated user
    user = await User.findOneAndUpdate(
      { userId },
      { $inc: { tripCount: 1 } },
      { new: true } // Return updated document
    );

    return NextResponse.json({ 
      success: true, 
      trip,
      tripCount: user.tripCount,
      remainingTrips: 2 - user.tripCount
    });

  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save trip' },
      { status: 500 }
    );
  }
}