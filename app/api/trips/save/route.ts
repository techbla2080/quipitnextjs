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
    
    // Start a session for transaction
    const session = await User.startSession();
    session.startTransaction();

    try {
      // Get user with session
      let user = await User.findOne({ userId }).session(session);
      
      if (!user) {
        user = await User.create([{ 
          userId, 
          tripCount: 0
        }], { session });
        user = user[0]; // Create returns an array
      }

      // Verify trip count
      const existingTrips = await Trip.countDocuments({ userId }).session(session);
      if (existingTrips !== user.tripCount) {
        // Fix the count if it's wrong
        user.tripCount = existingTrips;
        await user.save({ session });
      }

      // Check if under limit
      if (user.tripCount >= 2) {
        await session.abortTransaction();
        return NextResponse.json({
          success: false,
          error: 'Free trip limit reached',
          requiresSubscription: true
        }, { status: 403 });
      }

      const body = await request.json();
    
      // Save trip within transaction
      const trip = await Trip.create([{
        userId,
        location: body.location,
        cities: body.cities,
        dateRange: body.dateRange,
        interests: body.interests,
        jobId: body.jobId,
        tripResult: body.tripResult
      }], { session });

      // Update trip count atomically
      await User.findOneAndUpdate(
        { userId },
        { $inc: { tripCount: 1 } },
        { session, new: true }
      );

      // Commit the transaction
      await session.commitTransaction();

      return NextResponse.json({ 
        success: true, 
        trip: trip[0],
        newTripCount: user.tripCount + 1
      });

    } catch (error) {
      // If anything fails, roll back all changes
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save trip' },
      { status: 500 }
    );
  }
}