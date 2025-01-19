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
    
    // Add trip limit check
    const user = await User.findOne({ userId });
    
    // If new user, create their record
    if (!user) {
      await User.create({ 
        userId, 
        tripCount: 0
      });
    } else {
      // Check trip count for existing users
      if (user.tripCount >= 2) {
        return NextResponse.json({
          success: false,
          error: 'Free trip limit reached',
          requiresSubscription: true
        }, { status: 403 });
      }
    }

    const body = await request.json();
    
    // Your existing trip save code
    const trip = await Trip.create({
      userId,
      location: body.location,
      cities: body.cities,
      dateRange: body.dateRange,
      interests: body.interests,
      jobId: body.jobId,
      tripResult: body.tripResult
    });

    // Add this to increment trip count after successful save
    await User.findOneAndUpdate(
      { userId },
      { $inc: { tripCount: 1 } }
    );

    return NextResponse.json({ success: true, trip });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save trip' },
      { status: 500 }
    );
  }
}